import { SetStoreFunction } from 'solid-js/store';
import { KeysOrCodes } from './KeyCodes';

export type Channels<T = string> = Record<string, T[]>;
export type InputChannels<T extends KeysOrCodes> = Record<
	string,
	T[] | Channels<T>
>;
export interface InputOptions {
	use: 'key' | 'code';
}
export interface InputConfig<T extends KeysOrCodes> {
	channels: InputChannels<T>;
	options: InputOptions;
}

export interface Output {
	channels: Channels;
	pressed: string[];
}

export interface UseInputs<
	K extends (...args: any) => any = KeybindFn,
	C extends (...args: any) => any = ChannelKeybindFn
> {
	output: Output;
	listen: <T extends KeysOrCodes>(
		inputConfig: InputConfig<T>,
		keybindConfig?: KeybindConfig<K, C>
	) => void;
	setKeybindConfig: SetStoreFunction<Partial<KeybindConfig<K, C>>>;
}

export type KeybindFn = (pressed: boolean) => void;
export type ChannelKeybindFn = () => string | undefined | void;

export type Keybinds<F extends (...args: any) => any> = Record<string, F>;
export type PostFire<F extends (...args: any) => any> = Record<
	'_post',
	(result: ReturnType<F>) => void
>;
export type ChannelKeybinds<F extends (...args: any) => any> = ValidConfig<
	keyof Channels,
	F
> &
	PostFire<F>;

export interface KeybindOptions {
	alwaysPassInput?: boolean;
	useModsChannel?: boolean;
}
export interface KeybindConfig<
	K extends (...args: any) => any = KeybindFn,
	C extends (...args: any) => any = ChannelKeybindFn
> {
	keys: Keybinds<K>;
	channels: ChannelKeybinds<C>;
	options?: KeybindOptions;
}

export type Indexer = string | number | symbol;

export type KBOmit<T> = T;
export type KBNoMods = string[];
export type KBPartial = string[][];
export type KBPostFire = string[][][];
export type ValidConfig<T extends Indexer, F> = Record<T, F>;
//! ignore the errors, they're lying
//! legitimately working as intended
export type KBCValidator<
	C extends string | number | symbol,
	T extends Indexer,
	F extends (...args: any) => any
> = C extends KBPostFire
	? ValidConfig<T, F> & PostFire<F>
	: C extends KBPartial
	? Partial<ValidConfig<T, F>>
	: C extends KBNoMods
	? Omit<ValidConfig<T, F>, 'mods'>
	: C extends KBOmit //! MUST BE THE LAST TERNARY
	? Omit<ValidConfig<T, F>, C>
	: ValidConfig<T, F>;

export type KBValidator<T extends Indexer, F> = Partial<ValidConfig<T, F>>;
