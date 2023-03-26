import { Vue, VueRouter, libx, Buefy, LogLevel } from '/frame/scripts/ts/browserified/frame.js';
import { App as FrameApp, PageMixin } from '/frame/scripts/ts/app/index.js';

libx.log.filterLevel = LogLevel.Debug;
libx.log.isShowStacktrace = true;
libx.log.isBrowser = true;

import store from '/scripts/ts/app/app.store.js';
import helpers from '/scripts/ts/app/app.helpers.js';
import { router } from '/scripts/ts/app/app.routes.js';
import { api } from '/scripts/ts/app/app.api.js';
import { CombinedVueInstance } from 'vue/types/vue';
import { Log } from 'libx.js/build/modules/log';
import { IFirebase } from 'libx.js/build/types/interfaces';

Vue.config.productionTip = false;

export class App extends FrameApp {
	constructor() {
		super();

		libx.log.v('App:ctor');
		this.initComponents();

		libx.di.register('app', this);
	}

	public static async init(): Promise<App> {
		libx.log.v('app:init:');
		const app = await super.init();

		app.api = api;
		app.router = router;
		app.firebase = libx.di.get<IFirebase>('firebase');
		app.helpers = helpers;
		app.layout.appName = window.projconfig.projectCaption;

		libx.di.inject((log: Log, network, activityLog, myModule) => {
			log.isDebug = false;
			log.isShowStacktrace = true;
			log.debug('net: ', network, activityLog);
		});

		Vue.mixin(PageMixin);

		api.listenToVersion();

		libx.log.i('--- app is ready');

		window.app = app;

		return App.instance;
	}

	initComponents() {
		Vue.component('animation', helpers.lazyLoader('/components/animation.vue.js'));
		Vue.component('loader', helpers.lazyLoader('/components/loader.vue.js'));
		Vue.component('editable', helpers.lazyLoader('/components/editable.vue.js'));

		Vue.use(store);
	}
}
