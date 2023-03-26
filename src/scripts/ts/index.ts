// export { SpeechRecognizer as Speech } from './SpeechRecognizer';
// export { Synthesis } from './Synthesis';

import { App } from '/scripts/ts/app/index.js';

export async function bootstrap() {
	await App.init();
}
