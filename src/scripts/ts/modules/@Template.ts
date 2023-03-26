import { libx } from '/frame/scripts/ts/browserified/frame.js';

export class MyModule {
	public constructor(public options?: Partial<ModuleOptions>) {
		libx.log.v('MyModule:ctor: ');
		this.options = { ...new ModuleOptions(), ...options };
	}
}

export class ModuleOptions {}
