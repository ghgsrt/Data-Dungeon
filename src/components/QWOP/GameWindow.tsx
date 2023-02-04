import { onMount } from 'solid-js';
import createDemo from '../../hooks/createDemoWorld';
import createEntity from '../../hooks/createEntity';
import useFiniteStateMachine from '../../hooks/useFiniteStateMachine';
import useInputs, { InputConfig } from '../../hooks/useInputs';
import { LoadModelsConfig, EntityConfig } from '../../types/Entity';
import { Codes } from '../../types/KeyCodes';
import { StateBuilderMap } from '../../types/State';
import {
	idleState,
	walkState,
	runState,
	jumpState,
	danceState,
} from './States';

const inputConfig: InputConfig<Codes> = {
	channels: {
		move: {
			'x-': ['KeyW', 'ArrowUp'],
			'y-': ['KeyA', 'ArrowLeft'],
			x: ['KeyS', 'ArrowRight'],
			y: ['KeyD', 'ArrowDown'],
		},
		jump: ['Space'],
		dance: ['KeyF'],
		mods: ['ShiftLeft'],
	},
	options: {
		use: 'code',
	},
};

const loadConfig: LoadModelsConfig = {
	parentDir: 'qwop',
	modelName: 'character',
	modelExt: 'fbx',
	animNames: ['idle', 'walk', 'run', 'jump', 'dance'],
};

const fsm: StateBuilderMap = {
	idle: idleState,
	walk: walkState,
	run: runState,
	jump: jumpState,
	dance: danceState,
};

let container: HTMLDivElement;
function GameWindow() {
	const { outputChannels, listen } = useInputs();

	onMount(() => {
		const { scene, camera, ...demo } = createDemo(container);
		listen(inputConfig);

		const entityConfig: EntityConfig = {
			scene,
			camera,
			inputs: outputChannels,
		};

		const player = createEntity(entityConfig);
		player.loadModelAndAnims(loadConfig);
		player.setStateMachine(useFiniteStateMachine(player, fsm));
		demo.setControls(player);
	});

	return <div ref={container} class="h-screen w-full" />;
}

export default GameWindow;
