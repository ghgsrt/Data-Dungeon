import { createEffect, createSignal, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Entity } from '../types/Entity';
import { StateBuilderMap, FiniteStateMachine, State } from '../types/State';

function useAnimStateMachine(
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

	const changeState: FiniteStateMachine['changeState'] = (
		name,
		callExit = true
	) => {
		if (!entity.readyForStateChange()) return;

		const state = states[name]?.(entity);
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
		currentState()?.update(timeElapsed);
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

export default useAnimStateMachine;
