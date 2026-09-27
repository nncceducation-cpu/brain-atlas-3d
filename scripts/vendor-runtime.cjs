const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const copies = {
  'node_modules/three/build/three.min.js': 'vendor/three-r137.min.js',
  'node_modules/three/examples/js/loaders/GLTFLoader.js': 'vendor/GLTFLoader-r137.js',
  'node_modules/three/examples/js/loaders/DRACOLoader.js': 'vendor/DRACOLoader-r137.js',
  'node_modules/three/examples/js/loaders/STLLoader.js': 'vendor/STLLoader-r137.js',
  'node_modules/react/umd/react.production.min.js': 'vendor/react-18.3.1.min.js',
  'node_modules/react-dom/umd/react-dom.production.min.js': 'vendor/react-dom-18.3.1.min.js',
  'node_modules/@babel/standalone/babel.min.js': 'vendor/babel-7.29.0.min.js'
};

for (const [from, to] of Object.entries(copies)) {
  const source = path.join(root, from);
  const destination = path.join(root, to);
  if (!fs.existsSync(source)) throw new Error(`Missing ${from}; run npm install first.`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  console.log(`${from} -> ${to}`);
}
