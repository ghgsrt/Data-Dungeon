import { createEffect, createSignal, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Entity } from '../types/Entity';
import { StateBuilderMap, FiniteStateMachine, State } from '../types/State';

function useFiniteStateMachine(
	entity: Entity,
	defaultStates?: StateBuilderMap
): FiniteStateMachine {
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

	const changeState: FiniteStateMachine['changeState'] = (name) => {
		if (!entity.readyForStateChange()) return;

		const prevState = currentState();

		if (prevState) {
			if (prevState.name === name) return;
			prevState.exit();
		}

		const state = states[name](entity);

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
