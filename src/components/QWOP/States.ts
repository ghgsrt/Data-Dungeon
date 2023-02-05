import { LoopOnce } from 'three';
import createState from '../../hooks/createState';

// export const idleState = createState('idle');
// export const jumpState = createState('jump');
// export const walkState = createState('walk');
// export const runState = createState('run');

// export const walkState = createState('walk', {
// 	enter: ({ action, prevState, setTimeFromRatio }) => {
// 		if (prevState && prevState.name === 'run') setTimeFromRatio();

// 		action.play();
// 	},
// });

// export const runState = createState('run', {
// 	enter: ({ action, prevState, setTimeFromRatio }) => {
// 		if (prevState && prevState.name === 'walk') setTimeFromRatio();

// 		action.play();
// 	},
// });
// export const danceState = createState('dance', {
// 	enter: ({ action, prevState, getPrevAction }) => {
// 		if (prevState) {
// 			const prevAction = getPrevAction();

// 			action.reset();
// 			action.setLoop(LoopOnce, 1);
// 			action.clampWhenFinished = true;
// 			action.crossFadeFrom(prevAction, 0.2, true);
// 		}

// 		action.play();
// 	},
// });