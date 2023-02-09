import { createEffect, onMount } from 'solid-js';
import createDemo from '../../hooks/createDemoWorld';
import createEntity from '../../hooks/createEntity';
import createState, { CreateStateFns } from '../../hooks/createState';
import useFiniteStateMachine from '../../hooks/useFiniteStateMachine';
import useInputs, { validateKeybindConfig } from '../../hooks/useInputs';
import useXRay from '../../hooks/useXRay';
import globalStore from '../../stores/global';
import { CreateCustomEntity, Entity } from '../../types/Entity';
import { InputConfig } from '../../types/Input';
import { Codes } from '../../types/KeyCodes';
import { StateBuilderMap } from '../../types/State';

import './qwop.css';

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

let container: HTMLDivElement;
let xRay: HTMLDivElement;
let xRayMachine: HTMLDivElement;
function GameWindow() {
	const { activeComponent } = globalStore;

	const inputs = useInputs();
	const { start, drag, end, setElements, updateOffsets } = useXRay();

	let demo: ReturnType<typeof createDemo>,
		demo2: ReturnType<typeof createDemo>;
	let player: Entity, player2: Entity;

	createEffect(() => {
		// the initial canvas sizing event is fired after the component is mounted
		// but before the components are visible (thus, they get fed improper size values
		// (or something like that lol)), so we need to wait for the activeComponent
		// signal to then resize the canvases and update the offsets for the xray
		if (activeComponent() === 'QWOP') {
			demo.onWindowResize();
			demo2.onWindowResize();
			updateOffsets();
		}
	});

	onMount(() => {
		demo = createDemo(container);
		demo2 = createDemo(xRay);

		player = createQWOPPlayer(demo.scene, demo.camera, inputs);
		demo.setControls(player);

		player2 = createQWOPPlayer(demo2.scene, demo2.camera);
		demo2.setControls(player2);

		setElements(xRay, xRayMachine, container);
	});

	createEffect(() => {
		if (player2.modelReady()) console.log('Model Ready!');
	});

	return (
		<div class="relative h-full w-full">
			<div ref={container} class="z-0 h-full w-full"></div>
			<div
				id="xRayMachine"
				ref={xRayMachine}
				onMouseDown={start}
				onMouseMove={drag}
				onMouseUp={end}
				class="absolute top-0 left-0 h-1/5 w-1/5 cursor-pointer overflow-hidden border border-black"
			>
				<div class="z-20 h-5 w-full bg-slate-700" />
				<div ref={xRay} id="xRay" class="absolute" />
			</div>
		</div>
	);
}

export default GameWindow;
