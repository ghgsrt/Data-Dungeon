import { modifyMutable, produce } from 'solid-js/store';
import { Entity } from '../types/Entity';
import {
	State,
	StateFn,
	StateEnterFn,
	StateUpdateFn,
	StateFinishedFn,
	StateCleanupFn,
	StateExitFn,
	StateProps,
	StateEnterProps,
	StateUpdateProps,
	StateFinishedProps,
	StateCleanupProps,
	StateExitProps,
	StateBuilderFn,
} from '../types/State';

const boilerplateDefaultState = createState('nameOfAnimationInFSM');

const boilerplateCustomState = createState('nameOfAnimationInFSM', {
	enter: ({ action, prevState, getPrevAction, setTimeFromRatio }, entity) =>
		action.play(), // action.play() should be the very last thing called
	update: ({ action, timeElapsed, input }, entity) => {}, // likely won't need
	finished: ({ action, getMixer }, entity) => {}, // likely won't need
	cleanup: ({ action, getMixer }, entity) => {}, // likely won't need
	exit: ({ action }, entity) => {}, // likely won't need
});

export interface CreateStateFns {
	enter?: StateEnterFn;
	update?: StateUpdateFn;
	finished?: StateFinishedFn;
	cleanup?: StateCleanupFn;
	exit?: StateExitFn;
}

function createState(name: string, stateFns?: CreateStateFns): StateBuilderFn {
	const stateFnWrapper = <P extends StateProps>(
		callback: StateFn,
		entity: Entity,
		props?: Partial<P>
	) => {
		modifyMutable(
			entity.animations,
			produce((animations) => {
				const _props: StateProps = {
					...props,
					action: animations[name].action,
				};

				//! Don't know how to make TS recognize the following
				//! won't cause an error lol
				if ('prevState' in _props) {
					//? default assignments
					_props.action.enabled = true;
					_props.action.time = 0.0;
					_props.action.setEffectiveTimeScale(1.0);
					_props.action.setEffectiveWeight(1.0);

					_props.getPrevAction = () =>
						animations[_props.prevState?.name]?.action;

					_props.setTimeFromRatio = (name?: string) => {
						if (name && _props.prevState?.name !== name) return;

						const prevAction = _props.getPrevAction();
						const ratio =
							_props.action.getClip().duration /
							prevAction.getClip().duration;
						_props.action.time = prevAction.time * ratio;
					};

					let prevAction;
					if ((prevAction = _props.getPrevAction()))
						_props.action.crossFadeFrom(prevAction, 0.5, true);
				}

				callback(_props, entity);
			})
		);
	};

	return (entity) => {
		const getMixer = () => entity.animations[name].action.getMixer();
		const changeState = (name: string) =>
			entity.stateMachine()?.changeState(name);

		const enter: State['enter'] = (prevState) => {
			if (stateFns?.finished) {
				getMixer().addEventListener('finished', finished);
			}

			const defaultEnter: StateEnterFn = ({
				prevState,
				action,
				setTimeFromRatio,
			}) => {
				// if (prevState) setTimeFromRatio();
				action.play();
			};

			stateFnWrapper<StateEnterProps>(
				stateFns?.enter ?? defaultEnter,
				entity,
				{
					prevState,
				}
			);
		};

		const update: State['update'] = (timeElapsed, input) => {
			if (stateFns?.update) {
				stateFnWrapper<StateUpdateProps>(stateFns.update, entity, {
					timeElapsed,
					input,
					changeState,
				});
			}
		};

		const finished: State['finished'] = () => {
			if (stateFns?.finished)
				stateFnWrapper<StateFinishedProps>(stateFns.finished, entity, {
					getMixer,
				});
		};

		const cleanup: State['cleanup'] = () => {
			if (stateFns?.cleanup)
				stateFnWrapper<StateCleanupProps>(stateFns.cleanup, entity, {
					getMixer,
				});
			getMixer().removeEventListener('finished', finished);
		};

		const exit: State['exit'] = () => {
			if (stateFns?.exit)
				stateFnWrapper<StateExitProps>(stateFns.exit, entity);
			cleanup;
		};

		return {
			name,
			enter,
			update,
			finished,
			cleanup,
			exit,
		};
	};
}

export default createState;

// function createState(
// 	name: string,
// 	enter: StateEnterFn,
// 	update: StateUpdateFn,
// 	exit: StateExitFn
// ): StateBuilderFn {
// 	return (entity) => ({
// 		name,
// 		enter: (prevState) => enter(entity, prevState),
// 		update: (timeElapsed, input) => update(entity, timeElapsed, input),
// 		exit: () => exit(entity),
// 	});
// }
