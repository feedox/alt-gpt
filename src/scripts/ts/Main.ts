export * as store from './app/app.store';

export default class App {
	constructor() {}

	public run() {
		console.log('Hello World!');
		return true;
	}
}

class Program {
	public static async main() {
		let error: Error = null;

		try {
			console.log('----------------');
			let app = new App();
			app.run();
			console.log('DONE');
		} catch (err) {
			error = err;
		} finally {
			if (error) {
				console.error('----- \n [!] Failed: ', error);
				return process.exit(1);
			}
		}
	}
}

// Program.main();
