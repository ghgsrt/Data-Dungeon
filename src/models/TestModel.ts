// // import * as THREE from 'three';

// import Stats from 'three/examples/jsm/libs/stats.module';
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// let scene: THREE.Scene, renderer: THREE.Renderer, camera, stats;
// let model, skeleton, mixer: THREE.AnimationMixer, clock: THREE.Clock;

// const crossFadeControls: any[] = [];

// let currentBaseAction = 'idle';
// const allActions = [];
// const baseActions: Record<
// 	string,
// 	Record<string, number | THREE.AnimationAction>
// > = {
// 	idle: { weight: 1 },
// 	walk: { weight: 0 },
// 	run: { weight: 0 },
// 	jump: { weight: 1 },
// };
// const additiveActions: Record<
// 	string,
// 	Record<string, number | THREE.AnimationAction>
// > = {
// 	sneak_pose: { weight: 0 },
// 	sad_pose: { weight: 0 },
// 	agree: { weight: 0 },
// 	headShake: { weight: 0 },
// };
// let panelSettings: Record<string, number | (() => void)>, numAnimations: number;

// function setWeight(action: THREE.AnimationAction, weight: number) {
// 	action.enabled = true;
// 	action.setEffectiveTimeScale(1);
// 	action.setEffectiveWeight(weight);
// }

// function activateAction(action: THREE.AnimationAction) {
// 	const clip = action.getClip();
// 	// linter issue
// 	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
// 	const settings = baseActions[clip.name] || additiveActions[clip.name];
// 	setWeight(action, settings.weight as number);
// 	action.play();
// }

// function modifyTimeScale(speed: number) {
// 	mixer.timeScale = speed;
// }

// function executeCrossFade(
// 	startAction: THREE.AnimationAction,
// 	endAction: THREE.AnimationAction,
// 	duration: number
// ) {
// 	// Not only the start action, but also the end action must get a weight of 1 before fading
// 	// (concerning the start action this is already guaranteed in this place)

// 	if (endAction) {
// 		setWeight(endAction, 1);
// 		endAction.time = 0;

// 		if (startAction) {
// 			// Crossfade with warping

// 			startAction.crossFadeTo(endAction, duration, true);
// 		} else {
// 			// Fade in

// 			endAction.fadeIn(duration);
// 		}
// 	} else {
// 		// Fade out

// 		startAction.fadeOut(duration);
// 	}
// }

// function synchronizeCrossFade(
// 	startAction: THREE.AnimationAction,
// 	endAction: THREE.AnimationAction,
// 	duration: number
// ) {
// 	const onLoopFinished = (event: THREE.Event) => {
// 		if (event.action === startAction) {
// 			mixer.removeEventListener('loop', onLoopFinished);

// 			executeCrossFade(startAction, endAction, duration);
// 		}
// 	}

// 	mixer.addEventListener('loop', onLoopFinished);
// }

// function prepareCrossFade(
// 	startAction: THREE.AnimationAction,
// 	endAction: THREE.AnimationAction,
// 	duration: number
// ) {
// 	// If the current action is 'idle', execute the crossfade immediately;
// 	// else wait until the current action has finished its current loop

// 	if (currentBaseAction === 'idle' || !startAction || !endAction) {
// 		executeCrossFade(startAction, endAction, duration);
// 	} else {
// 		synchronizeCrossFade(startAction, endAction, duration);
// 	}

// 	// Update control colors

// 	if (endAction) {
// 		const clip = endAction.getClip();
// 		currentBaseAction = clip.name;
// 	} else {
// 		currentBaseAction = 'None';
// 	}

// 	crossFadeControls.forEach((control) => {
// 		const name = control.property;

// 		if (name === currentBaseAction) {
// 			control.setActive();
// 		} else {
// 			control.setInactive();
// 		}
// 	});
// }

// function animate() {
// 	// Render loop
// 	requestAnimationFrame(animate);

// 	for (let i = 0; i !== numAnimations; ++i) {
// 		const action = allActions[i];
// 		const clip = action.getClip();
// 		const settings = baseActions[clip.name] || additiveActions[clip.name];
// 		settings.weight = action.getEffectiveWeight();
// 	}

// 	// Get the time elapsed since the last frame, used for mixer update

// 	const mixerUpdateDelta = clock.getDelta();

// 	// Update the animation mixer, the stats panel, and render this frame

// 	mixer.update(mixerUpdateDelta);

// 	stats.update();

// 	renderer.render(scene, camera);
// }

// function createPanel() {
// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
// 	const panel = new GUI({ width: 310 });

// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// 	const folder1 = panel.addFolder('Base Actions');
// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// 	const folder2 = panel.addFolder('Additive Action Weights');
// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// 	const folder3 = panel.addFolder('General Speed');

// 	panelSettings = {
// 		'modify time scale': 1.0,
// 	};

// 	const baseNames = ['None', ...Object.keys(baseActions)];

// 	for (let i = 0, l = baseNames.length; i !== l; ++i) {
// 		const name = baseNames[i];
// 		const settings = baseActions[name];
// 		// eslint-disable-next-line @typescript-eslint/no-loop-func
// 		panelSettings[name] = () => {
// 			const currentSettings = baseActions[currentBaseAction];
// 			const currentAction = currentSettings
// 				? currentSettings.action
// 				: null;
// 			const action = settings ? settings.action : null;

// 			if (currentAction !== action) {
// 				prepareCrossFade(currentAction, action, 0.35);
// 			}
// 		};

// 		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// 		crossFadeControls.push(folder1.add(panelSettings, name));
// 	}

// 	for (const name of Object.keys(additiveActions)) {
// 		const settings = additiveActions[name];

// 		panelSettings[name] = settings.weight as number;
// 		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// 		folder2
// 			.add(panelSettings, name, 0.0, 1.0, 0.01)
// 			.listen()
// 			.onChange((weight: number) => {
// 				setWeight(settings.action as THREE.AnimationAction, weight);
// 				settings.weight = weight;
// 			});
// 	}

// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// 	folder3
// 		.add(panelSettings, 'modify time scale', 0.0, 1.5, 0.01)
// 		.onChange(modifyTimeScale);

// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// 	folder1.open();
// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// 	folder2.open();
// 	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// 	folder3.open();

// 	crossFadeControls.forEach((control) => {
// 		control.setInactive = () => {
// 			control.domElement.classList.add('control-inactive');
// 		};

// 		control.setActive = () => {
// 			control.domElement.classList.remove('control-inactive');
// 		};

// 		const settings = baseActions[control.property];

// 		if (!settings || !settings.weight) {
// 			control.setInactive();
// 		}
// 	});
// }

// function onWindowResize() {
// 	camera.aspect = window.innerWidth / window.innerHeight;
// 	camera.updateProjectionMatrix();

// 	renderer.setSize(window.innerWidth, window.innerHeight);
// }

// export default function init(container: HTMLDivElement) {
// 	// const container = document.getElementById('container');
// 	clock = new THREE.Clock();

// 	scene = new THREE.Scene();
// 	scene.background = new THREE.Color(0xa0a0a0);
// 	scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

// 	const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
// 	hemiLight.position.set(0, 20, 0);
// 	scene.add(hemiLight);

// 	const dirLight = new THREE.DirectionalLight(0xffffff);
// 	dirLight.position.set(3, 10, 10);
// 	dirLight.castShadow = true;
// 	dirLight.shadow.camera.top = 2;
// 	dirLight.shadow.camera.bottom = -2;
// 	dirLight.shadow.camera.left = -2;
// 	dirLight.shadow.camera.right = 2;
// 	dirLight.shadow.camera.near = 0.1;
// 	dirLight.shadow.camera.far = 40;
// 	scene.add(dirLight);

// 	// ground

// 	const mesh = new THREE.Mesh(
// 		new THREE.PlaneGeometry(100, 100),
// 		new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
// 	);
// 	mesh.rotation.x = -Math.PI / 2;
// 	mesh.receiveShadow = true;
// 	scene.add(mesh);

// 	const loader = new GLTFLoader();
// 	loader.load('models/gltf/Jump.glb', function (gltf) {
// 		model = gltf.scene;
// 		scene.add(model);

// 		model.traverse((object) => {
// 			if (object.isMesh) object.castShadow = true;
// 		});

// 		skeleton = new THREE.SkeletonHelper(model);
// 		skeleton.visible = false;
// 		scene.add(skeleton);

// 		const animations = gltf.animations;
// 		mixer = new THREE.AnimationMixer(model);

// 		numAnimations = animations.length;

// 		for (let i = 0; i !== numAnimations; ++i) {
// 			let clip = animations[i];
// 			const name = clip.name;

// 			// linter issue
// 			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
// 			if (baseActions[name]) {
// 				const action = mixer.clipAction(clip);
// 				activateAction(action);
// 				baseActions[name].action = action;
// 				allActions.push(action);
// 			} else if (additiveActions[name]) {
// 				// Make the clip additive and remove the reference frame

// 				THREE.AnimationUtils.makeClipAdditive(clip);

// 				if (clip.name.endsWith('_pose')) {
// 					clip = THREE.AnimationUtils.subclip(
// 						clip,
// 						clip.name,
// 						2,
// 						3,
// 						30
// 					);
// 				}

// 				const action = mixer.clipAction(clip);
// 				activateAction(action);
// 				additiveActions[name].action = action;
// 				allActions.push(action);
// 			}
// 		}

// 		createPanel();

// 		animate();
// 	});

// 	renderer = new THREE.WebGLRenderer({ antialias: true });
// 	renderer.setPixelRatio(window.devicePixelRatio);
// 	renderer.setSize(window.innerWidth, window.innerHeight);
// 	renderer.outputEncoding = THREE.sRGBEncoding;
// 	renderer.shadowMap.enabled = true;
// 	container.appendChild(renderer.domElement);

// 	// camera
// 	camera = new THREE.PerspectiveCamera(
// 		45,
// 		window.innerWidth / window.innerHeight,
// 		1,
// 		100
// 	);
// 	camera.position.set(-1, 2, 3);

// 	const controls = new OrbitControls(camera, renderer.domElement);
// 	controls.enablePan = false;
// 	controls.enableZoom = false;
// 	controls.target.set(0, 1, 0);
// 	controls.update();

// 	stats = new Stats();
// 	container.appendChild(stats.dom);

// 	window.addEventListener('resize', onWindowResize);
// }
