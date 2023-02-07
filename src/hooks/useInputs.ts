import { createStore, produce } from 'solid-js/store';
import useEventListener from './useEventListener';
import { KeysOrCodes } from '../types/KeyCodes';
import { createSignal } from 'solid-js';
import {
	KeybindConfig,
	UseInputs,
	Output,
	PostFire,
	InputConfig,
	Channels,
	ChannelKeybindFn,
	Indexer,
	KBValidator,
	KeybindFn,
	KeybindOptions,
	ValidConfig,
} from '../types/Input';

export const validateKeybindConfig = <
	KT extends Indexer,
	CT,
	KF = KeybindFn,
	CF extends (...args: any) => any = ChannelKeybindFn
	// FLAGS extends string = string
>(
	keys: KBValidator<KT, KF>,
	// channels: KBCValidator<FLAGS, keyof CT, CF>,
	channels: ValidConfig<keyof CT, CF> & PostFire<CF>,
	options?: KeybindOptions
) => ({
	keys,
	channels,
	options,
});

//! SHOULD I TREAT NO CAPS AND CAPS THE EXACT SAME WHEN USE KEY????????
function useInputs<
	K extends (...args: any) => any,
	C extends (...args: any) => any
>(keybindConfig?: KeybindConfig<K, C>): UseInputs<K, C> {
	const [_keybindConfig, setKeybindConfig] = createSignal<
		Partial<KeybindConfig<K, C>>
	>(keybindConfig ?? {});

	const [output, setOutput] = createStore<Output>({
		channels: {},
		pressed: [],
	});
	const unsubList: (() => void)[] = [];

	const firePost = (result?: any) => {
		(_keybindConfig()?.channels?._post as PostFire<any>['_post'])?.(result);
	};

	const callKeybind = (key: string, pressed: boolean) => {
		if (!_keybindConfig()) return;

		_keybindConfig().keys?.[key]?.(pressed);
	};
	const callChannelKeybind = (channel: string) => {
		if (!_keybindConfig()) return;

		if (channel === 'mods') {
			callChannelKeybind('move');
			return;
		}

		const res = _keybindConfig().channels?.[channel]?.();
		if (
			res &&
			(channel !== 'mods' || _keybindConfig().options?.useModsChannel)
		)
			firePost(res);
	};

	const addChannel = (channel: string) => {
		setOutput('channels', (channels) => ({ ...channels, [channel]: [] }));
	};
	const pushToChannel = (channel: string, item: string) => {
		setOutput('channels', channel, (channel) => [item, ...channel]);

		callChannelKeybind(channel);
	};
	const removeFromChannel = (channel: string, item: string) => {
		setOutput(
			'channels',
			channel,
			produce((channel) => {
				const idxToRemove = channel.lastIndexOf(item);
				if (idxToRemove > -1) channel.splice(idxToRemove, 1);
			})
		);

		callChannelKeybind(channel);
	};
	const clearOutputChannels = () => {
		setOutput('channels', {});
		unsubList.forEach((unsub) => unsub());
	};

	const pressKey = (key: string) => {
		setOutput(
			'pressed',
			produce((keys) => {
				keys.unshift(key);
			})
		);

		callKeybind(key, true);
	};
	const releaseKey = (key: string) => {
		setOutput(
			'pressed',
			produce((keys) => {
				const idxToRemove = keys.indexOf(key);
				if (idxToRemove > -1) keys.splice(idxToRemove, 1);
			})
		);

		callKeybind(key, false);
		if (output.pressed.length === 0) firePost();
	};

	const listen = <T extends KeysOrCodes>(
		inputConfig: InputConfig<T>,
		keybindConfig?: KeybindConfig<K, C>
	) => {
		if (keybindConfig) {
			console.log(`setting config: ${JSON.stringify(keybindConfig)}`);
			setKeybindConfig(keybindConfig);
		}

		clearOutputChannels();

		const inputChannels = inputConfig.channels;
		const keyType = inputConfig.options.use;

		const keyToChannelsMap: Record<string, Set<string>> = {};
		const keyToValuesMap: Record<string, Record<string, Set<string>>> = {};

		const addToMaps = (input: T, channel: string, key?: string) => {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!keyToChannelsMap[input]) keyToChannelsMap[input] = new Set();
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!keyToValuesMap[input]) keyToValuesMap[input] = {};
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!keyToValuesMap[input][channel])
				keyToValuesMap[input][channel] = new Set();

			keyToChannelsMap[input].add(channel);
			keyToValuesMap[input][channel].add(key ?? input);
		};

		for (const channel in inputChannels) {
			addChannel(channel);

			for (const key in inputChannels[channel]) {
				if (Array.isArray(inputChannels[channel])) {
					addToMaps(
						(inputChannels[channel] as T[])[parseInt(key)],
						channel
					);
				} else {
					(inputChannels[channel] as Channels<T>)[key].forEach(
						(input) => addToMaps(input, channel, key)
					);
				}
			}
		}

		const determineValue = (e: Event) => {
			const key = (e as KeyboardEvent)[keyType];

			return {
				key,
				channels: keyToChannelsMap[key],
				values: keyToValuesMap[key],
				shouldReturn: !keyToChannelsMap[key],
			};
		};

		const mutOutChannels = (
			callback: typeof pushToChannel,
			channels: Set<string>,
			values: Record<string, Set<string>>
		) => {
			channels.forEach((channel) =>
				values[channel].forEach((value) => callback(channel, value))
			);
		};

		const handleKeyDown = (e: Event) => {
			const { key, channels, values, shouldReturn } = determineValue(e);

			if (shouldReturn || output.pressed.includes(key)) return;
			e.preventDefault();

			mutOutChannels(pushToChannel, channels, values);
			pressKey(key);
		};

		const handleKeyUp = (e: Event) => {
			const { key, channels, values, shouldReturn } = determineValue(e);

			if (shouldReturn || !output.pressed.includes(key)) return;
			e.preventDefault();

			mutOutChannels(removeFromChannel, channels, values);
			releaseKey(key);
		};

		unsubList.push(useEventListener('keydown', handleKeyDown).unsubscribe);
		unsubList.push(useEventListener('keyup', handleKeyUp).unsubscribe);
	};

	return { output, listen, setKeybindConfig };
}

export default useInputs;
