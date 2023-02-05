import { createStore, produce } from 'solid-js/store';
import useEventListener from './useEventListener';
import { KeysOrCodes } from '../types/KeyCodes';

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

//! SHOULD I TREAT NO CAPS AND CAPS THE EXACT SAME WHEN USE KEY????????
function useInputs() {
	const [output, setOutput] = createStore<Output>({
		channels: {},
		pressed: [],
	});
	const unsubList: (() => void)[] = [];

	const addChannel = (channel: string) => {
		setOutput('channels', (channels) => ({ ...channels, [channel]: [] }));
	};
	const pushToChannel = (channel: string, item: string) => {
		setOutput('channels', channel, (channel) => [item, ...channel]);
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
	};
	const releaseKey = (key: string) => {
		setOutput(
			'pressed',
			produce((keys) => {
				const idxToRemove = keys.indexOf(key);
				if (idxToRemove > -1) keys.splice(idxToRemove, 1);
			})
		);
	};

	const listen = <T extends KeysOrCodes>(inputConfig: InputConfig<T>) => {
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

	return { output, listen };
}

export default useInputs;
