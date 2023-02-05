import { onMount } from 'solid-js';
import createDemo from '../../hooks/createDemoWorld';
import createEntity from '../../hooks/createEntity';
import createState, { CreateStateFns } from '../../hooks/createState';
import useFiniteStateMachine from '../../hooks/useFiniteStateMachine';
import useInputs, { InputConfig } from '../../hooks/useInputs';
import {
	KBPostFire,
	StateKeybindFn,
	validateKeybindConfig,
} from '../../hooks/useKeybinds';
import { CreateCustomEntity } from '../../types/Entity';
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
		inputs: inputs.output,
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
		typeof inputConfig.channels,
		StateKeybindFn,
		KBPostFire
	>({
		move: ({ input }) =>
			input.channels.mods.includes('ShiftLeft') ? 'run' : 'walk',
		jump: () => 'jump',
		dance: () => 'dance',
		mods: () => undefined,
		_post: (props) => {
			if (!player.readyForStateChange()) return;

			props
				? player.stateMachine()?.changeState(props)
				: player.toDefaultState();
		},
	});

	inputs.listen(inputConfig);

	player.loadModelAndAnims({
		parentDir: 'qwop',
		modelName: 'character',
		modelExt: 'fbx',
		animNames: ['idle', 'walk', 'run', 'jump', 'dance'],
	});

	player.setStateMachine(
		useFiniteStateMachine(player, fsm, inputs.output, keybindConfig)
	); //! Ignore the error, validateKeybindConfig is all that matters

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
