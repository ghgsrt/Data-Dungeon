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
import { Channels } from '../hooks/useInputs';
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
	inputs: Channels;
	options?: Partial<EOptionsConfig>;
}

type ThreeExtensions = 'fbx' | 'glb';
export interface LoadModelsConfig {
	parentDir: string;
	modelName: string;
	modelExt: ThreeExtensions;
	animsDir?: string;
	animNames?: string[];
	animsExt?: ThreeExtensions;
}

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

	loadModelAndAnims: (loadConfig: LoadModelsConfig) => void;
	update: (timeInSeconds: number) => void;
}
