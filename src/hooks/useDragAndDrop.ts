import { createSignal } from 'solid-js';
import useOffset from './useOffset';

export const useDragAndDrop = <T extends HTMLElement>() => {
	const [isDragging, setIsDragging] = createSignal(false);
	const [innerOffsetX, setInnerOffsetX] = createSignal(0);
	const [innerOffsetY, setInnerOffsetY] = createSignal(0);

	const start = (event: MouseEvent) => {
		const element = event.target as T;

		const { clientX, clientY } = event;
		const { left, top } = useOffset(element, {
			shallow: true,
			shouldUpdate: false,
		}).offsets;

		console.log(left, top, clientX, clientY);

		setInnerOffsetX(left - clientX);
		setInnerOffsetY(top - clientY);

		setIsDragging(true);
	};

	const drag = (event: MouseEvent) => {
		if (isDragging()) {
			const x = event.clientX + innerOffsetX();
			const y = event.clientY + innerOffsetY();
			const element = event.target as T;
			console.log(x);
			console.log(y);
			console.log(innerOffsetX());
			console.log(innerOffsetY());
			element.style.left = `${x}px`;
			element.style.top = `${y}px`;
		}
	};

	const end = () => setIsDragging(false);

	return { start, drag, end, isDragging };
};
