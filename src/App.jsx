import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { svgToMesh } from './svgToMesh.js';
import { OrbitControls } from '@react-three/drei';

export default function App() {
  const [mesh, setMesh] = useState(null);

  useEffect(() => {
    svgToMesh('genetic-data-svgrepo-com.svg')
      .then(setMesh)
      .catch(console.error);
  }, []);


  console.log(mesh);

  return (
    <Canvas>
      <color attach={'background'} args={['black']} />
      <ambientLight />
      {/* <mesh>
        <boxGeometry />
        <meshNormalMaterial />
      </mesh> */}
      <pointLight position={[0, 0, 0]} intensity={100} />
      {mesh && <primitive object={mesh} />}
      <OrbitControls />
    </Canvas>
  );
}
