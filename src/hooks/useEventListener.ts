import { onMount, onCleanup } from 'solid-js';

function useEventListener(
	event: string,
	callback: EventListenerOrEventListenerObject
) {
	onMount(() => window.addEventListener(event, callback));
	onCleanup(() => window.removeEventListener(event, callback));
}

export default useEventListener;
