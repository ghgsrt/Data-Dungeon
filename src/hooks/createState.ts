import { modifyMutable, produce } from 'solid-js/store';
import { Entity } from '../types/Entity';
import {
	StateFn,
	StateBuilderFn,
	StateEnterFn,
	StateExitFn,
	StateUpdateFn,
	StateEnterProps,
	StateExitProps,
	StateUpdateProps,
	StateProps,
	StateCleanupFn,
	StateFinishedFn,
	State,
	StateFinishedProps,
	StateCleanupProps,
} from '../types/State';

const boilerplateState = createState(
	'changeme',
	(entity, { action, prevState, getPrevAction }) => {
		action.play(); // should be the very last thing
	},
	(entity, { action, timeElapsed, input }) => {},
	(entity, { action, getMixer }) => {}, // likely won't need
	(entity, { action, getMixer }) => {}, // likely won't need
	(entity, { action }) => {} // likely won't need
);

function createState(
	name: string,
	enter: StateEnterFn,
	update: StateUpdateFn,
	finished?: StateFinishedFn,
	cleanup?: StateCleanupFn,
	exit?: StateExitFn
): StateBuilderFn {
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
					// default assignments
					_props.action.enabled = true;
					_props.action.time = 0.0;
					_props.action.setEffectiveTimeScale(1.0);
					_props.action.setEffectiveWeight(1.0);

					_props.getPrevAction = () =>
						animations[_props.prevState?.name]?.action;

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

		const _enter: State['enter'] = (prevState) => {
			if (finished) {
				getMixer().addEventListener('finished', _finished);
			}

			return stateFnWrapper<StateEnterProps>(enter, entity, {
				prevState,
			});
		};

		const _update: State['update'] = (timeElapsed, input) =>
			stateFnWrapper<StateUpdateProps>(update, entity, {
				timeElapsed,
				input,
				changeState: (name: string) => {
					entity.stateMachine()?.changeState(name);
				},
			});

		const _finished: State['finished'] = () =>
			finished
				? () =>
						stateFnWrapper<StateFinishedProps>(finished, entity, {
							getMixer,
						})
				: () => {}; // no op

		const _cleanup: State['cleanup'] = cleanup
			? () =>
					stateFnWrapper<StateCleanupProps>(cleanup, entity, {
						getMixer,
					})
			: () => getMixer().removeEventListener('finished', _finished);

		const _exit: State['exit'] = exit
			? () => stateFnWrapper<StateExitProps>(exit, entity)
			: _cleanup;

		return {
			name,
			enter: _enter,
			update: _update,
			finished: _finished,
			cleanup: _cleanup,
			exit: _exit,
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
