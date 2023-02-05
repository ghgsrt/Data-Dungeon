import { Accessor } from 'solid-js';
import { AnimationAction, AnimationMixer } from 'three';
import { Output } from '../hooks/useInputs';
import { KeybindConfig } from '../hooks/useKeybinds';
import { Entity } from './Entity';

export interface State {
	name: string;
	enter: (prevState: State) => void;
	update: (
		timeElapsed: number,
		input: Output,
		keybindConfig?: KeybindConfig
	) => void;
	finished: () => void;
	cleanup: () => void;
	exit: () => void;
}

export interface StateEnterProps {
	action: AnimationAction;
	prevState: State;
	getPrevAction: () => AnimationAction;
	setTimeFromRatio: (name?: string) => void;
}
export interface StateUpdateProps {
	action: AnimationAction;
	timeElapsed: number;
	input: Output;
	changeState: (name: string) => void;
}
export interface StateFinishedProps {
	action: AnimationAction;
	getMixer: () => AnimationMixer;
}
export interface StateCleanupProps {
	action: AnimationAction;
	getMixer: () => AnimationMixer;
}
export interface StateExitProps {
	action: AnimationAction;
}
export type StateProps =
	| StateEnterProps
	| StateUpdateProps
	| StateFinishedProps
	| StateCleanupProps
	| StateExitProps;

export type StateEnterFn = (props: StateEnterProps, entity: Entity) => void;
export type StateUpdateFn = (
	props: StateUpdateProps,
	entity: Entity
	// keybindConfig?: KeybindConfig
) => void;
export type StateFinishedFn = (
	props: StateFinishedProps,
	entity: Entity
) => void;
export type StateCleanupFn = (props: StateCleanupProps, entity: Entity) => void;
export type StateExitFn = (props: StateExitProps, entity: Entity) => void;
export type StateFn =
	| StateEnterFn
	| StateUpdateFn
	| StateFinishedFn
	| StateCleanupFn
	| StateExitFn;

export type StateBuilderFn = (entity: Entity) => State;
export type StateBuilderMap = Record<string, StateBuilderFn>;

//! create one big StateProps, then someohow tka epartials of it for the fnprops
export interface FiniteStateMachine {
	states: StateBuilderMap;
	currentState: Accessor<State | undefined>;
	keybindConfig: Accessor<KeybindConfig | undefined>;
	setKeybindConfig: (config: KeybindConfig) => void;
	addState: (name: string, builderFn: StateBuilderFn) => void;
	addStates: (states: StateBuilderMap) => void;
	changeState: (name: string) => void;
	update: (timeElapsed: number, input: Output) => void;
}
