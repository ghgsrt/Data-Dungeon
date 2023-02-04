import { LoopOnce } from 'three';
import createState from '../../hooks/createState';

export const idleState = createState(
	'idle',
	({ action }) => {
		action.play();
	},
	({ input: { move, jump }, changeState }) => {
		if (move.length > 0) changeState('walk');
		if (jump.length > 0) changeState('jump');
	}
);

export const walkState = createState(
	'walk',
	({ action, prevState, getPrevAction }) => {
		if (prevState) {
			const prevAction = getPrevAction();

			if (prevState.name === 'run') {
				const ratio =
					action.getClip().duration / prevAction.getClip().duration;
				action.time = prevAction.time * ratio;
			}
		}

		action.play();
	},
	({ input: { move, jump, mods }, changeState }) => {
		if (move.length > 0) {
			if (mods.includes('ShiftLeft')) changeState('run');
		} else changeState('idle');

		if (jump.length > 0) changeState('jump');
	}
);

export const runState = createState(
	'run',
	({ action, prevState, getPrevAction }) => {
		if (prevState) {
			const prevAction = getPrevAction();

			if (prevState.name === 'walk') {
				const ratio =
					action.getClip().duration / prevAction.getClip().duration;
				action.time = prevAction.time * ratio;
			}
		}

		action.play();
	},
	({ input: { move, mods, jump }, changeState }) => {
		if (move.length > 0) {
			if (!mods.includes('ShiftLeft')) changeState('walk');
		} else changeState('idle');

		if (jump.length > 0) changeState('jump');
	}
);

export const jumpState = createState(
	'jump',
	({ action }) => {
		action.play();
	},
	({ input: { jump }, changeState }) => {
		if (jump.length === 0) changeState('idle');
	}
);

export const danceState = createState(
	'dance',
	({ action, prevState, getPrevAction }) => {
		if (prevState) {
			const prevAction = getPrevAction();

			action.reset();
			action.setLoop(LoopOnce, 1);
			action.clampWhenFinished = true;
			action.crossFadeFrom(prevAction, 0.2, true);
		}

		action.play();
	},
	({ input: { dance }, changeState }) => {
		if (dance.length === 0) changeState('idle');
	}
);
