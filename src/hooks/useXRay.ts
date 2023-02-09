import { useDragAndDrop } from './useDragAndDrop';
import useMatchElementSize from './useMatchElementSize';
import globalStore from '../global';
import { createEffect } from 'solid-js';

function useXRay(
	componentName: string,
	container: HTMLElement,
	parent: HTMLElement,
	reference: HTMLElement
) {
	const {
		updateOffsets,
		setContainer,
		setParent,
		setReference,
		setElements,
	} = useMatchElementSize(container, parent, reference, true);
	const { isDragging, setOnAny, setOnStart, setOnDrag, setOnEnd } =
		useDragAndDrop(parent, { onAny: () => updateOffsets(), reference });

	const { activeComponent } = globalStore;

	createEffect(() => {
		if (activeComponent() === componentName) updateOffsets();
	});

	return {
		updateOffsets,
		setContainer,
		setParent,
		setReference,
		setElements,
		isDragging,
		setOnAny,
		setOnStart,
		setOnDrag,
		setOnEnd,
	};
}

export default useXRay;
