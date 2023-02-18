import { createEffect, createSignal, onMount } from 'solid-js';
import createDemo from '../../hooks/createDemoWorld';
import createEntity from '../../hooks/createEntity';
import createState, { CreateStateFns } from '../../hooks/createState';
import useAnimStateMachine from '../../hooks/useFiniteStateMachine';
import useInputs from '../../hooks/useInputs';
import globalStore from '../../global';
import { CreateCustomEntity, Entity } from '../../types/Entity';
import { InputConfig, KeybindConfig } from '../../types/Input';
import { Codes } from '../../types/KeyCodes';
import { StateBuilderMap } from '../../types/State';
import XRay from '../XRay';
import { clamp } from 'three/src/math/MathUtils';
import usePathRider from '../../hooks/usePathRider';
import { Mesh, MeshPhongMaterial, Vector3 } from 'three';
import { Response, StateManagerConfig } from '../../hooks/useStateManager';

const degToRad = (deg: number) => deg * (Math.PI / 180);

const RAD90 = degToRad(90);
const RAD180 = degToRad(180);
const calcLargestY = (
	hipAngle: number,
	femurLen: number,
	kneeAngle: number,
	tibiaLen: number
) => {
	kneeAngle = RAD180 - kneeAngle;

	//! the condition will be the most likely source of bugs
	//? if should calc from the knee instead of the foot
	//* it doesn't actually match my calculations... but it seems to work so whatever
	if (!(hipAngle + (RAD180 - Math.abs(kneeAngle)) <= RAD90))
		return femurLen * Math.cos(hipAngle);

	const bigHyp = Math.sqrt(
		Math.pow(femurLen, 2) +
			Math.pow(tibiaLen, 2) -
			2 * femurLen * tibiaLen * Math.cos(kneeAngle)
	);
	const adjAngle = Math.asin((tibiaLen * Math.sin(kneeAngle)) / bigHyp);

	return bigHyp * Math.cos(hipAngle + adjAngle);
};

const namesToMatch = ['idle', 'walk', 'walk-backward', 'run', 'run-backward'];
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
			limbs: {
				RightUpLeg: {
					axis: new Vector3(1, 0, 0),
					angle: 0,
					min: -Math.PI / 3.5,
					max: Math.PI / 1.7,
				},
				LeftUpLeg: {
					axis: new Vector3(1, 0, 0),
					angle: 0,
					min: -Math.PI / 3.5,
					max: Math.PI / 1.7,
				},
				RightLeg: {
					axis: new Vector3(1, 0, 0),
					angle: 0,
					min: -Math.PI / 2,
					max: 0,
				},
				LeftLeg: {
					axis: new Vector3(1, 0, 0),
					angle: 0,
					min: -Math.PI / 2,
					max: 0,
				},
			},
			limbControls: {
				RightUpLegForward: false,
				RightUpLegBackward: false,
				LeftUpLegForward: false,
				LeftUpLegBackward: false,
				// RightLegForward: false,
				// RightLegBackward: false,
				// LeftLegForward: false,
				// LeftLegBackward: false,
			},
			gravity: 0.1,
			targetY: 0,
		},
	});

	player.loadModelAndAnims({
		parentDir: 'qwop',
		modelName: 'character',
		modelExt: 'fbx',
		animNames: [
			'idle',
			'walk',
			'walk-backward',
			'run',
			'run-backward',
			'jump',
			'dance',
			'falling-down',
			'down',
		],
		additAnimNames: ['walk-injured'],
	});

	const inputConfig = {
		channels: {
			move: ['KeyW', 'KeyA', 'KeyS', 'KeyD'],
			jump: ['Space'],
			dance: ['KeyF'],
			mods: ['ShiftLeft'],
			qwop: [
				'KeyE',
				'KeyR',
				'KeyT',
				'KeyY',
				'KeyG',
				'KeyU',
				'KeyI',
				'KeyO',
				'KeyP',
			],
		},
		options: {
			use: 'code',
		},
	} satisfies InputConfig<Codes>;

	const keybindConfig: KeybindConfig<
		Codes, //? 'keys' keys
		Partial<typeof inputConfig.channels>, //? 'channels' keys
		string, //? '_post' fn param type & state manager fn return type
		Response //? 'channels' fns return type if using state manager
	> = {
		keys: {
			KeyW: (pressed) =>
				player.setState('actions', 'move', 'forward', pressed),
			KeyS: (pressed) =>
				player.setState('actions', 'move', 'backward', pressed),
			// KeyF: (pressed) =>
			// 	player.toggleAction('walk-injured', 0.5, pressed),
			KeyE: (pressed) =>
				player.setState('limbControls', 'RightUpLegBackward', pressed),
			KeyR: (pressed) =>
				player.setState('limbControls', 'RightUpLegForward', pressed),
			KeyT: (pressed) =>
				player.setState('limbControls', 'LeftUpLegBackward', pressed),
			KeyY: (pressed) =>
				player.setState('limbControls', 'LeftUpLegForward', pressed),
			// KeyU: (pressed) =>
			// 	player.setState('limbControls', 'RightLegBackward', pressed),
			// KeyI: (pressed) =>
			// 	player.setState('limbControls', 'RightLegForward', pressed),
			// KeyO: (pressed) =>
			// 	player.setState('limbControls', 'LeftLegBackward', pressed),
			// KeyP: (pressed) =>
			// 	player.setState('limbControls', 'LeftLegForward', pressed),
			KeyG: (pressed) => {
				if (pressed) player.stateMachine()?.changeState('falling-down');
			},
			ShiftLeft: (pressed) =>
				player.setState('actions', 'move', 'sprinting', pressed),
		},
		channels: {
			move: (_, head) => {
				const { forward, backward } = player.state.actions.move;

				if (!head || forward === backward) return 'idle';

				const isRunning =
					inputs!.output.channels.mods.includes('ShiftLeft');
				if (forward) return isRunning ? 'run' : 'walk';
				if (backward)
					return isRunning ? 'run-backward' : 'walk-backward';
			},
			mods: (key) => (key === 'ShiftLeft' ? 'move' : 'no-op'),
			jump: () => undefined,
			dance: () => 'no-op',
			qwop: () => {
				'no-op';
			},
		},
		post: (result) => {
			//! create a thing to handle no-op, locked, unlock, etc.
			//! for more granular state control
			// let _result = result;
			// if (
			// 	lastResult &&
			// 	from === 'useInputs' &&
			// 	lastResult[0] === 'no-op'
			// ) {
			// 	_result = 'no-op';
			// }
			// lastResult = [result as string, from as string];

			if (result === 'no-op') return;
			console.log(result);
			return result
				? player.stateMachine()?.changeState(result as string)
				: player.toDefaultState();
		},
	};

	//? fnProps: [curr, prev, mostRecent, prevMostRecent]
	const stateManagerConfig: StateManagerConfig<
		typeof inputConfig.channels, //? keys
		Response, //? fn props
		string //? return type
	> = {
		// move: ({ state }) => state.message,
		// jump: ({ state }) => state.message,
		// dance: ({ state }) => state.message,
		// mods: ({ state }) => state.message,
		// qwop: ({ state }) => state.message,
	};

	inputs?.listen(inputConfig, keybindConfig, stateManagerConfig);

	const fsm: StateBuilderMap = {
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
		jump: createState('jump'),
		dance: createState('dance'),
		'falling-down': createState('falling-down', {
			update: ({ changeState }) => {
				if (player.state.timers['falling-down'] > 0.9)
					changeState('down');
			},
		}),
		down: createState('down', {
			enter: ({ action }) => {
				player.target()?.rotateY(-Math.PI / 2);
				action.play();
			},
			cleanup: () => player.target()?.rotateY(Math.PI / 2),
		}),
	};

	player.setStateMachine(useAnimStateMachine(player, fsm));

	return player;
};

let svgPath: SVGPathElement;
let svgRider: SVGPathElement;
let xRay: HTMLDivElement;
let container: HTMLDivElement;
function GameWindow() {
	const { activeComponent } = globalStore;
	const inputs = useInputs();

	let player: Entity, player2: Entity;

	onMount(() => {
		const demo = createDemo(container);
		player = createQWOPPlayer(demo.scene, demo.camera, inputs);
		demo.setControls(player);

		const pathRider = usePathRider({
			path: svgPath,
			rider: svgRider,
			custom: player.state.pathRider,
		});

		const updatePathRider = () => {
			let delta: number;
			const { forward, backward, sprinting } = player.state.actions.move;

			if (forward === backward) return;
			delta = forward ? 1 : -1;

			if (sprinting) delta *= 5;

			player.setState('pathRider', 'input', (input: number) =>
				clamp(input + delta, 0, player.state.pathRider.max)
			);

			pathRider.ride();
			// pathRider.ride(player.state.timers.jump);
		};

		const updateLimbState = () => {
			const limbControls = player.state.limbControls;
			const limbs = player.state.limbs;

			const STEP_UPPER = 0.1;
			const MIN_UPPER = -Math.PI / 3.5;
			const MAX_UPPER = Math.PI / 1.5;
			for (const control in limbControls) {
				if (!limbControls[control]) continue;

				const goingForward = control.includes('Forward');
				const limbName = control.replace(
					goingForward ? 'Forward' : 'Backward',
					''
				);

				if (!limbs[limbName]) continue;

				const step =
					(goingForward ? 1 : -1) *
					(limbs[limbName].step ?? STEP_UPPER);

				const min = limbs[limbName].min ?? MIN_UPPER;
				const max = limbs[limbName].max ?? MAX_UPPER;

				player.setState('limbs', limbName, 'angle', (angle: number) =>
					clamp(angle + step, min, max)
				);
			}

			const STEP_LOWER = 0.085;
			const MIN_LOWER = -Math.PI / 2;
			const MAX_LOWER = Math.PI / 2;
			const legs = ['LeftLeg', 'RightLeg'];
			const upLegs = ['LeftUpLeg', 'RightUpLeg'];
			for (let i = 0; i < 2; i++) {
				const leg = legs[i];
				const upLeg = upLegs[i];

				const min = limbs[leg].min ?? MIN_LOWER;
				const max = limbs[leg].max ?? MAX_LOWER;

				const angleDir = limbs[upLeg].angle > 0 ? -1 : 0.7;
				const targetAngle =
					angleDir * (RAD90 - (RAD90 - limbs[upLeg].angle));
				const dir = limbs[leg].angle > targetAngle ? -1 : 1;
				const step = dir * (limbs[leg].step ?? STEP_LOWER);

				player.setState('limbs', leg, 'angle', (angle: number) => {
					const newAngle =
						Math.abs(limbs[leg].angle - targetAngle) < step
							? targetAngle
							: angle + step;
					return clamp(newAngle, min, max);
				});
			}
		};

		const lowest = {
			posY: Number.MAX_VALUE,
			name: '',
		};
		//! This function is essential, but full of dumb shit
		//! Would not recommend trying to read it
		const updateLimbRotation = () => {
			const limbNames = Object.keys(player.state.limbs);
			player.scene.updateMatrixWorld();
			player.target()?.updateMatrixWorld();
			player.skellyboi()?.updateMatrixWorld();

			let position = new Vector3();
			const lowestChild = player.target()?.getObjectByName(lowest.name);
			if (lowest.name !== '' && lowestChild) {
				// console.log(lowest.name);
				lowestChild.getWorldPosition(position);
				lowest.posY = position.y;
			}

			// console.log(player.scene.getWorldPosition(new Vector3()));

			player.target()?.traverse((child) => {
				// const posY = child.getWorldPosition(vec).y;

				let limbName: string;
				if (
					limbNames.some((_limbName: string) =>
						child.name.includes((limbName = _limbName))
					)
				) {
					const limb = player.state.limbs[limbName!];
					child.rotateOnAxis(limb.axis, limb.angle);
				}

				player.scene.updateMatrixWorld();
				player.target()?.updateMatrixWorld();
				child.updateMatrixWorld(true);
				child.getWorldPosition(position);
				if (
					child.name &&
					!child.name.includes('Beta') &&
					position.y < lowest.posY
				) {
					// console.log(child.name, position.y);

					lowest.posY = position.y;
					lowest.name = child.name;
				}
			});
		};

		const LIMB_LEN = 4;
		const detLowestY = () => {
			const { RightUpLeg, RightLeg, LeftUpLeg, LeftLeg } =
				player.state.limbs;

			const largestRight = calcLargestY(
				RightUpLeg.angle,
				LIMB_LEN,
				RightLeg.angle,
				LIMB_LEN
			);
			const largestLeft = calcLargestY(
				LeftUpLeg.angle,
				LIMB_LEN,
				LeftLeg.angle,
				LIMB_LEN
			);

			const largest = Math.max(largestRight, largestLeft);

			return 2 * LIMB_LEN - largest;
		};

		const updatePlayerY = () => {
			const currY = player.target()?.getWorldPosition(new Vector3()).y;

			if (currY !== undefined && currY !== player.state.targetY) {
				let step =
					player.state.gravity *
					(currY > player.state.targetY ? -1 : 1);
				const diff = Math.abs(currY - player.state.targetY);
				step = diff < step ? diff : step;
				player.target()?.translateY(step);
			}
		};

		player.onUpdate(() => {
			updatePathRider();
			updateLimbState();
			updateLimbRotation();
			player.setState('targetY', -detLowestY());
			updatePlayerY();
		});

		// const demo2 = createDemo(xRay);
		// player2 = createQWOPPlayer(demo2.scene, demo2.camera);
		// demo2.setControls(player2);

		//? side view, rotation locked to around the x-axis
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
				// demo2.onWindowResize();
			}
		});

		//? color the model
		createEffect(() => {
			if (player?.modelReady()) {
				player.target()?.traverse((child) => {
					(child as Mesh).material = new MeshPhongMaterial({
						color: child.name.includes('Beta_Surface')
							? 0xffffff
							: 0x003087,
						shininess: 10,
					});
				});
			}
		});
	});

	let injured = true;
	const toggleBeans = () => {
		if (player?.readyForStateChange()) {
			console.log(injured);
			player.toggleAdditAction('walk-injured', 0.5, injured, 0.5);
			injured = !injured;
		}
	};

	createEffect(() => {
		if (player?.stateMachine()?.currentState()?.name === 'falling-down') {
			toggleBeans();
		}
	});

	return (
		<div class="relative h-full w-full">
			<div ref={container} class="z-0 h-5/6 w-full" />
			{/* <XRay name="QWOP" reference={container}>
				<div ref={xRay} class="absolute" />
			</XRay> */}
			<div class="flex h-1/6 w-full items-center bg-black">
				<button
					class="h-full w-1/12 bg-white"
					// onClick={() =>
					// 	player.setState('injured', (i: boolean) => !i)
					// }
					onClick={toggleBeans}
				>
					gimp
				</button>
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
