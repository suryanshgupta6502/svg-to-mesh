import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';


function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');

    // Handle short form like "#fff"
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    const bigint = parseInt(hex, 16);

    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return new THREE.Color(`rgb(${r}, ${g}, ${b})`);
}

function rgbStringToHex(rgb) {
    return "#" + rgb.match(/\d+/g).map(x =>
        (+x).toString(16).padStart(2, '0')
    ).join('');
}


function averageHexColors(colors) {
    const rgb = colors?.map(color => {
        if (String(color).includes("rgb")) {
            color = rgbStringToHex(color)

        }

        const n = parseInt(color.replace("#", ""), 16);
        return [n >> 16, (n >> 8) & 255, n & 255];
    });

    const len = colors.length;
    const avg = rgb.reduce(
        (acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b],
        [0, 0, 0]
    ).map(v => Math.round(v / len));

    return `#${((1 << 24) + (avg[0] << 16) + (avg[1] << 8) + avg[2]).toString(16).slice(1)}`;
}


function getUrlName(name) {
    const url = String(name)
    let firstindex = url.indexOf('#') + 1
    let lastindex = url.lastIndexOf('"')
    const id = url.slice(firstindex, lastindex);
    return id;
}


export async function svgToMesh(url, options = { depth, position: new THREE.Vector3(), scale: new THREE.Vector3() }) {
    try {
        const {
            depth = 50,
            position = new THREE.Vector3(0, 0, 0),
            scale = new THREE.Vector3(1, 1, 1),
        } = options


        let material
        const group = new THREE.Group();
        let colors = []
        let stops = []




        const loader = new SVGLoader();
        const data = await loader.loadAsync(url);



        data.xml.querySelectorAll("path").forEach(each => {
            const fillvalue = each.getAttribute("fill") || each.style.fill
            if (fillvalue.includes("url")) {
                // is gradient

                const name = getUrlName(fillvalue)

                data.xml.querySelector('#' + name).querySelectorAll("stop").forEach(each => {
                    let color = each.getAttribute("stop-color")
                    let offset = each.getAttribute("offset")

                    if (!colors[name]) {
                        colors[name] = [];
                        stops[name] = [];
                    }

                    if (color.includes("#")) { color = hexToRgb(color) }
                    if (offset.includes("%")) { offset = Number(offset.replace("%", '')) }

                    stops[name].push(offset)
                    colors[name].push(color)
                })

            }

        });





        for (let i = 0; i < data.paths.length; i++) {
            const path = data.paths[i]

            if (path.userData.style.fill.includes("url")) {

                const stoplength = stops[getUrlName(path.userData.style.fill)].length
                material = new THREE.ShaderMaterial({
                    defines: {
                        MAX_STOPS: (stoplength),
                    },
                    vertexShader: `
						varying vec2 vUv;
						void main() {
						vUv = uv;  // pass UV to fragment shader
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
						}
						`,
                    fragmentShader: `
					
						uniform vec3 uColors[MAX_STOPS];
						uniform float uStops[MAX_STOPS];
						varying vec2 vUv;


						// vec3 srgbToLinear(vec3 c) {
                        //         return pow(c, vec3(1.5));
                        //     }

                        //  vec3 linearToSrgb(vec3 c) {
                        //         return pow(c, vec3(1.0 / 1.0));
                        //     }

                            vec3 srgbToLinear(vec3 c) {
                                return pow(c, vec3(2.0)); 
                                // or use 2.0/2.4 depending on gamma assumptions
                            }

                            vec3 linearToSrgb(vec3 c) {
                                return pow(c, vec3(1.0 / 2.0));
                            }

                            vec3 getGradientColor(float t) {
                                vec3 result = uColors[0];

                                for (int i = 0; i < MAX_STOPS - 1; i++) {
                                    float stopA = uStops[i];
                                    float stopB = uStops[i + 1];
                                    if (t >= stopA && t <= stopB) {
                                        float f = (t - stopA) / (stopB - stopA);
                                        // result = mix(uColors[i], uColors[i + 1], f);
                                        // break;


                                        // Convert to linear
                                        vec3 colA = srgbToLinear(uColors[i]);
                                        vec3 colB = srgbToLinear(uColors[i + 1]);

                                        // Interpolate in linear space
                                        result = mix(colA, colB, f);

                                        // Convert back to sRGB
                                        result = linearToSrgb(result);
                                    }
                                }
                                return linearToSrgb(result);
                            }






						void main() {
							

                             float gradientStart = uStops[0];
                            float gradientEnd = uStops[MAX_STOPS - 1];

                            // Map vUv.y (0.0 to 1.0) to stop range (e.g., 0.0 to 100.0)
                            float t = mix(gradientStart, gradientEnd,vUv.y);

                            vec3 color = getGradientColor(t);
                            gl_FragColor = vec4(color, 1.0);
						}

						`,
                    side: THREE.DoubleSide,

                    uniforms: {
                        uColors: { value: colors[getUrlName(path.userData.style.fill)] },
                        uStops: { value: stops[getUrlName(path.userData.style.fill)] },

                    },





                });



            }
            else if (String(path.userData.style.fill).charAt(0) == '#' || String(path.userData.style.fill).includes("rgb")) {
                material = new THREE.MeshBasicMaterial({ color: path.userData.style.fill })
            }





            const shapes = SVGLoader.createShapes(path);


            for (const shape of shapes) {
                const geometry = new THREE.ExtrudeGeometry(shape, {
                    depth: depth,
                    bevelEnabled: false,
                });



                geometry.computeBoundingBox();
                const bbox = geometry.boundingBox;
                const size = new THREE.Vector2(
                    bbox.max.x - bbox.min.x,
                    bbox.max.y - bbox.min.y
                );
                const uvArray = [];
                const posAttr = geometry.attributes.position;
                for (let i = 0; i < posAttr.count; i++) {
                    const x = posAttr.getX(i);
                    const y = posAttr.getY(i); // use only x and y for UV projection
                    const u = (x - bbox.min.x) / size.x;
                    const v = (y - bbox.min.y) / size.y;
                    uvArray.push(u, v);
                }
                geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));




                const mesh = new THREE.Mesh(geometry, material);
                // to flip in y
                mesh.scale.y = -1;
                mesh.position.z += i * (scale.z / 1);
                group.add(mesh);
            }
        }





        group.scale.set(scale.x, scale.y, scale.z)



        const box = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();
        box.getCenter(center);
        group.position.sub(center);
        group.position.add(position)


        return group;
    } catch (error) {
        console.error('Error loading SVG:', error);
        throw error;
    }
}
