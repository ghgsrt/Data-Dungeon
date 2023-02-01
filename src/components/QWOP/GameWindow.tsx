import { onMount, For } from 'solid-js';
import useInputs, { InputConfig } from '../../hooks/useInputs';
import { Keys } from '../../enums/KeyCodes';

const inputConfig: InputConfig<Keys> = {
	channels: {
		move: {
			'x-': ['w', 'W', 'ArrowUp'],
			'y-': ['a', 'A', 'ArrowLeft'],
			x: ['s', 'S', 'ArrowRight'],
			y: ['d', 'D', 'ArrowDown'],
		},
		jump: [' '],
	},
	options: {
		use: 'key',
	},
};

function GameWindow() {
	const { outputChannels, listen } = useInputs();

	onMount(() => {
		listen(inputConfig);
	});

	return (
		<>
			<div class="flex flex-col w-screen h-screen bg-red-600">
				<div class="w-full h-4/5 bg-blue-700 relative">
					<div class="w-10 h-14 bg-red-500 absolute bottom-0 left-14" />
				</div>
				<div class="flex-1 bg-green-700">
					<For each={Object.keys(outputChannels)}>
						{(channel) => (
							<p>
								{channel}: '{outputChannels[channel]}'
							</p>
						)}
					</For>
				</div>
			</div>
		</>
	);
}

export default GameWindow;
