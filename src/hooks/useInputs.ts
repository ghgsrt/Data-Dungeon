import { createStore, produce } from 'solid-js/store';
import useEventListener from './useEventListener';

export type StringMap = Record<string, string>;
export type InputConfig = Record<string, string[] | StringMap>;
type InputChannels = Record<string, string[]>;

function useInputs() {
	const [inputChannels, setInputChannels] = createStore<InputChannels>({});
	let inputConfig: InputConfig;

	const addChannel = (channel: string) => {
		setInputChannels((prev) => ({ ...prev, [channel]: [] }));
	};
	const pushToChannel = (channel: string, item: string) => {
		setInputChannels(
			produce((channels) => {
				channels[channel].unshift(item);
			})
		);
	};
	const removeFromChannel = (channel: string, item: string) => {
		setInputChannels(
			produce((channels) => {
				channels[channel] = channels[channel].filter(
					(key) => key !== item
				);
			})
		);
	};

	const listen = (_inputConfig: InputConfig) => {
		inputConfig = _inputConfig;
		const keyToChannelMap: StringMap = {};

		for (const channel in inputConfig) {
			addChannel(channel);

			for (const key in inputConfig[channel]) {
				if (Array.isArray(inputConfig[channel])) {
					keyToChannelMap[(inputConfig[channel] as string[])[parseInt(key)]] =
						channel;
				} else keyToChannelMap[key] = channel;
			}
		}

		const determineValue = (e: Event) => {
			const key = (e as KeyboardEvent).key;
			if (!keyToChannelMap[key])
				return { shouldReturn: true, channel: '', value: '' };
			e.preventDefault();

			const channel = keyToChannelMap[key];
			const keyToValueMap = inputConfig[channel] as StringMap;
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			const value = keyToValueMap[key] ?? key;

			return { shouldReturn: false, channel, value };
		};

		const handleKeyDown = (e: Event) => {
			const { shouldReturn, channel, value } = determineValue(e);

			if (shouldReturn || inputChannels[channel].includes(value))
				return;

			pushToChannel(channel, value);
		};

		const handleKeyUp = (e: Event) => {
			const { shouldReturn, channel, value } = determineValue(e);

			if (shouldReturn) return;

			removeFromChannel(channel, value);
		};

		useEventListener('keydown', handleKeyDown);
		useEventListener('keyup', handleKeyUp);
	};

	return { inputChannels, listen };
}

export default useInputs;
