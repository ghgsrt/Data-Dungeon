let pollRegister: (() => void)[] = [];
function usePollRate(callback: () => void, timer: number) {
	if (pollRegister.includes(callback)) return;

	pollRegister.push(callback);
	setTimeout(
		() => (pollRegister = pollRegister.filter((reg) => reg !== callback)),
		timer
	);

	callback();
}

export default usePollRate;
