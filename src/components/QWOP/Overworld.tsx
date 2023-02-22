import { createEffect, createSignal, onMount } from 'solid-js';
import { createStore, modifyMutable, produce } from 'solid-js/store';
import {
	Box3,
	Box3Helper,
	Color,
	Group,
	LoopOnce,
	PerspectiveCamera,
	PlaneGeometry,
	Quaternion,
	Shape,
	ShapeGeometry,
	Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import createDemo from '../../hooks/createDemoWorld';
import globalStore from '../../global';
import createEntity from '../../hooks/createEntity';
import createState, { CreateStateFns } from '../../hooks/createState';
import useAnimStateMachine from '../../hooks/useFiniteStateMachine';
import { CreateCustomEntity } from '../../types/Entity';
import { InputConfig, KeybindConfig } from '../../types/Input';
import { Codes } from '../../types/KeyCodes';
import { StateBuilderMap } from '../../types/State';
import useInputs from '../../hooks/useInputs';
import useEventListener from '../../hooks/useEventListener';

const namesToMatch = ['idle', 'walk', 'walk-backward', 'run', 'run-backward'];
const matchTimeOnEnter = (names: string[]): CreateStateFns => ({
	enter: ({ action, setTimeFromRatio }) => {
		setTimeFromRatio(names);
		action.play();
	},
});

const createPlayer: CreateCustomEntity = (scene, camera, inputs) => {
	const player = createEntity({
		scene,
		camera,
		load: {
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
			],
		},
		state: {
			mouseClicked: false,
			colliding: false,
			collidesWith: [],
		},
	});

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
		jump: createState('jump', {
			enter: ({ action }) => {
				action.setLoop(LoopOnce, 1);
				action.play();
			},
			finished: ({ action }) => {
				console.log('yo');
				// action.stop().reset();
				//! MAKE IT STOP T-POSING DURING THE TRANSITION WTF
				//! ALSO MAKE IT CHANGE TO THE PREV STATE (need to add tracking to animStateMachine??)
				player.stateMachine()?.changeState('idle');
			},
		}),
	};

	player.setStateMachine(useAnimStateMachine(player, fsm));

	const inputConfig = {
		channels: {
			move: ['KeyW', 'KeyA', 'KeyS', 'KeyD'],
			jump: ['Space'],
			mods: ['ShiftLeft'],
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
			KeyA: (pressed) =>
				player.setState('actions', 'move', 'left', pressed),
			KeyD: (pressed) =>
				player.setState('actions', 'move', 'right', pressed),
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
			jump: () => undefined,
			mods: (key) => (key === 'ShiftLeft' ? 'move' : 'no-op'),
		},
		post: (result) =>
			result
				? player.stateMachine()?.changeState(result as string)
				: player.toDefaultState(),
	};

	inputs?.listen(inputConfig, keybindConfig); //! ignore error

	return player;
};

const degToRad = (deg: number) => deg * (Math.PI / 180);

let container: HTMLDivElement;
function Overworld() {
	const [world, setWorld] = createSignal<ReturnType<typeof createDemo>>();
	const [buildings, setBuildings] = createStore<
		Record<
			string,
			{
				path: string;
				position: [number, number, number];
				rotation: [number, number, number];
				group?: Group;
			}
		>
	>({
		gym: {
			path: './buildings/gym.glb',
			position: [-90, 1, 30],
			rotation: [0, degToRad(10), 0],
			group: undefined,
		},
		home: {
			path: './buildings/home.glb',
			position: [65, 1, 200],
			rotation: [0, degToRad(105), 0],
			group: undefined,
		},
		hospital: {
			path: './buildings/hospital.glb',
			position: [-40, 1, -200],
			rotation: [0, -degToRad(30), 0],
			group: undefined,
		},
	});

	const { activeComponent } = globalStore;
	const inputs = useInputs();

	const setBuilding = (name: string, building: Group, bBox?: Box3Helper) => {
		if (!world()) return;

		setBuildings(name, 'group', building);
		modifyMutable(
			world()!.scene,
			produce((scene) => {
				scene.add(building);
				if (bBox) scene.add(bBox);
			})
		);

		world()!
			.controls()! //? player
			.setState(
				'collidesWith',
				produce((arr: Group[]) => arr.push(building))
			);
	};

	const loadBuilding = (
		path: string,
		position: [number, number, number],
		rotation: [number, number, number]
	) => {
		let building: Group;
		new GLTFLoader().load(path, (gltf) => {
			building = gltf.scene;
			building.scale.setScalar(11);
			building.position.set(...position);
			building.rotateX(rotation[0]);
			building.rotateY(rotation[1]);
			building.rotateZ(rotation[2]);

			const box = new Box3().setFromObject(building);
			const bBox = new Box3Helper(box, new Color(0xff0000));
			// bBox.rotateX(rotation[0]);
			// bBox.rotateY(rotation[1]);
			// bBox.rotateZ(rotation[2]);

			const buildingName = path.split('/')[2].split('.')[0];
			setBuilding(buildingName, building, bBox);
		});
	};

	const generateWorldPlane = () => {
		const width = 250;
		const height = 500;
		const x = -width / 2;
		const y = -height / 2;
		const radius = 70;

		const plane = new Shape();
		plane.moveTo(x, y + radius);
		plane.lineTo(x, y + height - radius);
		plane.quadraticCurveTo(x, y + height, x + radius, y + height); // top right
		plane.lineTo(x + width - radius * 2, y + height);
		// bottom right
		plane.quadraticCurveTo(
			x + width,
			y + height,
			x + width,
			y + height - radius
		);
		plane.lineTo(x + width, y + radius);
		plane.quadraticCurveTo(x + width, y, x + width - radius, y); // bottom left
		plane.lineTo(x + radius * 2, y);
		plane.quadraticCurveTo(x, y, x, y + radius); // top left

		return new ShapeGeometry(plane) as PlaneGeometry;
	};

	const calculateOffset = (
		position: Vector3,
		rotation: Quaternion,
		x: number,
		y: number,
		z: number
	) => {
		const offset = new Vector3(x, y, z);

		offset.applyQuaternion(rotation);
		offset.add(position);

		return offset;
	};

	onMount(() => {
		setWorld(createDemo(container));
		const player = createPlayer(world()!.scene, world()!.camera, inputs);
		world()!.setControls(player);

		world()!.plane().material.color.set(0x006600);
		// world()!.plane().geometry = new PlaneGeometry(250, 500, 25, 25);
		world()!.plane().geometry = generateWorldPlane();

		for (const building in buildings) {
			const { path, position, rotation } = buildings[building];
			loadBuilding(path, position, rotation);
		}

		modifyMutable(
			world()!.camera,
			produce((camera) => {
				camera = new PerspectiveCamera(
					70,
					container.offsetWidth / container.offsetHeight,
					0.01,
					10
				);
				camera.position.set(0, 2, -2);
				camera.lookAt(world()!.scene.position);
			})
		);

		useEventListener('mousedown', () =>
			player.setState('mouseClicked', true)
		);
		useEventListener('mouseup', () =>
			player.setState('mouseClicked', false)
		);

		let currentPosition = new Vector3();
		let currentLookAt = new Vector3();
		world()!.onUpdate((timeElapsed) => {
			world()!.updateCamera((camera) => {
				if (player.target()) {
					const { x, y, z } = player.target()!.position;
					world()!
						.orbControls()
						?.target.set(x, y + 12.5, z);

					if (!player.state.mouseClicked) {
						const cameraPositionOffset = calculateOffset(
							player.target()!.position,
							player.target()!.quaternion,
							0,
							18,
							-24
						);
						const cameraFocusOffset = calculateOffset(
							player.target()!.position,
							player.target()!.quaternion,
							0,
							1,
							50
						);
						const t = 1.0 - Math.pow(0.0025, timeElapsed);

						currentPosition.lerp(cameraPositionOffset, t);
						currentLookAt.copy(cameraFocusOffset);

						camera.position.copy(currentPosition);
						camera.lookAt(currentLookAt);
					}
				}
			});
		});

		createEffect(() => {
			if (activeComponent() === 'Overworld') {
				world()!.onWindowResize();
			}
		});
	});

	return <div ref={container} class="relative h-full w-full" />;
}

export default Overworld;
