import { Vue, libx } from '/frame/scripts/ts/browserified/frame.js';

const store = {
	debug: true,
	state: Vue.observable(<any>{
		profile: null,
	}),
	actions: {
		
	},
	// ...actions,
};

export default {
	store,
	// we can add objects to the Vue prototype in the install() hook:
	install(Vue, options) {
		Vue.prototype.$appStore = store;
	},
};
