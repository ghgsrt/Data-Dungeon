import { createEffect, createMemo, createSignal } from 'solid-js';
import useOffset from './useOffset';

function useMatchElementSize(
	container?: HTMLElement,
	parent?: HTMLElement,
	reference?: HTMLElement,
	shouldMatchPos = false
) {
	const [_container, setContainer] = createSignal(container);
	const [_parent, setParent] = createSignal(parent);
	const [_reference, setReference] = createSignal(reference);
	const parentOffsets = useOffset(_parent(), { shallow: true });
	const referenceOffsets = useOffset(_reference());

	createEffect(() => {
		if (_parent()) parentOffsets.setElement(_parent());
	});
	createEffect(() => {
		if (_reference()) referenceOffsets.setElement(_reference());
	});

	createEffect(() => {
		if (_container() && _reference()) {
			_container()!.style.width = `${referenceOffsets.offsets.width}px`;
			_container()!.style.height = `${referenceOffsets.offsets.height}px`;

			if (shouldMatchPos) {
				if (_parent()) {
					_container()!.style.top = `${-parentOffsets.offsets.top}px`;
					_container()!.style.left = `${-parentOffsets.offsets
						.left}px`;
				} else {
					_container()!.style.top = `${referenceOffsets.offsets.top}px`;
					_container()!.style.left = `${referenceOffsets.offsets.left}px`;
				}
			}
		}
	});

	const updateOffsets = () => {
		parentOffsets.updateOffsets();
		referenceOffsets.updateOffsets();
	};

	const setElements = (
		container: HTMLElement,
		parent: HTMLElement,
		reference: HTMLElement
	) => {
		setContainer(container);
		setParent(parent);
		setReference(reference);
	};

	return {
		container: _container,
		parent: _parent,
		reference: _reference,
		updateOffsets,
		setElements,
		setContainer,
		setParent,
		setReference,
	};
}

export default useMatchElementSize;
