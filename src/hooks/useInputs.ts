import { createStore, produce } from 'solid-js/store';
import useEventListener from './useEventListener';
import { Keys, Codes } from '../enums/KeyCodes';

type KeysOrCodes = Keys | Codes;
type StringMap = Record<string, string>;
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
				channels[channel] = channels[channel].filter(
					(key) => key !== item
				);
			})
		);
	};

	const listen = <T extends KeysOrCodes>(inputConfig: InputConfig<T>) => {
		const inputChannels = inputConfig.channels;
		const keyType = inputConfig.options.use;

		const keyToChannelMap: StringMap = {};
		const keyToValueMap: StringMap = {};
		for (const channel in inputChannels) {
			addChannel(channel);

			for (const key in inputChannels[channel]) {
				if (Array.isArray(inputChannels[channel])) {
					const input = (inputChannels[channel] as T[])[
						parseInt(key)
					];
					keyToChannelMap[input] = channel;
					keyToValueMap[input] = input;
				} else
					(inputChannels[channel] as Channels<T>)[key].forEach(
						(input) => {
							keyToChannelMap[input] = channel;
							keyToValueMap[input] = key;
						}
					);
			}
		}

		const determineValue = (e: Event) => {
			const key = (e as KeyboardEvent)[keyType];

			return {
				channel: keyToChannelMap[key],
				value: keyToValueMap[key],
				shouldReturn: !keyToChannelMap[key],
			};
		};

		const handleKeyDown = (e: Event) => {
			const { channel, value, shouldReturn } = determineValue(e);

			if (shouldReturn || outputChannels[channel].includes(value)) return;

			e.preventDefault();
			pushToChannel(channel, value);
		};

		const handleKeyUp = (e: Event) => {
			const { channel, value, shouldReturn } = determineValue(e);

			if (shouldReturn) return;

			e.preventDefault();
			removeFromChannel(channel, value);
		};

		useEventListener('keydown', handleKeyDown);
		useEventListener('keyup', handleKeyUp);
	};

	return { outputChannels, listen };
}

export default useInputs;
