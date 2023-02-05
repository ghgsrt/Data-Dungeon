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
} from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import useInputs, { Channels, Output } from '../hooks/useInputs';
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
	inputs: Output;
	options?: Partial<EOptionsConfig>;
}

type ThreeExtension = 'fbx' | 'glb';
export type ThreeLoader = typeof FBXLoader | typeof GLTFLoader;
export type ThreeTarget = Group | GLTF;
export interface LoadModelsConfig {
	parentDir: string;
	modelName: string;
	modelExt: ThreeExtension;
	animsDir?: string;
	animNames?: string[];
	animsExt?: ThreeExtension;
}

export type CreateCustomEntity = (
	scene: Scene,
	camera: Camera,
	inputs: ReturnType<typeof useInputs>
) => Entity;

export interface Entity {
	scene: Scene;
	camera: Camera;

	modelDir: Accessor<string>;
	modelName: Accessor<string>;
	modelExt: Accessor<string>;

	animsDir: Accessor<string>;
	animNames: string[];
	animsExt: Accessor<string>;

	defaultAnim: Accessor<string>;
	animations: Animations;
	stateMachine: Accessor<FiniteStateMachine | undefined>;

	scale: Accessor<number>;
	shadow: Accessor<boolean>;
	velocity: Accessor<Vector3>;
	acceleration: Accessor<Vector3>;
	decceleration: Accessor<Vector3>;

	target: Accessor<Group>;
	manager: LoadingManager;

	state: Record<string, any>;

	setScene: SetStoreFunction<Scene>;
	setCamera: SetStoreFunction<Camera>;

	setModelDir: Setter<string>;
	setModelName: Setter<string>;
	setModelExt: Setter<string>;

	setAnimsDir: Setter<string>; // note: this is a default
	setAnimNames: SetStoreFunction<string[]>;
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

	readyForStateChange: () => boolean;
	toDefaultState: () => void;
	loadModelAndAnims: (loadConfig: LoadModelsConfig) => void;
	update: (timeInSeconds: number) => void;
}
