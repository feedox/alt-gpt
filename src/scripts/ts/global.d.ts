import { ILibxBrowser } from 'libx.js/build/bundles/browser.essentials';
import { System } from 'typescript';
import Vue from 'vue';
import { App } from './app';
// import frame from 'frame.libx.js';

export {};

declare module 'vue/types/options' {
	interface ComponentOptions<V extends Vue> {
		// custom fields:
	}
}

declare global {
	declare var app: App;
	interface Window {
		// projconfig: any;
	}
}

declare module NodeJS {
	interface Global {}
}

// declare var sanitizeHtml: Function;
