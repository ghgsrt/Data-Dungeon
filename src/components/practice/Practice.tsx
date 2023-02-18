import { createEffect, onMount } from 'solid-js';
import createDemo from '../../hooks/createDemoWorld';
import createEntity from '../../hooks/createEntity';
import createState, { CreateStateFns } from '../../hooks/createState';
import useFiniteStateMachine from '../../hooks/useFiniteStateMachine';
import useInputs from '../../hooks/useInputs';
import { CreateCustomEntity } from '../../types/Entity';
import { InputConfig, KeybindConfig } from '../../types/Input';
import { Codes } from '../../types/KeyCodes';
import { StateBuilderMap } from '../../types/State';
import globalStore from '../../global';

const namesToMatch = ['idle', 'walk', 'walk-backward', 'run', 'run-backward'];
const matchTimeOnEnter = (names: string[]): CreateStateFns => ({
	enter: ({ action, setTimeFromRatio }) => {
		setTimeFromRatio(names);
		action.play();
	},
});
const createTestPlayer: CreateCustomEntity = (scene, camera, inputs) => {
	const testPlayer = createEntity({
		scene,
		camera,
		// just variables tied to this entity
		// state: {},
	});

	testPlayer.loadModelAndAnims({
		parentDir: 'qwop',
		modelName: 'character',
		modelExt: 'fbx',
		// these are file names in the specified parent dir under animations/file extension
		animNames: ['idle', 'walk', 'walk-backward', 'run', 'run-backward'],
	});

	const inputConfig = {
		channels: {
			// channels prevent grouped keys from registering at the same time
			move: ['KeyW', 'KeyA', 'KeyS', 'KeyD'],
			mods: ['ShiftLeft'],
		},
		options: {
			use: 'code',
		},
	} satisfies InputConfig<Codes>;

	const keybindConfig: KeybindConfig<
		Codes,
		Partial<typeof inputConfig.channels>,
		string
	> = {
		// these are their own individual key inputs
		keys: {
			KeyW: (pressed) =>
				testPlayer.setState('actions', 'move', 'forward', pressed),
			KeyS: (pressed) =>
				testPlayer.setState('actions', 'move', 'backward', pressed),
			ShiftLeft: (pressed) =>
				testPlayer.setState('actions', 'move', 'sprinting', pressed),
		}, // keys
		// these are the channels defined above
		channels: {
			// (key, head of channel)
			move: (_, head) => {
				const { forward, backward, sprinting } =
					testPlayer.state.actions.move;

				if (!head || forward === backward) return 'idle';

				const isRunning = sprinting;
				if (forward) return isRunning ? 'run' : 'walk';
				if (backward)
					return isRunning ? 'run-backward' : 'walk-backward';
			}, // move
			mods: (key) => (key === 'ShiftLeft' ? 'move' : 'no-op'),
		}, // channels
		post: (result) => {
			// if (result === 'no-op') return;
			console.log(result);
			return result
				? testPlayer.stateMachine()?.changeState(result as string)
				: testPlayer.toDefaultState();
		}, // post
	}; // keybindConfig

	inputs?.listen(inputConfig, keybindConfig);

	const fsm: StateBuilderMap = {
		// keys must match animNames defined above
		idle: createState('idle'),
		walk: createState('walk', matchTimeOnEnter(namesToMatch)),
		'walk-backward': createState(
			'walk-backward',
			matchTimeOnEnter(namesToMatch)
		),
		run: createState('run', matchTimeOnEnter(namesToMatch)),
		'run-backward': createState(
			'run-backward',
			matchTimeOnEnter(namesToMatch)
		),
	};

	testPlayer.setStateMachine(useFiniteStateMachine(testPlayer, fsm));

	return testPlayer;
};

let container: HTMLDivElement;
function Practice() {
	const { activeComponent } = globalStore;
	const inputs = useInputs();

	onMount(() => {
		const demo = createDemo(container);
		const player = createTestPlayer(demo.scene, demo.camera, inputs);
		demo.setControls(player);

		createEffect(() => {
			if (activeComponent() === 'Practice') {
				demo.onWindowResize();
				// demo2.onWindowResize();
			}
		});
	});

	return (
		<div class="relative h-full w-full">
			<div ref={container} class="z-0 h-5/6 w-full" />
			<div class="flex h-1/6 w-full items-center bg-black"></div>
		</div>
	);
}

export default Practice;
