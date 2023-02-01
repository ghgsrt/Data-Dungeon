import { onCleanup, onMount } from 'solid-js';
import init from '../models/JumpModel.js';

let container: HTMLDivElement;
function Model() {
	const { initModel, destroyModel } = init();

	onMount(() => initModel(container));
	onCleanup(() => destroyModel());

	return <div ref={container} id="container" />;
}

export default Model;
