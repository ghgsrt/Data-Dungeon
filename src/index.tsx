/* @refresh reload */
import { render } from 'solid-js/web';

import './reset.css';
import '../dist/style.css';
import App from './App';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
render(() => <App />, document.getElementById('root')!);
