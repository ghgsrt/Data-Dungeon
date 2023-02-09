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
import { clamp } from 'three/src/math/MathUtils';
import usePathRider from '../../hooks/usePathRider';

const matchTimeOnEnter = (names: string[]): CreateStateFns => ({
	enter: ({ action, setTimeFromRatio }) => {
		setTimeFromRatio(names);
		action.play();
	},
});

const createQWOPPlayer: CreateCustomEntity = (scene, camera, inputs) => {
	const player = createEntity({
		scene,
		camera,
		state: {
			pathRider: {
				input: 0,
				max: 1750,
			},
		},
	});

	const fsm: StateBuilderMap = {
		idle: createState('idle'),
		walk: createState('walk', matchTimeOnEnter(['run', 'idle'])),
		run: createState('run', matchTimeOnEnter(['walk', 'idle'])),
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
			// KeyA: (pressed) =>
			// 	player.setState('actions', 'move', 'left', pressed),
			KeyS: (pressed) =>
				player.setState('actions', 'move', 'backward', pressed),
			// KeyD: (pressed) =>
			// 	player.setState('actions', 'move', 'right', pressed),
			ShiftLeft: (pressed) =>
				player.setState('actions', 'move', 'sprinting', pressed),
		},
		{
			move: () =>
				inputs!.output.channels.move.length > 0
					? inputs!.output.channels.mods.includes('ShiftLeft')
						? 'run'
						: 'walk'
					: 'idle',
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

let svgPath: SVGLineElement;
let svgRider: SVGPathElement;
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

		const pathRider = usePathRider({
			path: svgPath,
			rider: svgRider,
			custom: player.state.pathRider,
		});

		player.onUpdate(() => {
			let delta: number;
			if (player.state.actions.move.forward) delta = 1;
			else if (player.state.actions.move.backward) delta = -1;
			else delta = 0;

			if (player.state.actions.move.sprinting) delta *= 5;

			player.setState('pathRider', 'input', (input: number) =>
				clamp(input + delta, 0, player.state.pathRider.max)
			);

			pathRider.ride();
		});

		const demo2 = createDemo(xRay);
		player2 = createQWOPPlayer(demo2.scene, demo2.camera);
		demo2.setControls(player2);

		createEffect(() => {
			if (demo.orbControls()) {
				demo.orbControls()!.minAzimuthAngle = -Math.PI / 2;
				demo.orbControls()!.maxAzimuthAngle = -Math.PI / 2;
				demo.orbControls()!.update();
			}
		});
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
			<div ref={container} class="z-0 h-5/6 w-full" />
			<XRay name="QWOP" reference={container}>
				<div ref={xRay} class="absolute" />
			</XRay>
			<div class="flex h-1/6 w-full items-center bg-black">
				<svg
					viewBox="0 0 350 285"
					class="flex-1"
					version="1.1"
					xmlns="http://www.w3.org/2000/svg"
					shape-rendering="geometricPrecision"
					text-rendering="geometricPrecision"
				>
					<path
						ref={svgPath}
						d="M22.061031,163.581791c.750375-2.251126,2.251125-16.508254,26.263131-20.26013s20.26013-8.254128,42.02101,2.251125q21.76088,10.505253-12.006004,18.009005-33.016508.750374,0-18.009005t52.526263,4.427213q6.003001,19.584792,19.134567,14.332166t16.133067-14.332166q32.266133-12.081041,45.772886,0t47.273637,0"
						transform="translate(.000002 0.000001)"
						fill="none"
						stroke="white"
						stroke-width="1"
						stroke-dasharray="3"
					/>
					<path
						// class="transition-all"
						ref={svgRider}
						d="M-2,-2 L3,0 L -2,2 z"
						stroke="red"
						stroke-width="1"
					/>
				</svg>
			</div>
		</div>
	);
}

export default GameWindow;
