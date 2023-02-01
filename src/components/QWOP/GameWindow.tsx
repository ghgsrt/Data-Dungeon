import { onMount, For } from 'solid-js';
import useInputs from '../../hooks/useInputs';

const inputConfig = {
	move: {
		w: 'x-',
		W: 'x-',
        ArrowUp: 'x-',
		a: 'y-',
		A: 'y-',
        ArrowLeft: 'y-',
		s: 'x',
		S: 'x',
        ArrowRight: 'x',
		d: 'y',
		D: 'y',
        ArrowDown: 'y',
	},
	jump: [' '],
};

function GameWindow() {
	const { inputChannels, listen } = useInputs();

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
					<For each={Object.keys(inputChannels)}>
						{(channel) => (
							<p>
								{channel}: '{inputChannels[channel]}'
							</p>
						)}
					</For>
				</div>
			</div>
		</>
	);
}

export default GameWindow;
