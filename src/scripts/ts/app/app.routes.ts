// fix "NavigationDuplicated":
import { Vue, VueRouter, libx } from '/frame/scripts/ts/browserified/frame.js';
import helpers from '/scripts/ts/app/app.helpers.js';
import { router, baseRoutes, applyRoutes } from 'frame.libx.js/build-web/scripts/ts/app/app.routes.js';

const routes = {
	'/': { component: helpers.lazyLoader('/views/main.vue.js'), redirect: '/chat' },

	// views
	'/chat': { component: helpers.lazyLoader('/views/chat.vue.js') },
	'/profile': { component: helpers.lazyLoader('/frame/views/misc/login.vue.js') },

	// misc:
	'/terms': { component: helpers.lazyLoader('/views/misc/terms.vue.js') },
	'/privacy': { component: helpers.lazyLoader('/views/misc/privacy.vue.js') },
	'/user-deletion': { component: helpers.lazyLoader('/views/misc/deletion.vue.js') },
	// '/login': { component: helpers.lazyLoader('/views/misc/login.vue.js') },
	'/unsupported': { component: helpers.lazyLoader('/views/misc/unsupported.vue.js') },
	'*': { component: helpers.lazyLoader('/views/misc/404.vue.js') },
};

applyRoutes(libx.merge(baseRoutes, routes));

export { router };
