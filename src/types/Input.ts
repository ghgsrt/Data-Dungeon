import { Response } from '../hooks/useStateManager';
import { Codes, KeysOrCodes } from './KeyCodes';

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

export type KeyFn<R> = (pressed: boolean) => R | void;
export type ChannelFn<R> = (key: string, head: string) => R | string | void;
// export type PostFire<R> = Record<'_post', (result?: R) => void>;
export interface KeybindOptions {
	alwaysPassInput?: boolean;
	useModsChannel?: boolean;
}
export interface KeybindConfig<
	KT extends KeysOrCodes = Codes, //? key names
	CT extends Record<string, any> = InputChannels<KT>, //? channel names
	R = Response, //? key/channel fn return type
	PR = string //? post fire fn params type / state manager fn return type
> {
	keys: Partial<Record<KT, KeyFn<PR>>>;
	channels: Partial<Record<keyof CT, ChannelFn<R>>>; // & PostFire<PR>;
	post?: (result?: PR) => void;
	options?: KeybindOptions;
}

export interface Output {
	channels: Channels;
	pressed: string[];
}
