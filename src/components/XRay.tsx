import { JSX, onMount } from 'solid-js';
import useXRay from '../hooks/useXRay';

import '../style.css';

interface XRayProps {
	name: string;
	reference: HTMLDivElement;
	children: JSX.Element;
}

let xRayMachine: HTMLDivElement;
function XRay({ name, reference, children }: XRayProps) {
	onMount(() =>
		useXRay(name, children as HTMLElement, xRayMachine, reference)
	);

	return (
		<div
			id="xRayMachine"
			ref={xRayMachine}
			class=" absolute top-0 left-0 h-1/4 w-1/4 cursor-pointer overflow-hidden border border-black pt-10"
		>
			{children}
		</div>
	);
}

export default XRay;
