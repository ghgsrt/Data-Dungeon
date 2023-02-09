import { createEffect, createSignal } from 'solid-js';
import useOffset from './useOffset';

export interface DnDOptions {
	reference?: HTMLElement;
	onAny?: (event?: MouseEvent) => void;
	onStart?: (event: MouseEvent) => void;
	onDrag?: (event: MouseEvent) => void;
	onEnd?: () => void;
}

export const useDragAndDrop = (element: HTMLElement, options?: DnDOptions) => {
	const [isDragging, setIsDragging] = createSignal(false);
	const [onStart, setOnStart] = createSignal(options?.onStart);
	const [onDrag, setOnDrag] = createSignal(options?.onDrag);
	const [onEnd, setOnEnd] = createSignal(options?.onEnd);
	const [onAny, setOnAny] = createSignal(options?.onAny);
	const [innerOffsetX, setInnerOffsetX] = createSignal(0);
	const [innerOffsetY, setInnerOffsetY] = createSignal(0);
	const {
		element: _element,
		offsets,
		setElement,
		updateOffsets,
	} = useOffset(element, {
		shallow: true,
		shouldUpdate: true,
	});

	const any = (event?: MouseEvent) => {
		if (!_element()) {
			console.log('oh no');
			return;
		}

		updateOffsets();
		if (onAny()) onAny()!(event);
	};

	const start = (event: MouseEvent) => {
		const { clientX, clientY } = event;
		const { left, top } = offsets;

		setInnerOffsetX(left - clientX);
		setInnerOffsetY(top - clientY);

		_element()!.addEventListener('mousemove', drag);
		options?.reference?.addEventListener('mousemove', drag);
		window.addEventListener('mouseup', end);

		setIsDragging(true);

		if (onStart()) onStart()!(event);
		any(event);
	};

	const drag = (event: MouseEvent) => {
		if (isDragging() && _element()) {
			const x = event.clientX + innerOffsetX();
			const y = event.clientY + innerOffsetY();

			_element()!.style.left = `${x}px`;
			_element()!.style.top = `${y}px`;

			if (onDrag()) onDrag()!(event);
			any(event);
		}
	};

	const end = () => {
		(options?.reference ?? _element())!.removeEventListener(
			'mousemove',
			drag
		);
		window.removeEventListener('mouseup', end);

		setIsDragging(false);

		if (onEnd()) onEnd()!();
		any();
	};

	createEffect(() => _element()?.addEventListener('mousedown', start));

	return {
		isDragging,
		setElement,
		setOnAny,
		setOnStart,
		setOnDrag,
		setOnEnd,
	};
};
