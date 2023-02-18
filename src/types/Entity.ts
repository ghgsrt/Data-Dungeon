import { Accessor, Setter } from 'solid-js';
import { SetStoreFunction } from 'solid-js/store';
import {
	Scene,
	Camera,
	Vector3,
	Group,
	LoadingManager,
	AnimationClip,
	AnimationAction,
	SkeletonHelper,
} from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import useInputs from '../hooks/useInputs';
import { Codes, KeysOrCodes } from './KeyCodes';
import { FiniteStateMachine } from './State';

export type Animations = Record<
	string,
	{
		clip: AnimationClip;
		action: AnimationAction;
	}
>;

export interface EOptionsConfig {
	acceleration: Vector3;
	decceleration: Vector3;
	velocity: Vector3;
	shadow: boolean;
	scale: number;
}

export interface EntityConfig {
	scene: Scene;
	camera: Camera;
	state?: Record<string, any>;
	options?: Partial<EOptionsConfig>;
}

type ThreeExtension = 'fbx' | 'glb' | 'gltf';
export type ThreeLoader = FBXLoader | GLTFLoader;
export type ThreeTarget = Group | GLTF;
export interface LoadModelsConfig {
	parentDir: string;
	modelName: string;
	modelExt: ThreeExtension;
	animsDir?: string;
	animNames?: string[];
	additAnimNames?: string[];
	animsExt?: ThreeExtension;
}

export type CreateCustomEntity<I extends KeysOrCodes = Codes> = (
	scene: Scene,
	camera: Camera,
	inputs?: ReturnType<typeof useInputs<I>>
) => Entity;

export interface Entity {
	scene: Scene;
	camera: Camera;

	modelDir: Accessor<string>;
	modelName: Accessor<string>;
	modelExt: Accessor<string>;
	modelReady: Accessor<boolean>;

	animsDir: Accessor<string>;
	animNames: string[];
	additAnimNames: string[];
	animsExt: Accessor<string>;

	defaultAnim: Accessor<string>;
	animations: Animations;
	stateMachine: Accessor<FiniteStateMachine | undefined>;

	scale: Accessor<number>;
	shadow: Accessor<boolean>;
	velocity: Accessor<Vector3>;
	acceleration: Accessor<Vector3>;
	decceleration: Accessor<Vector3>;

	target: Accessor<Group | undefined>;
	skellyboi: Accessor<SkeletonHelper | undefined>;
	manager: LoadingManager;

	state: Record<string, any>;

	setScene: SetStoreFunction<Scene>;
	setCamera: SetStoreFunction<Camera>;

	setModelDir: Setter<string>;
	setModelName: Setter<string>;
	setModelExt: Setter<string>;

	setAnimsDir: Setter<string>; // note: this is a default
	setAnimNames: SetStoreFunction<string[]>;
	setAdditAnimNames: SetStoreFunction<string[]>;
	setAnimsExt: Setter<string>; // note: this is a default

	setDefaultAnim: Setter<string>;
	setStateMachine: Setter<FiniteStateMachine | undefined>;

	setScale: Setter<number>;
	setShadow: Setter<boolean>;
	setVelocity: Setter<Vector3>;
	setAcceleration: Setter<Vector3>;
	setDecceleration: Setter<Vector3>;

	setTarget: Setter<Group>;
	setManager: SetStoreFunction<LoadingManager>;

	setState: SetStoreFunction<Record<string, any>>;

	onUpdate: (fn: Entity['update']) => void;
	readyForStateChange: () => boolean;
	toDefaultState: () => void;
	toggleAdditAction: (
		name: string,
		weight: number,
		pressed: boolean,
		timeScale: number
	) => void;
	loadModelAndAnims: (loadConfig: LoadModelsConfig) => void;
	update: (timeInSeconds: number) => void;
}
