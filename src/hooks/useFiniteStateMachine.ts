import { createEffect, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Entity } from '../types/Entity';
import {
	StateBuilderFn,
	StateBuilderMap,
	FiniteStateMachine,
	State,
} from '../types/State';
import { Channels } from './useInputs';

function useFiniteStateMachine(
	entity: Entity,
	defaultStates?: StateBuilderMap
): FiniteStateMachine {
	const [states, setStates] = createStore<StateBuilderMap>(
		defaultStates ?? {}
	);
	const [currentState, _setCurrentState] = createSignal<State>();

	const addState = (name: string, builderFn: StateBuilderFn) => {
		setStates((prev) => ({ ...prev, [name]: builderFn }));
	};
	const addStates = (_states: StateBuilderMap) => {
		setStates((prev) => ({ ...prev, ..._states }));
	};

	//! debug
	createEffect(() => {
		console.log(currentState()?.name);
	});

	const changeState = (name: string) => {
		const prevState = currentState();

		if (prevState) {
			if (prevState.name === name) return;
			prevState.exit();
		}

		const state = states[name](entity);

		_setCurrentState(state);

		state.enter(prevState!);
	};

	const update = (timeElapsed: number, input: Channels) => {
		if (currentState()) currentState()!.update(timeElapsed, input);
	};

	return { states, currentState, addState, addStates, changeState, update };
}

export default useFiniteStateMachine;
