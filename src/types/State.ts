import { Accessor } from 'solid-js';
import { AnimationAction, AnimationMixer } from 'three';
import { Entity } from './Entity';

export interface State {
	name: string;
	enter: (prevState: State) => void;
	update: (timeElapsed: number) => void;
	finished: () => void;
	cleanup: () => void;
	exit: () => void;
}

export interface StateEnterProps {
	action: AnimationAction;
	prevState: State;
	getPrevAction: () => AnimationAction;
	setTimeFromRatio: (names?: string[]) => void;
	getMixer: () => AnimationMixer;
}
export interface StateUpdateProps {
	action: AnimationAction;
	timeElapsed: number;
	changeState: (name: string) => void;
}
export interface StateFinishedProps {
	action: AnimationAction;
	getMixer: () => AnimationMixer;
}
export interface StateCleanupProps {
	action: AnimationAction;
	prevState: State;
	getPrevAction: () => AnimationAction;
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

export type StateFn<P> = (props: P, entity: Entity) => void;

export type StateBuilderFn = (entity: Entity) => State;
export type StateBuilderMap = Record<string, StateBuilderFn>;

export interface FiniteStateMachine {
	states: StateBuilderMap;
	currentState: Accessor<State | undefined>;
	addState: (name: string, builderFn: StateBuilderFn) => void;
	addStates: (states: StateBuilderMap) => void;
	changeState: (name: string, callExit?: boolean) => void;
	update: (timeElapsed: number) => void;
}
