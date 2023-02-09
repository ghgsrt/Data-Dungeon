import { createEffect, onMount } from 'solid-js';
import createDemo from '../../hooks/createDemoWorld';
import createEntity from '../../hooks/createEntity';
import createState, { CreateStateFns } from '../../hooks/createState';
import useFiniteStateMachine from '../../hooks/useFiniteStateMachine';
import useInputs, { validateKeybindConfig } from '../../hooks/useInputs';
import globalStore from '../../global';
import { CreateCustomEntity, Entity } from '../../types/Entity';
import { InputConfig } from '../../types/Input';
import { Codes } from '../../types/KeyCodes';
import { StateBuilderMap } from '../../types/State';
import XRay from '../XRay';

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
				inputs?.output.channels.mods.includes('ShiftLeft')
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

	inputs?.listen(inputConfig, keybindConfig);

	player.loadModelAndAnims({
		parentDir: 'qwop',
		modelName: 'character',
		modelExt: 'fbx',
		animNames: ['idle', 'walk', 'run', 'jump', 'dance'],
	});

	player.setStateMachine(useFiniteStateMachine(player, fsm));

	return player;
};

let xRay: HTMLDivElement;
let container: HTMLDivElement;
function GameWindow() {
	const { activeComponent } = globalStore;
	const inputs = useInputs();

	let player: Entity, player2: Entity;

	createEffect(() => {
		if (player2?.modelReady()) console.log('Model Ready!');
	});

	onMount(() => {
		const demo = createDemo(container);
		player = createQWOPPlayer(demo.scene, demo.camera, inputs);
		demo.setControls(player);

		const demo2 = createDemo(xRay);
		player2 = createQWOPPlayer(demo2.scene, demo2.camera);
		demo2.setControls(player2);

		// the initial canvas sizing event is fired after the component is mounted
		// but before the components are visible (thus, they get fed improper size values
		// (or something like that lol)), so we need to wait for the activeComponent
		// signal to then resize the canvases
		createEffect(() => {
			if (activeComponent() === 'QWOP') {
				demo.onWindowResize();
				demo2.onWindowResize();
			}
		});
	});

	return (
		<div class="relative h-full w-full">
			<div ref={container} class="z-0 h-full w-full" />
			<XRay name="QWOP" reference={container}>
				<div ref={xRay} class="absolute" />
			</XRay>
		</div>
	);
}

export default GameWindow;
