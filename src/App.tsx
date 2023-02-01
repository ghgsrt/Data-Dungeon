import { createSignal, onMount } from 'solid-js';
import * as THREE from 'three';
import init from './JumpModel.js';

// import Test from './components/Test';
import './App.css';

function App() {
	// const scene = new THREE.Scene();
	// const camera = new THREE.PerspectiveCamera(
	// 	75,
	// 	window.innerWidth / window.innerHeight,
	// 	0.1,
	// 	1000
	// );

	// const renderer = new THREE.WebGLRenderer();
	// renderer.setSize(window.innerWidth, window.innerHeight);
	// document.body.appendChild(renderer.domElement);

	// const geometry = new THREE.BoxGeometry(1, 1, 1);
	// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	// const cube = new THREE.Mesh(geometry, material);
	// scene.add(cube);

	// camera.position.z = 5;

	// function animate() {
	// 	requestAnimationFrame(animate);

	// 	cube.rotation.x += 0.01;
	// 	cube.rotation.y += 0.01;

	// 	renderer.render(scene, camera);
	// }

	// animate();
	let container: HTMLDivElement;
	onMount(() => {
		init(container);
	});
	return (
		<>
			<div ref={container} id="container"></div>
			<div id="info">
				<a href="https://threejs.org" target="_blank" rel="noopener">
					three.js
				</a>{' '}
				- Skeletal Additive Animation Blending (model from{' '}
				<a
					href="https://www.mixamo.com/"
					target="_blank"
					rel="noopener"
				>
					mixamo.com
				</a>
				)<br />
			</div>
		</>
	);
}

export default App;
