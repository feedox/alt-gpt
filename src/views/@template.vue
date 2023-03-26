<template lang="pug">
	.view.container.content.term
		.view-intro
			:markdown
				> {{$root.headers.viewName}} - {{$root.headers.pageTitle}}
				===============
				
				{{$root.headers.desc}}

				----

		.view-content
			
</template>

<script lang="ts">
import { libx } from '/frame/scripts/ts/browserified/frame.js';
import helpers from '/scripts/ts/app/app.helpers.js';

export default {
	layout: {
		headers: {
			viewName: '@Template',
			pageTitle: '@Template',
			desc: '@Template Description',
		}
	},
	data() {
		return {};
	},
	created() {},
	mounted() {},
	methods: {},
	watch: {},
	computed: {},
};
</script>

<style lang="less" scoped>
// @import (reference) '../styles/essentials.less';
// @import (reference) '../styles/style.less';

.view { --variable: 4px; }
.content { /* border-radius: var(--variable); border:1px solid @gray; */ }
</style>
