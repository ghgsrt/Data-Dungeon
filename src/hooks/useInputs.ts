import { createStore, produce } from 'solid-js/store';
import useEventListener from './useEventListener';

export type ChannelConfig = Record<string, string>;
export type InputConfig = Record<string, string[] | ChannelConfig>;
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
		const keyMap: Record<string, string> = {};

		for (const channel in inputConfig) {
			addChannel(channel);

			for (const key in inputConfig[channel]) {
				if (Array.isArray(inputConfig[channel])) {
					keyMap[(inputConfig[channel] as string[])[parseInt(key)]] =
						channel;
				} else keyMap[key] = channel;
			}
		}

		const determineTrueKey = (e: Event) => {
			const key = (e as KeyboardEvent).key;
			if (!keyMap[key])
				return { shouldReturn: true, channel: '', trueKey: '' };
			e.preventDefault();

			const channel = keyMap[key];
			const channelConfig = inputConfig[channel] as ChannelConfig;
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			const trueKey = channelConfig[key] ?? key;

			return { shouldReturn: false, channel, trueKey };
		};

		const handleKeyDown = (e: Event) => {
			const { shouldReturn, channel, trueKey } = determineTrueKey(e);

			if (shouldReturn || inputChannels[channel].includes(trueKey))
				return;

			pushToChannel(channel, trueKey);
		};

		const handleKeyUp = (e: Event) => {
			const { shouldReturn, channel, trueKey } = determineTrueKey(e);

			if (shouldReturn) return;

			removeFromChannel(channel, trueKey);
		};

		useEventListener('keydown', handleKeyDown);
		useEventListener('keyup', handleKeyUp);
	};

	return { inputChannels, listen };
}

export default useInputs;
