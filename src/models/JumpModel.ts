// import {
// 	Scene,
// 	AxesHelper,
// 	PointLight,
// 	PerspectiveCamera,
// 	WebGLRenderer,
// 	AnimationAction,
// 	AnimationMixer,
// 	Clock,
// 	Object3D,
// } from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
// import Stats from 'three/examples/jsm/libs/stats.module';
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
// import useEventListener from '../hooks/useEventListener';

// const scene = new Scene();
// scene.add(new AxesHelper(5));

// const light = new PointLight();
// light.position.set(2.5, 7.5, 15);
// scene.add(light);

// const camera = new PerspectiveCamera(
// 	75,
// 	window.innerWidth / window.innerHeight,
// 	0.1,
// 	1000
// );
// camera.position.set(0.8, 1.4, 1.0);

// const renderer = new WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.target.set(0, 1, 0);

// let mixer: AnimationMixer;
// let modelReady = false;
// const animationActions: AnimationAction[] = [];
// let activeAction: AnimationAction;
// let lastAction: AnimationAction;
// const fbxLoader: FBXLoader = new FBXLoader();

// const setAction = (toAction: AnimationAction) => {
// 	if (toAction != activeAction) {
// 		lastAction = activeAction;
// 		activeAction = toAction;
// 		//lastAction.stop()
// 		lastAction.fadeOut(1);
// 		activeAction.reset();
// 		activeAction.fadeIn(1);
// 		activeAction.play();
// 	}
// };

// const animations = {
// 	default: () => {
// 		setAction(animationActions[0]);
// 	},
// 	jump: () => {
// 		setAction(animationActions[1]);
// 	},
// };

// // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
// const gui = new GUI();
// // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// const animationsFolder = gui.addFolder('Animations');
// // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// animationsFolder.open();

// fbxLoader.load(
// 	'models/fbx/Jump.fbx',
// 	(model) => {
// 		model.scale.set(0.01, 0.01, 0.01);
// 		mixer = new AnimationMixer(model);

// 		const rawAnimations = (model as Object3D).animations;

// 		animationActions.push(mixer.clipAction(rawAnimations[1]));
// 		animationActions.push(mixer.clipAction(rawAnimations[0]));
// 		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// 		animationsFolder.add(animations, 'default');
// 		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// 		animationsFolder.add(animations, 'jump');
// 		activeAction = animationActions[0];

// 		modelReady = true;

// 		scene.add(model);
// 	},
// 	(xhr) => {
// 		console.log(`${(xhr.loaded / xhr.total) * 100} % loaded`);
// 	},
// 	(error) => {
// 		console.log(error);
// 	}
// );

// const stats = Stats();
// const clock = new Clock();

// function render() {
// 	renderer.render(scene, camera);
// }

// let animateId: number;
// function animate() {
// 	animateId = requestAnimationFrame(animate);
// 	controls.update();

// 	if (modelReady) mixer.update(clock.getDelta());

// 	render();

// 	stats.update();

// 	return animateId;
// }

// export default function init() {
// 	return {
// 		initModel: (container: HTMLDivElement) => {
// 			container.appendChild(renderer.domElement);
// 			container.appendChild(stats.dom);
// 			animate();
// 		},
// 		destroyModel: () => cancelAnimationFrame(animateId),
// 	};
// }

// function onWindowResize() {
// 	camera.aspect = window.innerWidth / window.innerHeight;
// 	camera.updateProjectionMatrix();
// 	renderer.setSize(window.innerWidth, window.innerHeight);
// 	render();
// }
// useEventListener('resize', onWindowResize, false);
