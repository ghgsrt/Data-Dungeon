import { Accessor } from 'solid-js';
import { AnimationAction, AnimationMixer } from 'three';
import { Channels } from '../hooks/useInputs';
import { Entity } from './Entity';

export interface State {
	name: string;
	enter: (prevState: State) => void;
	update: (timeElapsed: number, input: Channels) => void;
	finished: () => void;
	cleanup: () => void;
	exit: () => void;
}

export interface StateEnterProps {
	action: AnimationAction;
	prevState: State;
	getPrevAction: () => AnimationAction;
}
export interface StateUpdateProps {
	action: AnimationAction;
	timeElapsed: number;
	input: Channels;
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
export type StateUpdateFn = (props: StateUpdateProps, entity: Entity) => void;
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

export interface FiniteStateMachine {
	states: StateBuilderMap;
	currentState: Accessor<State | undefined>;
	addState: (name: string, builderFn: StateBuilderFn) => void;
	addStates: (states: StateBuilderMap) => void;
	changeState: (name: string) => void;
	update: (timeElapsed: number, input: Channels) => void;
}
