import { createSignal, Show } from 'solid-js';
import GameWindow from './components/QWOP/GameWindow';
import Model from './components/Model.jsx';
import SlideToggle from './components/SlideToggle';

function App() {
	const [playingQWOP, setPlayingQWOP] = createSignal(false);

	return (
		<>
			<div class="ml-52">
				<span>Model </span>
				<SlideToggle
					onChange={(e: Event) =>
						setPlayingQWOP((e.target as HTMLInputElement).checked)
					}
				/>
				<span> QWOP</span>
			</div>
			<Show when={playingQWOP()} fallback={<Model />}>
				<GameWindow />
			</Show>
		</>
	);
}

export default App;
