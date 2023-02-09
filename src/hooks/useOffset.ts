import { createEffect, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import useEventListener from './useEventListener';

export interface OffsetOptions {
	shallow?: boolean;
	shouldUpdate?: boolean;
	reference?: HTMLElement;
}

function useOffset(
	element?: HTMLElement,
	options: OffsetOptions = { shouldUpdate: true }
) {
	const [_element, setElement] = createSignal<HTMLElement | undefined>(
		element
	);
	const [offsets, setOffsets] = createStore({
		top: 0,
		left: 0,
		width: 0,
		height: 0,
	});

	const updateOffsets = () => {
		if (_element()) {
			let top = 0;
			let left = 0;
			let el: any = _element();
			while (el && !isNaN(el.offsetTop) && !isNaN(el.offsetLeft)) {
				top += el.offsetTop - el.scrollTop;
				left += el.offsetLeft - el.scrollLeft;

				if (options.shallow) break;
				if (options.reference && el === options.reference) break;

				el = el.offsetParent;
			}

			setOffsets({
				top,
				left,
				width: _element()!.offsetWidth,
				height: _element()!.offsetHeight,
			});
		}
	};

	//? may or may not be needed
	if (options?.shouldUpdate) {
		createEffect(() => {
			if (_element()) updateOffsets();
		});
		useEventListener('resize', updateOffsets, false).subscribe();
	}

	return { element: _element, offsets, updateOffsets, setElement };
}

export default useOffset;
