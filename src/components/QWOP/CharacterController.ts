import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
	AnimationAction,
	AnimationClip,
	AnimationMixer,
	Camera,
	Group,
	LoadingManager,
	Scene,
	Vector3,
	Quaternion,
} from 'three';

interface CCParams {
	camera: Camera;
	scene: Scene;
}

type Animations = Record<
	string,
	{
		clip: AnimationClip;
		action: AnimationAction;
	}
>;

// type State = any;

class CharacterControllerProxy {
	_animations: Animations;

	constructor(animations: Animations) {
		this._animations = animations;
	}

	get animations() {
		return this._animations;
	}
}

class CharacterControllerInput {
	constructor() {}
}

class FiniteStateMachine {
	_states: Record<string, State>;

	_currentState?: State;

	constructor() {
		this._states = {};
		this._currentState = undefined;
	}

	_AddState(name: string, type: State) {
		this._states[name] = type;
	}

	SetState(name: string) {
		const prevState = this._currentState;

		if (prevState) {
			if (prevState.Name == name) {
				return;
			}
			prevState.Exit();
		}

		const state: State = new this._states[name](this);

		this._currentState = state;
		state.Enter(prevState);
	}

	Update(timeElapsed: number, input) {
		if (this._currentState) {
			this._currentState.Update(timeElapsed, input);
		}
	}
}

class CharacterFSM extends FiniteStateMachine {
	constructor(proxy) {
		super();
		this._proxy = proxy;
		this._Init();
	}

	_Init() {
		this._AddState('idle', IdleState);
		this._AddState('walk', WalkState);
		this._AddState('run', RunState);
		this._AddState('dance', DanceState);
	}
}

class State {
	_parent: any;
	
	readonly Name?: string;

	constructor(parent: any) {
		this._parent = parent;
	}

	Enter() {}

	Exit() {}

	Update() {}
}

class WalkState extends State {
	constructor(parent) {
		super(parent);
	}

	readonly Name = 'walk';

	Enter(prevState) {
		const curAction = this._parent._proxy._animations.walk.action;
		if (prevState) {
			const prevAction =
				this._parent._proxy._animations[prevState.Name].action;

			curAction.enabled = true;

			if (prevState.Name == 'run') {
				const ratio =
					curAction.getClip().duration /
					prevAction.getClip().duration;
				curAction.time = prevAction.time * ratio;
			} else {
				curAction.time = 0.0;
				curAction.setEffectiveTimeScale(1.0);
				curAction.setEffectiveWeight(1.0);
			}

			curAction.crossFadeFrom(prevAction, 0.5, true);
			curAction.play();
		} else {
			curAction.play();
		}
	}

	Exit() {}

	Update(timeElapsed, input) {
		if (input._keys.forward || input._keys.backward) {
			if (input._keys.shift) {
				this._parent.SetState('run');
			}
			return;
		}

		this._parent.SetState('idle');
	}
}

class RunState extends State {
	constructor(parent) {
		super(parent);
	}

	readonly Name = 'run';

	Enter(prevState) {
		const curAction = this._parent._proxy._animations.run.action;
		if (prevState) {
			const prevAction =
				this._parent._proxy._animations[prevState.Name].action;

			curAction.enabled = true;

			if (prevState.Name == 'walk') {
				const ratio =
					curAction.getClip().duration /
					prevAction.getClip().duration;
				curAction.time = prevAction.time * ratio;
			} else {
				curAction.time = 0.0;
				curAction.setEffectiveTimeScale(1.0);
				curAction.setEffectiveWeight(1.0);
			}

			curAction.crossFadeFrom(prevAction, 0.5, true);
			curAction.play();
		} else {
			curAction.play();
		}
	}

	Exit() {}

	Update(timeElapsed, input) {
		if (input._keys.forward || input._keys.backward) {
			if (!input._keys.shift) {
				this._parent.SetState('walk');
			}
			return;
		}

		this._parent.SetState('idle');
	}
}

class IdleState extends State {
	constructor(parent) {
		super(parent);
	}

	readonly Name = 'idle';

	Enter(prevState) {
		const idleAction = this._parent._proxy._animations.idle.action;
		if (prevState) {
			const prevAction =
				this._parent._proxy._animations[prevState.Name].action;
			idleAction.time = 0.0;
			idleAction.enabled = true;
			idleAction.setEffectiveTimeScale(1.0);
			idleAction.setEffectiveWeight(1.0);
			idleAction.crossFadeFrom(prevAction, 0.5, true);
			idleAction.play();
		} else {
			idleAction.play();
		}
	}

	Exit() {}

	Update(_, input) {
		if (input._keys.forward || input._keys.backward) {
			this._parent.SetState('walk');
		} else if (input._keys.space) {
			this._parent.SetState('dance');
		}
	}
}

class CharacterController {
	_params?: CCParams;

	_decceleration?: Vector3;

	_acceleration?: Vector3;

	_velocity?: Vector3;

	_animations?: Animations;

	_stateMachine?: CharacterFSM;

	_target?: Group;

	_mixer?: AnimationMixer;

	_manager?: LoadingManager;

	_input?: any;

	constructor(params: CCParams) {
		this._Init(params);
	}

	_Init(params: CCParams) {
		this._params = params;
		this._decceleration = new Vector3(-0.0005, -0.0001, -5.0);
		this._acceleration = new Vector3(1, 0.25, 50.0);
		this._velocity = new Vector3(0, 0, 0);

		this._animations = {};
		// this._input = new CharacterControllerInput();
		this._stateMachine = new CharacterFSM(
			new CharacterControllerProxy(this._animations)
		);

		this._LoadModels();
	}

	_LoadModels() {
		const loader = new FBXLoader();
		loader.setPath('./models/fbx/qwop/');
		loader.load('Jump.fbx', (fbx) => {
			fbx.scale.setScalar(0.1);
			fbx.traverse((c) => {
				c.castShadow = true;
			});

			this._target = fbx;
			this._params!.scene.add(this._target);

			this._mixer = new AnimationMixer(this._target);

			this._manager = new LoadingManager();
			this._manager.onLoad = () => {
				this._stateMachine!.SetState('idle');
			};

			const onLoad = (animName: string, anim: Group) => {
				const clip = anim.animations[0];
				const action = this._mixer!.clipAction(clip);

				this._animations![animName] = {
					clip,
					action,
				};
			};

			const animLoader = new FBXLoader(this._manager);
			loader.setPath('./models/fbx/qwop/');
			loader.load('walk.fbx', (a) => {
				onLoad('walk', a);
			});
			loader.load('run.fbx', (a) => {
				onLoad('run', a);
			});
			loader.load('idle.fbx', (a) => {
				onLoad('idle', a);
			});
			loader.load('jump.fbx', (a) => {
				onLoad('jump', a);
			});
		});
	}

	Update(timeInSeconds: number) {
		if (!this._target) {
			return;
		}

		this._stateMachine!.Update(timeInSeconds, this._input);

		const velocity = this._velocity;
		const frameDecceleration = new THREE.Vector3(
			velocity!.x * this._decceleration!.x,
			velocity!.y * this._decceleration!.y,
			velocity!.z * this._decceleration!.z
		);
		frameDecceleration.multiplyScalar(timeInSeconds);
		frameDecceleration.z =
			Math.sign(frameDecceleration.z) *
			Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity!.z));

		velocity!.add(frameDecceleration);

		const controlObject = this._target;
		const _Q = new Quaternion();
		const _A = new Vector3();
		const _R = controlObject.quaternion.clone();

		const acc = this._acceleration!.clone();
		if (this._input._keys.shift) {
			acc.multiplyScalar(2.0);
		}

		if (this._stateMachine!._currentState.Name == 'dance') {
			acc.multiplyScalar(0.0);
		}

		if (this._input._keys.forward) {
			velocity.z += acc.z * timeInSeconds;
		}
		if (this._input._keys.backward) {
			velocity.z -= acc.z * timeInSeconds;
		}
		if (this._input._keys.left) {
			_A.set(0, 1, 0);
			_Q.setFromAxisAngle(
				_A,
				4.0 * Math.PI * timeInSeconds * this._acceleration.y
			);
			_R.multiply(_Q);
		}
		if (this._input._keys.right) {
			_A.set(0, 1, 0);
			_Q.setFromAxisAngle(
				_A,
				4.0 * -Math.PI * timeInSeconds * this._acceleration.y
			);
			_R.multiply(_Q);
		}

		controlObject.quaternion.copy(_R);

		const oldPosition = new THREE.Vector3();
		oldPosition.copy(controlObject.position);

		const forward = new THREE.Vector3(0, 0, 1);
		forward.applyQuaternion(controlObject.quaternion);
		forward.normalize();

		const sideways = new THREE.Vector3(1, 0, 0);
		sideways.applyQuaternion(controlObject.quaternion);
		sideways.normalize();

		sideways.multiplyScalar(velocity.x * timeInSeconds);
		forward.multiplyScalar(velocity.z * timeInSeconds);

		controlObject.position.add(forward);
		controlObject.position.add(sideways);

		oldPosition.copy(controlObject.position);

		if (this._mixer) {
			this._mixer.update(timeInSeconds);
		}
	}
}
