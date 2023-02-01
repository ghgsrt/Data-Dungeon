import { onMount, onCleanup } from 'solid-js';

function useEventListener(
	event: string,
	callback: EventListenerOrEventListenerObject,
	options = false
) {
	onMount(() => window.addEventListener(event, callback, options));
	onCleanup(() => window.removeEventListener(event, callback, options));
}

export default useEventListener;
