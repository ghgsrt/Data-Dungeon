import { createSignal, For, JSX } from 'solid-js';
import GameWindow from './components/QWOP/GameWindow';
import Model from './components/Model.jsx';
import InputExample from './components/InputExample';
import Default from './components/Default';

function App() {
	const [currentDemoTitle, setCurrentDemoTitle] = createSignal<string>('');

	const demoMenu: Record<string, JSX.Element> = {
		Default: <Default />,
		'useInput Example': <InputExample />,
		Model: <Model />,
		QWOP: <GameWindow />,
	};

	return (
		<div class="flex w-screen h-screen bg-gray-800">
			<div class="flex flex-col w-min h-screen">
				<For each={Object.keys(demoMenu)}>
					{(demoTitle) => (
						<div
							class={`flex-1 flex justify-center items-center p-1 
									bg-gray-300 hover:bg-gray-400 
									  select-none cursor-pointer 
									  shadow-inner transition-colors
									  active:bg-gray-400
									  ${currentDemoTitle() === demoTitle ? 'bg-gray-400' : ''}`}
							onClick={() => setCurrentDemoTitle(demoTitle)}
						>
							{demoTitle}
						</div>
					)}
				</For>
			</div>
			<div class="flex-1 h-screen">{demoMenu[currentDemoTitle()]}</div>
		</div>
	);
}

export default App;
