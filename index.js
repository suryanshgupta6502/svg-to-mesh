import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export async function svgToMesh(url, options = { depth: 50, color: 0x00ffff , position: new THREE.Vector3(0, 1, 0) }) {
    try {
        const loader = new SVGLoader();
        const data = await loader.loadAsync(url);

        const group = new THREE.Group();
        for (const path of data.paths) {
            const shapes = SVGLoader.createShapes(path);
            for (const shape of shapes) {
                const geometry = new THREE.ExtrudeGeometry(shape, {
                    depth: options.depth,
                    bevelEnabled: false,
                });

                const material = new THREE.MeshStandardMaterial({
                    color: options.color,
                    side: THREE.DoubleSide,
                });

                const mesh = new THREE.Mesh(geometry, material);
                group.add(mesh);
            }
        }


        const box = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();

        box.getCenter(center);
        group.position.sub(center); // Move to (0,0,0)

        // group.children.forEach((child) => {
        //     child.position.sub(center);
        // });
        // console.log(position);
        // console.log(center, group.position, group.position.sub(center));
        // console.log(group.position);
        group.position.add(options.position)
        // console.log(group.position);


        return group;
    } catch (error) {
        console.error('Error loading SVG:', error);
        throw error;
    }
}
