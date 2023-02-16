import { createSignal } from 'solid-js';

// https://stackoverflow.com/a/52490977
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
	? R
	: _TupleOf<T, N, [T, ...R]>;
export type Tuple<T, N extends number> = N extends N
	? number extends N
		? T[]
		: _TupleOf<T, N, []>
	: never;

export interface Response {
	message: string;
	key: string;
	channelHead: string;
	from?: string;
	extra?: Record<string, any>;
}
// export type Response = StateObject<ResponseProps>;
interface RequiredStateObjectProps {
	message: string;
	key: string;
	channelHead: string;
	from?: string;
}
export type StateObject = Record<string, any> & RequiredStateObjectProps;
export interface State<T extends StateObject> {
	state: T;
	sharedState: Record<string, any>;
}

export type StateManagerFnProps<P extends StateObject = StateObject> = Tuple<
	State<P>,
	4
>;
export type StateManagerConfig<C, P extends StateObject, R> = Partial<
	Record<keyof C, (props: StateManagerFnProps<P>) => R>
>;

function useStateManager<T extends StateObject>(channels: string[]) {
	const { state, prevState, changeState } = useStateMachine();

	const stateMachines: Record<
		string,
		ReturnType<typeof useStateMachine<T>>
	> = {};
	for (const channel of channels)
		stateMachines[channel] = useStateMachine<T>();

	return {
		state,
		prevState,
		stateMachines,
		changeState,
	};
}

const defState: Record<'state' | 'sharedState', any> = {
	state: {},
	sharedState: {},
};
export function useStateMachine<T extends StateObject>() {
	const [prevState, setPrevState] = createSignal<State<T>>(defState);
	const [state, setState] = createSignal<State<T>>(defState);

	const changeState = (newState: T) => {
		setPrevState((_) => state());
		setState((_) => ({
			state: newState,
			sharedState: state()?.sharedState ?? {},
		}));
	};

	return {
		prevState,
		state,
		changeState,
	};
}

export default useStateManager;
