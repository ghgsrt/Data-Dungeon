import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(5));

const light = new THREE.PointLight();
light.position.set(2.5, 7.5, 15);
scene.add(light);

const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
camera.position.set(0.8, 1.4, 1.0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

let mixer: THREE.AnimationMixer;
let modelReady = false;
const animationActions: THREE.AnimationAction[] = [];
let activeAction: THREE.AnimationAction;
let lastAction: THREE.AnimationAction;
const fbxLoader: FBXLoader = new FBXLoader();

const setAction = (toAction: THREE.AnimationAction) => {
	if (toAction != activeAction) {
		lastAction = activeAction;
		activeAction = toAction;
		//lastAction.stop()
		lastAction.fadeOut(1);
		activeAction.reset();
		activeAction.fadeIn(1);
		activeAction.play();
	}
};

const animations = {
	default: function () {
		setAction(animationActions[0]);
	},
	jump: function () {
		setAction(animationActions[1]);
	},
	bellydance: function () {
		setAction(animationActions[2]);
	},
	goofyrunning: function () {
		setAction(animationActions[3]);
	},
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const gui = new GUI();
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const animationsFolder = gui.addFolder('Animations');
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
animationsFolder.open();

fbxLoader.load(
	'models/gltf/Jump.fbx',
	(model) => {
		model.scale.set(0.01, 0.01, 0.01);
		mixer = new THREE.AnimationMixer(model);

		// console.log(JSON.stringify((model as THREE.Object3D).animations));
		const animationAction = mixer.clipAction(
			(model as THREE.Object3D).animations[0]
		);

		const _animations = (model as THREE.Object3D).animations;
		console.log(_animations.length);
		// animationActions.push(animationAction);
		animationActions.push(mixer.clipAction(_animations[1]));
		animationActions.push(mixer.clipAction(_animations[0]));
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		animationsFolder.add(animations, 'default');
		animationsFolder.add(animations, 'jump');
		activeAction = animationActions[0];

		modelReady = true;

		scene.add(model);
	},
	(xhr) => {
		// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
		console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
	},
	(error) => {
		console.log(error);
	}
);

const stats = Stats();
document.body.appendChild(stats.dom);

const clock = new THREE.Clock();

function render() {
	renderer.render(scene, camera);
}

function animate() {
	requestAnimationFrame(animate);

	controls.update();

	if (modelReady) mixer.update(clock.getDelta());

	render();

	stats.update();
}

export default function init(container: HTMLDivElement) {
	container.appendChild(renderer.domElement);

	animate();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	render();
}
window.addEventListener('resize', onWindowResize, false);
