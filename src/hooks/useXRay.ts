import { onMount } from 'solid-js';
import { useDragAndDrop } from './useDragAndDrop';
import useMatchElementSize from './useMatchElementSize';

function useXRay() {
	const {
		updateOffsets,
		setContainer,
		setParent,
		setReference,
		setElements,
	} = useMatchElementSize(undefined, undefined, undefined, true);
	const { start, drag, end, isDragging } = useDragAndDrop();

	const _start = (e: MouseEvent) => start(e);

	const _drag = (e: MouseEvent) => {
		if (isDragging()) {
			drag(e);
			updateOffsets();
		}
	};

	onMount(() => setTimeout(() => updateOffsets(), 0));

	return {
		updateOffsets,
		setContainer,
		setParent,
		setReference,
		setElements,
		start: _start,
		drag: _drag,
		end,
	};
}

export default useXRay;
