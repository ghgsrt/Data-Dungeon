import { createEffect, createSignal } from 'solid-js';
import useOffset from './useOffset';

function useMatchElement(
	container?: HTMLElement,
	parent?: HTMLElement,
	reference?: HTMLElement,
	shouldMatchPos = false
) {
	const [_container, setContainer] = createSignal(container);
	const _parent = useOffset(parent, { shallow: true });
	const _reference = useOffset(reference);

	createEffect(() => {
		if (_container() && _reference.element()) {
			_container()!.style.width = `${_reference.offsets.width}px`;
			_container()!.style.height = `${_reference.offsets.height}px`;

			if (shouldMatchPos) {
				_container()!.style.top = `${-(
					_parent.element() ? _parent : _reference
				).offsets.top}px`;
				_container()!.style.left = `${-(
					_parent.element() ? _parent : _reference
				).offsets.left}px`;
			}
		}
	});

	const updateOffsets = () => {
		_parent.updateOffsets();
		_reference.updateOffsets();
	};

	const setElements = (
		container: HTMLElement,
		parent: HTMLElement,
		reference: HTMLElement
	) => {
		setContainer(container);
		_parent.setElement(parent);
		_reference.setElement(reference);
	};

	return {
		container: _container,
		parent: _parent,
		reference: _reference,
		updateOffsets,
		setElements,
		setContainer,
		setParent: _parent.setElement,
		setReference: _reference.setElement,
	};
}

export default useMatchElement;
