import { libx } from '/frame/scripts/ts/browserified/frame.js';

export class AltGPT {
	public apiUrl = 'https://us-central1-feedox-1113.cloudfunctions.net/altgpt-plugins';
	public apiUrlDev = 'http://0.0.0.0:8080';

	public constructor(public options?: Partial<ModuleOptions>) {
		libx.log.v('AltGPT:ctor: ');
		this.options = { ...new ModuleOptions(), ...options };

		if (!!localStorage.isLocal) {
			libx.log.i('AltGPT: Detected isLocal, setting remote API to local env', this.apiUrlDev);
			this.apiUrl = this.apiUrlDev;
		}
	}

	public async callAgent(pluginUrl: string, prompt: string, apikey: string, config?: {}) {
		try {
			return await libx.di.modules.network.httpPostJson(this.apiUrl, {
				plugin: pluginUrl,
				prompt,
				apikey,
				config,
			});
		} catch (e) {
			libx.log.w('AltGPT: callAgent: ', e.response);
			try {
				e = JSON.parse(e.response);
				try {
					const w = JSON.parse(e.error?.config?.data);
					return w.messages;
				} catch {
					throw e?.error ?? e;
				}
			} catch {
				throw e;
			}
		}
	}
}

export class ModuleOptions { }
