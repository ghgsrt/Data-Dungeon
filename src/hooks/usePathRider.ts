export interface PathRider {
	ride: (ratio?: number) => void;
	clickToScroll: (e: MouseEvent) => void;
	onClick: (e: MouseEvent, callback: (pt: DOMPoint) => void) => void;
	// getLengthAtPoint: (pt: DOMPoint) => number;
	// getScrollPosFromLength: (len: number) => number;
}

export interface PathRiderProps {
	rider: SVGPathElement;
	path: SVGPathElement | SVGLineElement;
	custom?: {
		input: number;
		max: number;
	};
	rideOnInit?: boolean;
}

const usePathRider = ({
	path,
	rider,
	custom,
	rideOnInit = true,
}: PathRiderProps): PathRider => {
	const max = custom
		? custom.max
		: document.documentElement.scrollHeight - window.innerHeight;
	const pathLen = path.getTotalLength();
	const step = 0.5;

	let currLen = -step;
	const pointArr: DOMPoint[] = [];
	while ((currLen += step) <= pathLen)
		pointArr.push(path.getPointAtLength(currLen));

	const radToDeg = (rad: number) => (180 * rad) / Math.PI;

	const distance = (a: DOMPoint, b: DOMPoint) =>
		Math.sqrt(Math.pow(a.y - b.y, 2) + Math.pow(a.x - b.x, 2));

	const onClick = (e: MouseEvent, callback: (pt: DOMPoint) => void) => {
		let pt = new DOMPoint(e.clientX, e.clientY);
		callback(pt.matrixTransform(path.getScreenCTM()?.inverse()));
	};

	const getLengthAtPoint = (pt: DOMPoint) => {
		let bestGuessIdx = 0;
		let bestGuessDist = Number.MAX_VALUE;
		let guessDist: number;

		pointArr.forEach((point, idx) => {
			if ((guessDist = distance(pt, point)) < bestGuessDist) {
				bestGuessDist = guessDist;
				bestGuessIdx = idx;
			}
		});

		return bestGuessIdx * step;
	};

	const getScrollPosFromLength = (len: number) => (len * max) / pathLen;

	const clickToScroll = (e: MouseEvent) => {
		onClick(e, (point) => {
			const lengthAtPoint = getLengthAtPoint(point);
			const scrollPos = getScrollPosFromLength(lengthAtPoint);

			window.scrollTo({
				top: scrollPos,
				behavior: 'smooth',
			});
		});
	};

	let lastDist: number;
	const ride = (ratio?: number) => {
		const input = custom
			? custom.input
			: window.scrollY || window.pageYOffset;
		const dist = pathLen * (ratio ? ratio : input / (max || 1));

		const pos = path.getPointAtLength(dist);
		let angle: number;

		// calculate position a little ahead of the rider (or behind if we are at the end),
		//  so we can calculate the rider angle
		const dir = lastDist <= dist; // true=right
		if (dir ? dist + 1 <= pathLen : dist - 1 >= 0) {
			const nextPos = path.getPointAtLength(dist + (dir ? 1 : -1));
			angle = Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x);
		} else {
			const nextPos = path.getPointAtLength(dist + (dir ? -1 : 1));
			angle = Math.atan2(pos.y - nextPos.y, pos.x - nextPos.x);
		}

		lastDist = dist;

		rider.setAttribute(
			'transform',
			`translate(${pos.x}, ${pos.y}) rotate(${radToDeg(angle)})`
		);
	};

	if (rideOnInit) ride();

	return {
		ride,
		clickToScroll,
		onClick,
		// getLengthAtPoint,
		// getScrollPosFromLength,
	};
};

export default usePathRider;
