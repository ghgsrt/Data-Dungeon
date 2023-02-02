const KeyCodes = {
	w: 'KeyW',
	W: 'KeyW',
	ArrowUp: 'ArrowUp',
	a: 'KeyA',
	A: 'KeyA',
	ArrowLeft: 'ArrowLeft',
	s: 'KeyS',
	S: 'KeyS',
	ArrowDown: 'ArrowDown',
	d: 'KeyD',
	D: 'KeyD',
	ArrowRight: 'ArrowRight',
	' ': 'Space',
} as const;

export type Keys = keyof typeof KeyCodes;
export type Codes = typeof KeyCodes[Keys];
