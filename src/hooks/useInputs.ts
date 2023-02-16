import { createStore, produce } from 'solid-js/store';
import useEventListener from './useEventListener';
import { Codes, KeysOrCodes } from '../types/KeyCodes';
import { createEffect, createSignal } from 'solid-js';
import {
	KeybindConfig,
	Output,
	InputConfig,
	Channels,
	InputChannels,
	KeyFn,
} from '../types/Input';
import useStateManager, {
	Response,
	StateManagerConfig,
	StateManagerFnProps,
	StateObject,
} from './useStateManager';

//! SHOULD I TREAT NO CAPS AND CAPS THE EXACT SAME WHEN USE KEY????????
function useInputs<
	KT extends KeysOrCodes = Codes,
	R extends StateObject = Response,
	PR = string
>(
	keybindConfig?: KeybindConfig<KT, InputChannels<KT>, R, PR>,
	stateManagerConfig?: StateManagerConfig<InputChannels<KT>, R, PR>
) {
	const [_keybindConfig, setKeybindConfig] =
		createSignal<typeof keybindConfig>(keybindConfig);

	const [_stateManagerConfig, setStateManagerConfig] =
		createSignal<typeof stateManagerConfig>(stateManagerConfig);
	const [stateManager, setStateManager] = createStore(useStateManager([]));

	const [inputConfig, setInputConfig] = createSignal<InputConfig<KT>>({
		channels: {},
		options: { use: 'code' },
	});
	const [output, setOutput] = createStore<Output>({
		channels: {},
		pressed: [],
	});
	const unsubList: (() => void)[] = [];

	createEffect(() => {
		if (inputConfig())
			setStateManager(
				useStateManager(Object.keys(inputConfig().channels))
			);
	});

	const firePost = (_result?: R | PR, channel?: string) => {
		let result = _result;
		if (_stateManagerConfig() && _result && channel) {
			const stateMachine = stateManager.stateMachines[channel];
			stateManager.changeState(_result as R);
			stateMachine.changeState(_result as R);

			const props = [
				stateMachine.state(),
				stateMachine.prevState(),
				stateManager.state(),
				stateManager.prevState(),
			] as StateManagerFnProps<R>;

			result = (_stateManagerConfig()![channel]?.(props) ??
				(result as R).message) as PR;
		}

		if (typeof result !== 'string') result = (result as R).message as PR;

		_keybindConfig()?.post?.(result as PR);
	};

	const callKeybind = (key: string, pressed: boolean) => {
		if (!_keybindConfig()) return;

		let res = (_keybindConfig()!.keys as Record<string, KeyFn<PR>>)?.[
			key
		]?.(pressed);
		// if (res === undefined || typeof res === 'string')
		// {
		// 	res = { message: res } as R
		// }
		if (res !== undefined) firePost(res);
	};
	const callChannelKeybind = (channel: string, key: string): void => {
		if (!_keybindConfig()) return;

		//! might need different prop passed for key
		// if (channel === 'mods') return callChannelKeybind('move', key);

		let res = _keybindConfig()!.channels?.[channel]?.(
			key,
			output.channels[channel][0]
		);
		if (res === undefined || typeof res === 'string')
			res = {
				message: res ? res : channel,
				key,
				channelHead: output.channels[channel][0],
			} as R;

		if (
			// output.channels[channel].length > 0 &&
			channel !== 'mods' ||
			_keybindConfig()!.options?.useModsChannel
		)
			firePost(res, channel);
	};

	const addChannel = (channel: string) => {
		setOutput('channels', (channels) => ({ ...channels, [channel]: [] }));
	};
	const pushToChannel = (channel: string, key: string) => {
		setOutput('channels', channel, (channel) => [key, ...channel]);

		callChannelKeybind(channel, key);
	};
	const removeFromChannel = (channel: string, key: string) => {
		setOutput(
			'channels',
			channel,
			produce((channel) => {
				const idxToRemove = channel.lastIndexOf(key);
				if (idxToRemove > -1) channel.splice(idxToRemove, 1);
			})
		);

		callChannelKeybind(channel, key);
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
		if (output.pressed.length === 0) firePost({ from: 'useInputs' } as R);
	};

	const listen = (
		inputConfig: InputConfig<KT>,
		keybindConfig?: KeybindConfig<KT, typeof inputConfig.channels, R, PR>,
		stateManagerConfig?: StateManagerConfig<
			typeof inputConfig.channels,
			R,
			PR
		>
	) => {
		setInputConfig(inputConfig);
		if (keybindConfig) {
			console.log(`setting config: ${JSON.stringify(keybindConfig)}`);
			setKeybindConfig(() => keybindConfig);
		}
		if (stateManagerConfig) {
			console.log(
				`setting config: ${JSON.stringify(stateManagerConfig)}`
			);
			setStateManagerConfig(() => stateManagerConfig);
		}

		clearOutputChannels();

		const inputChannels = inputConfig.channels;
		const keyType = inputConfig.options.use;

		const keyToChannel: Record<string, Set<string>> = {};
		const keyToVal: Record<string, Record<string, Set<string>>> = {};

		const addToMaps = (input: KT, channel: string, key?: string) => {
			if (!keyToChannel[input]) keyToChannel[input] = new Set();
			if (!keyToVal[input]) keyToVal[input] = {};
			if (!keyToVal[input][channel]) keyToVal[input][channel] = new Set();

			keyToChannel[input].add(channel);
			keyToVal[input][channel].add(key ?? input);
		};

		for (const channel in inputChannels) {
			addChannel(channel);

			for (const key in inputChannels[channel]) {
				if (Array.isArray(inputChannels[channel])) {
					addToMaps(
						(inputChannels[channel] as KT[])[parseInt(key)],
						channel
					);
				} else {
					(inputChannels[channel] as Channels<KT>)[key].forEach(
						(input) => addToMaps(input, channel, key)
					);
				}
			}
		}

		const determineValue = (e: Event) => {
			const key = (e as KeyboardEvent)[keyType];

			return {
				key,
				channels: keyToChannel[key],
				values: keyToVal[key],
				shouldReturn: !keyToChannel[key],
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

			pressKey(key);
			mutOutChannels(pushToChannel, channels, values);
		};

		const handleKeyUp = (e: Event) => {
			const { key, channels, values, shouldReturn } = determineValue(e);

			if (shouldReturn || !output.pressed.includes(key)) return;
			e.preventDefault();

			releaseKey(key);
			mutOutChannels(removeFromChannel, channels, values);
		};

		unsubList.push(useEventListener('keydown', handleKeyDown).unsubscribe);
		unsubList.push(useEventListener('keyup', handleKeyUp).unsubscribe);
	};

	return { output, listen, setKeybindConfig };
}

export default useInputs;
