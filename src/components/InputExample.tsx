import { onMount, createSignal, createEffect, For } from 'solid-js';
import useInputs from '../hooks/useInputs';
import { InputConfig } from '../types/Input';
import { Keys, Codes } from '../types/KeyCodes';
import SlideToggle from './SlideToggle';

const inputConfigOne: InputConfig<Keys> = {
	channels: {
		'Multiple Keys For One Output': {
			deez: ['n', 'u', 't', 'z'],
			hello: ['t', 'h', 'e', 'r'],
			I: ['w', 'e'],
			Single: ['p'],
		},
		'One Key Per Output': ['a', 's', 'd'],
		'Extra Channel For Fun': ['w', 'a', 's'],
	},
	options: {
		use: 'key',
	},
};

const inputConfigTwo: InputConfig<Codes> = {
	channels: {
		'Multiple Keys For One Output': {
			you: ['KeyG', 'KeyE', 'KeyT'],
			it: ['KeyH', 'KeyM'],
		},
		'One Key Per Output': ['Space', 'Enter', 'KeyG', 'KeyM'],
	},
	options: {
		use: 'code',
	},
};

function InputExample() {
	const [showKeyConfig, setShowKeyConfig] = createSignal(false);
	const { output, listen } = useInputs();

	createEffect(() => {
		if (showKeyConfig()) listen(inputConfigOne);
		else listen(inputConfigTwo);

		console.log(showKeyConfig());
	});

	onMount(() => {});

	return (
		<div class="p-10">
			<SlideToggle
				onChange={(e: Event) =>
					setShowKeyConfig((e.target as HTMLInputElement).checked)
				}
			/>
			<For each={Object.keys(output.channels)}>
				{(channel) => (
					<p class="mt-7 text-2xl text-gray-200">
						{channel}: '{JSON.stringify(output.channels[channel])}'
					</p>
				)}
			</For>
		</div>
	);
}

export default InputExample;
