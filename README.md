# svg-to-mesh

`svg-to-mesh` is a JavaScript utility function that converts an SVG file into a 3D mesh. This function is ideal for turning 2D vector-based graphics into 3D models that can be used in WebGL or other 3D environments.

## Installation

If you're using a package manager like npm, you can install `svg-to-mesh` by running:

```bash
npm install svg-to-mesh

import { svgToMesh } from 'svg-to-mesh';

const url = 'path/to/your/svg/file.svg';
const options = {
  depth: 2,
  color: '#ff6347',
  position: { x: 0, y: 0, z: 0 },
  scale: 1.5,
}

async function createMesh() {
  const meshGroup = await svgToMesh(url, options);  // Wait for the promise to resolve
  // Now you can use the meshGroup object
}



```
This README provides an explanation of how to install, use, and configure the `svg-to-mesh` function in your project. If you want to make any adjustments to this, feel free to let me know!