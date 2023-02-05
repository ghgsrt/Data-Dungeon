import { createEffect, createSignal, from, observable } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Channels, Output } from './useInputs';

export interface StateKeybindFnProps {
	changeState?: (name: string) => void;
	input: Output;
	key?: string;
}
export type PostFireBase = (...args: any[]) => void;
export type PostFire<F extends PostFireBase> = {
	_post: (result: ReturnType<F>[], state: Record<string, any>) => void;
};
export type StateKeybindFn = (props: StateKeybindFnProps) => string | undefined;
export type Keybinds<F extends PostFireBase> = Record<keyof Channels, F> &
	Partial<PostFire<F>>;

export interface KeybindOptions {
	alwaysPassInput?: boolean;
	useModsChannel?: boolean;
}
export interface KeybindConfig<F extends PostFireBase = StateKeybindFn> {
	channels: Keybinds<F>;
	options?: KeybindOptions;
}

export type KBOmit<T> = T;
export type KBNoMods = string[];
export type KBPartial = string[][];
export type KBPostFire = string[][][];
type ValidConfig<T, F> = Record<keyof T, F>;
//! ignore the errors, they're lying
//! legitimately working as intended
type KBValidator<C, T, F extends PostFireBase> = C extends KBPostFire
	? ValidConfig<T, F> & PostFire<F>
	: C extends KBPartial
	? Partial<ValidConfig<T, F>>
	: C extends KBNoMods
	? Omit<ValidConfig<T, F>, 'mods'>
	: C extends KBOmit //! MUST BE THE LAST TERNARY
	? Omit<ValidConfig<T, F>, C>
	: ValidConfig<T, F>;

export const validateKeybindConfig = <
	T,
	F extends (args: any) => any = StateKeybindFn,
	C = ValidConfig<T, F>
>(
	channels: KBValidator<C, T, F>,
	options?: KeybindOptions
) => ({
	channels,
	options,
});

// export type Omit<T, K extends keyof T> = T extends any
// 	? Pick<T, Exclude<keyof T, K>>
// 	: never;

function useKeybinds<F extends PostFireBase>(
	input: Output,
	_keybindConfig?: KeybindConfig<F>,
	_fnProps?: Record<string, any>
) {
	const [keybindConfig, setKeybindConfig] = createSignal(_keybindConfig);
	const [keybinds, setKeybinds] = createStore<Keybinds<F>>(
		_keybindConfig?.channels
	);
	const [fnProps, setFnProps] = createStore(_fnProps);

	const firePost = (result?: any) => {
		(keybindConfig()?.channels!._post as PostFire<F>['_post'])(
			result,
			fnProps
		);
	};

	createEffect(() => {
		const useMods = keybindConfig()?.options?.useModsChannel;
		for (const channel in input.channels) {
			if (
				(channel !== 'mods' || useMods) &&
				input.channels[channel].length > 0
			) {
				const pressedIdx =
					input.pressed[0] === input.channels.mods[0] && !useMods
						? 1
						: 0;
				if (input.channels[channel][0] === input.pressed[pressedIdx]) {
					const result = keybinds[channel]({
						input,
						...fnProps,
					});

					firePost(result);
				}
			}
		}

		if (input.pressed.length === 0) firePost();
	});

	return {
		keybinds,
		keybindConfig,
		fnProps,
		setKeybinds,
		setKeybindConfig,
		setFnProps,
	};
}

export default useKeybinds;
