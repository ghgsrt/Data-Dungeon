import { createStore, produce } from 'solid-js/store';
import useEventListener from './useEventListener';
import { Keys, Codes } from '../types/KeyCodes';

type KeysOrCodes = Keys | Codes;
type Channels<T = string> = Record<string, T[]>;
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

function useInputs() {
	const [outputChannels, setOutputChannels] = createStore<Channels>({});
	const unsubList: (() => void)[] = [];

	const addChannel = (channel: string) => {
		setOutputChannels((prev) => ({ ...prev, [channel]: [] }));
	};
	const pushToChannel = (channel: string, item: string) => {
		setOutputChannels(
			produce((channels) => {
				channels[channel].unshift(item);
			})
		);
	};
	const removeFromChannel = (channel: string, item: string) => {
		setOutputChannels(
			produce((channels) => {
				const idxToRemove = channels[channel].indexOf(item);
				if (idxToRemove > -1) channels[channel].splice(idxToRemove, 1);
			})
		);
	};
	const clearOutputChannels = () => {
		setOutputChannels({});
		unsubList.forEach((unsub) => unsub());
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
				channels: keyToChannelsMap[key],
				values: keyToValuesMap[key],
				shouldReturn: !keyToChannelsMap[key],
			};
		};

		const handleKeyDown = (e: Event) => {
			const { channels, values, shouldReturn } = determineValue(e);
			if (shouldReturn) return;

			const keyAlreadyPressed = [...channels].every((channel) =>
				[...values[channel]].every((value) =>
					outputChannels[channel].includes(value)
				)
			);
			if (keyAlreadyPressed) return;

			e.preventDefault();
			channels.forEach((channel) =>
				values[channel].forEach((value) =>
					pushToChannel(channel, value)
				)
			);
		};

		const handleKeyUp = (e: Event) => {
			const { channels, values, shouldReturn } = determineValue(e);
			if (shouldReturn) return;

			e.preventDefault();
			channels.forEach((channel) =>
				values[channel].forEach((value) =>
					removeFromChannel(channel, value)
				)
			);
		};

		unsubList.push(useEventListener('keydown', handleKeyDown).unsubscribe);
		unsubList.push(useEventListener('keyup', handleKeyUp).unsubscribe);
	};

	return { outputChannels, listen };
}

export default useInputs;
