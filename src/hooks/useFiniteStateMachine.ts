import { createEffect, createSignal, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Entity } from '../types/Entity';
import { StateBuilderMap, FiniteStateMachine, State } from '../types/State';
import { Output } from './useInputs';
import useKeybinds, { KeybindConfig } from './useKeybinds';

function useFiniteStateMachine(
	entity: Entity,
	defaultStates?: StateBuilderMap,
	input?: Output,
	keybindConfig?: KeybindConfig
): FiniteStateMachine {
	const [states, setStates] = createStore<StateBuilderMap>(
		defaultStates ?? {}
	);
	const [currentState, _setCurrentState] = createSignal<State>();
	const [_keybindConfig, _setKeybindConfig] = createSignal<KeybindConfig>();

	const setKeybindConfig = (config: KeybindConfig) => {
		_setKeybindConfig(config);
		if (input) useKeybinds(input, _keybindConfig(), { entity });
	};
	if (keybindConfig) setKeybindConfig(keybindConfig);

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
		const prevState = currentState();

		if (prevState) {
			if (prevState.name === name) return;
			prevState.exit();
		}

		const state = states[name](entity);

		_setCurrentState(state);

		state.enter(prevState!);
	};

	const update: FiniteStateMachine['update'] = (timeElapsed, input) => {
		if (currentState()) currentState()!.update(timeElapsed, input);
	};

	onCleanup(() => currentState()?.exit());

	return {
		states,
		currentState,
		keybindConfig: _keybindConfig,
		setKeybindConfig,
		addState,
		addStates,
		changeState,
		update,
	};
}

export default useFiniteStateMachine;
