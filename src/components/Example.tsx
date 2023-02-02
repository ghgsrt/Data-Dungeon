import { onMount, createSignal, createEffect } from 'solid-js';

// "static" variable
const greetList = ['World', 'Sherman', 'Bryonna', 'Colin'];

function Example() {
	// reactive variables
	const [greeting, setGreeting] = createSignal(greetList[0]);
	const [counter, setCounter] = createSignal(0);

	// callback is fired whenever the dependency, counter, changes outside of it
	createEffect(() => {
		const idx = counter() % greetList.length;
		setCounter(idx); // does not trigger the callback
		setGreeting(greetList[idx]);
	});

	// callback fired once when the component is created
	onMount(() => {
		console.log(`Hello, ${greeting()}!`);
	});

	return (
		<>
			<button
				class="w-24 h-10 m-10 rounded-xl bg-gray-200 hover:bg-gray-300 transition-colors"
				onClick={() => setCounter((prev) => prev + 1)}
			>
				Next
			</button>
			<h1 class="ml-10 text-8xl text-gray-200">Hello, {greeting()}!</h1>
		</>
	);
}

export default Example;
