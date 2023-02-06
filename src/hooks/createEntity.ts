import { createEffect, createRenderEffect, createSignal } from 'solid-js';
import {
	createStore,
	createMutable,
	modifyMutable,
	produce,
} from 'solid-js/store';
import {
	Vector3,
	Object3D,
	Group,
	AnimationMixer,
	LoadingManager,
} from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
	EOptionsConfig,
	EntityConfig,
	Entity,
	LoadModelsConfig,
	Animations,
	ThreeTarget,
} from '../types/Entity';
import { FiniteStateMachine } from '../types/State';
import useFiniteStateMachine from './useFiniteStateMachine';

type EOCVals = EOptionsConfig[keyof EOptionsConfig];
const defaultOptions: Record<string, EOCVals> = {
	scale: 0.1,
	shadow: true,
	velocity: new Vector3(0, 0, 0),
	acceleration: new Vector3(1, 0.25, 50.0),
	decceleration: new Vector3(-0.0005, -0.0001, -5.0),
} satisfies EOptionsConfig;

const reconcileOptions = (options?: Partial<EOptionsConfig>) => {
	const _options: typeof defaultOptions = options ?? {};

	for (const defaultOption in defaultOptions) {
		_options[defaultOption] ??= defaultOptions[defaultOption];
	}

	return _options as unknown as EOptionsConfig;
};

function createEntity(entityConfig: EntityConfig): Entity {
	const [scene, setScene] = createStore(entityConfig.scene);
	const [camera, setCamera] = createStore(entityConfig.camera);

	const modelsBasePath = './models'; // parent directory is 'public'
	const [modelDir, setModelDir] = createSignal('');
	const [modelName, setModelName] = createSignal('');
	const [modelExt, setModelExt] = createSignal('');

	const animsBasePath = './animations'; // parent directory is 'public'
	const [animsDir, setAnimsDir] = createSignal('');
	const [animNames, setAnimNames] = createStore<string[]>([]);
	const [animsExt, setAnimsExt] = createSignal('');

	const [defaultAnim, setDefaultAnim] = createSignal('');
	const animations = createMutable<Animations>({});
	const [stateMachine, setStateMachine] = createSignal<FiniteStateMachine>();

	const options = reconcileOptions(entityConfig.options);
	const [scale, setScale] = createSignal(options.scale);
	const [shadow, setShadow] = createSignal(options.shadow);
	const [velocity, setVelocity] = createSignal(options.velocity);
	const [acceleration, setAcceleration] = createSignal(options.acceleration);
	const [decceleration, setDecceleration] = createSignal(
		options.decceleration
	);

	const [target, setTarget] = createSignal<Group>(new Group());
	const [manager, setManager] = createStore(new LoadingManager());
	let mixer: AnimationMixer; // CANNOT BE REACTIVE!!!

	// storage for any extraneous data you want tied to the entity
	const [state, setState] = createStore({});

	const getModelPath = (): string =>
		`${modelsBasePath}/${modelExt()}/${modelDir()}/${modelName()}.${modelExt()}`;

	const reconcileAnimPath = (animName: string): string => {
		const [path, _ext] = animName.split('.');
		const [_dir, _name] = path.split('/');

		let dir, name;
		if (_name) {
			dir = _dir;
			name = _name;
		} else {
			dir = animsDir();
			name = _dir;
		}
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		const ext = _ext ?? animsExt(); // "sophisticated linter" my ass lmao

		return `${animsBasePath}/${ext}/${dir}/${name}.${ext}`;
	};

	const sanitizeAnimName = (name: string): string =>
		name.split('.')[0].split('/')[0];

	const readyForStateChange = () => {
		return Object.keys(animations).length > 0;
	};

	const toDefaultState = () => {
		stateMachine()?.changeState(sanitizeAnimName(defaultAnim()));
	};

	const applyShadows = (c: Object3D) => {
		c.castShadow = shadow();
	};

	const onLoad = (anim: ThreeTarget) => {
		const clip = anim.animations[0];
		const action = mixer.clipAction(clip);

		modifyMutable(
			animations,
			produce((_animations) => {
				_animations[
					sanitizeAnimName(animNames[Object.keys(animations).length])
				] = {
					clip,
					action,
				};
			})
		);
	};

	// "proxy" fn necessary for tracking reactivity when branching into onLoad
	const passAnimToLoad = (a: ThreeTarget): void => onLoad(a);

	const loadAnims = (_target: Group): void => {
		_target.scale.setScalar(scale());
		_target.traverse(applyShadows);

		setTarget(_target);
		setScene(produce((_scene) => _scene.add(target())));

		mixer = new AnimationMixer(target());

		setManager(
			produce((_manager) => {
				_manager.onLoad = toDefaultState;
			})
		);

		const loader = new FBXLoader(manager);
		for (const animName of animNames) {
			loader.load(reconcileAnimPath(animName), passAnimToLoad);
		}
	};

	const extractTarget = (model: ThreeTarget, ext: string): Group => {
		switch (ext) {
			case 'gltf':
				return (model as GLTF).scene;
			default:
				return model as Group;
		}
	};

	const loadModel = (ext: string): void =>
		eval(`new ${ext}Loader()`).load(getModelPath(), (model: ThreeTarget) =>
			loadAnims(extractTarget(model, ext))
		);

	const loadModelAndAnims = (loadConfig: LoadModelsConfig): void => {
		setModelDir(loadConfig.parentDir);
		setModelName(loadConfig.modelName);
		setModelExt(loadConfig.modelExt);
		setAnimsDir(loadConfig.animsDir ?? loadConfig.parentDir);
		if (loadConfig.animNames) {
			setAnimNames(loadConfig.animNames);
			setDefaultAnim(loadConfig.animNames[0]);
		}
		setAnimsExt(loadConfig.animsExt ?? loadConfig.modelExt);

		switch (modelExt()) {
			case 'glb':
				loadModel('GLTF');
				break;
			default:
				loadModel(modelExt().toUpperCase());
		}
	};

	const update = (timeInSeconds: number) => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!target()) return;

		stateMachine()?.update(timeInSeconds, entityConfig.inputs);
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (mixer) mixer.update(timeInSeconds);

		const vel = velocity();
		const decc = decceleration();
		const frameDecceleration = new Vector3(
			vel.x * decc.x,
			vel.y * decc.y,
			vel.z * decc.z
		);
		frameDecceleration.multiplyScalar(timeInSeconds);
		frameDecceleration.z =
			Math.sign(frameDecceleration.z) *
			Math.min(Math.abs(frameDecceleration.z), Math.abs(vel.z));

		vel.add(frameDecceleration);

		// const controlObject = getTarget();
		// const q = new Quaternion();
		// const a = new Vector3();
		// const r = controlObject.quaternion.clone();
	};

	return {
		scene,
		camera,

		modelDir,
		modelName,
		modelExt,

		animsDir, // note: this is a default
		animNames,
		animsExt, // note: this is a default

		defaultAnim,
		animations,
		stateMachine,

		scale,
		shadow,
		velocity,
		acceleration,
		decceleration,

		target,
		manager,

		state,

		setScene,
		setCamera,

		setModelDir,
		setModelName,
		setModelExt,

		setAnimsDir,
		setAnimNames,
		setAnimsExt,

		setDefaultAnim,
		setStateMachine,

		setScale,
		setShadow,
		setVelocity,
		setAcceleration,
		setDecceleration,

		setTarget,
		setManager,

		setState,

		readyForStateChange,
		toDefaultState,
		loadModelAndAnims,
		update,
	};
}

export default createEntity;
