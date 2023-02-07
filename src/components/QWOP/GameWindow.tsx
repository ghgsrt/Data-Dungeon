import { onMount } from 'solid-js';
import createDemo from '../../hooks/createDemoWorld';
import createEntity from '../../hooks/createEntity';
import createState, { CreateStateFns } from '../../hooks/createState';
import useFiniteStateMachine from '../../hooks/useFiniteStateMachine';
import useInputs, { validateKeybindConfig } from '../../hooks/useInputs';
import { CreateCustomEntity } from '../../types/Entity';
import { InputConfig } from '../../types/Input';
import { Codes } from '../../types/KeyCodes';
import { StateBuilderMap } from '../../types/State';

const matchTimeOnEnter = (name: string): CreateStateFns => ({
	enter: ({ action, setTimeFromRatio }) => {
		setTimeFromRatio(name);
		action.play();
	},
});

const createQWOPPlayer: CreateCustomEntity = (scene, camera, inputs) => {
	const player = createEntity({
		scene,
		camera,
		// state: {

		// }
	});

	const fsm: StateBuilderMap = {
		idle: createState('idle'),
		walk: createState('walk', matchTimeOnEnter('run')),
		run: createState('run', matchTimeOnEnter('walk')),
		jump: createState('jump'),
		dance: createState('dance'),
	};

	const inputConfig = {
		channels: {
			move: ['KeyW', 'KeyA', 'KeyS', 'KeyD'],
			jump: ['Space'],
			dance: ['KeyF'],
			mods: ['ShiftLeft'],
		},
		options: {
			use: 'code',
		},
	} satisfies InputConfig<Codes>;

	const keybindConfig = validateKeybindConfig<
		Codes,
		typeof inputConfig.channels
	>(
		{
			KeyW: (pressed) =>
				player.setState('actions', 'move', 'forward', pressed),
			KeyA: (pressed) =>
				player.setState('actions', 'move', 'left', pressed),
			KeyS: (pressed) =>
				player.setState('actions', 'move', 'backward', pressed),
			KeyD: (pressed) =>
				player.setState('actions', 'move', 'right', pressed),
			ShiftLeft: (pressed) =>
				player.setState('actions', 'move', 'sprinting', pressed),
		},
		{
			move: () =>
				inputs.output.channels.mods.includes('ShiftLeft')
					? 'run'
					: 'walk',
			jump: () => 'jump',
			dance: () => 'dance',
			mods: () => undefined,
			_post: (result) =>
				result
					? player.stateMachine()?.changeState(result)
					: player.toDefaultState(),
		}
	);

	inputs.listen(inputConfig, keybindConfig);

	player.loadModelAndAnims({
		parentDir: 'qwop',
		modelName: 'character',
		modelExt: 'fbx',
		animNames: ['idle', 'walk', 'run', 'jump', 'dance'],
	});

	player.setStateMachine(useFiniteStateMachine(player, fsm));

	return player;
};

let container: HTMLDivElement;
function GameWindow() {
	const inputs = useInputs();

	onMount(() => {
		const { scene, camera, ...demo } = createDemo(container);
		const player = createQWOPPlayer(scene, camera, inputs);
		demo.setControls(player);
	});

	return <div ref={container} class="h-screen w-full" />;
}

export default GameWindow;
