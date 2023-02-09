import { createRoot, createSignal } from 'solid-js';

function useGlobalStore() {
	const [activeComponent, setActiveComponent] = createSignal('');

	return {
		activeComponent,
		setActiveComponent,
	};
}

export default createRoot(useGlobalStore);
