import { createEffect, createSignal, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { AnimationMixer, AnimationAction, Event } from 'three';
import { Entity } from '../types/Entity';
import {
	StateBuilderMap,
	FiniteStateMachine,
	State,
	TestFiniteStateMachine,
} from '../types/State';

function useFiniteStateMachine(
	entity: string,
	defaultStates?: Record<string, number>
): TestFiniteStateMachine;

function useFiniteStateMachine(
	entity: Entity,
	defaultStates?: StateBuilderMap
): FiniteStateMachine;

function useFiniteStateMachine(
	stateBuilderProp: any,
	defaultStates?: any
): any {
	const [states, setStates] = createStore<StateBuilderMap>(
		defaultStates ?? {}
	);
	const [currentState, _setCurrentState] = createSignal<State>();

	const addState: FiniteStateMachine['addState'] = (name, builderFn) => {
		setStates((prev) => ({ ...prev, [name]: builderFn }));
	};
	const addStates: FiniteStateMachine['addStates'] = (_states) => {
		setStates((prev) => ({ ...prev, ..._states }));
	};

	//! debug
	createEffect(() => {
		console.log(currentState()?.name);
	});

	const changeState: FiniteStateMachine['changeState'] = (
		name,
		callExit = true
	) => {
		if (!stateBuilderProp.readyForStateChange()) return;

		const state = states[name]?.(stateBuilderProp);
		if (!state) return;

		const prevState = currentState();

		if (prevState) {
			if (!callExit || prevState.name === name) return;
			prevState.exit();
		}

		_setCurrentState(state);

		state.enter(prevState!);
	};

	const update: FiniteStateMachine['update'] = (timeElapsed) => {
		if (!currentState()) return;

		currentState()!.update(timeElapsed);
	};

	onCleanup(() => currentState()?.exit());

	return {
		states,
		currentState,
		addState,
		addStates,
		changeState,
		update,
	};
}

export default useFiniteStateMachine;
