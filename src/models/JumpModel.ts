import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';

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
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const gui = new GUI();
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const animationsFolder = gui.addFolder('Animations');
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
animationsFolder.open();

fbxLoader.load(
	'models/fbx/Jump.fbx',
	(model) => {
		model.scale.set(0.01, 0.01, 0.01);
		mixer = new THREE.AnimationMixer(model);

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
		console.log(`${(xhr.loaded / xhr.total) * 100} % loaded`);
	},
	(error) => {
		console.log(error);
	}
);

const stats = Stats();

const clock = new THREE.Clock();

function render() {
	renderer.render(scene, camera);
}

let animateId: number;
function animate() {
	animateId = requestAnimationFrame(animate);
	controls.update();

	if (modelReady) mixer.update(clock.getDelta());

	render();

	stats.update();

	return animateId;
}

export default function init() {
	return {
		initModel: (container: HTMLDivElement) => {
			animate();
			container.appendChild(renderer.domElement);
			container.appendChild(stats.dom);
		},
		destroyModel: () => cancelAnimationFrame(animateId),
	};
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	render();
}
window.addEventListener('resize', onWindowResize, false);
