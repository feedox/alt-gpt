<template lang="pug">
	.view.container.content.term
		section.hero.is-fullheight-with-navbar
			.hero-body
				.container
					//- p.title
					h1.title.center 404 - Not Found
</template>

<script lang="ts">
import { libx } from '/frame/scripts/ts/browserified/frame.js';
import helpers from '/scripts/ts/app/app.helpers.js';

export default {
	data() {
		return {
		}
	},
	async beforeCreate() {
	},
	async created() {
		helpers.updateMeta({...this.$app.layout.headers, ...{
			// viewName: 'zuz.to - Digital Business Cards',
			viewName: '',
			pageTitle: '404 - Not Found',
			desc: 'Opps - Page not found',
			// image: '/resources/imgs/main/main-link-preview-innovation.png',
		}});
	},
	async mounted() {
	}
}
</script>

<style lang="css" scoped>
	.section {  }
</style>
