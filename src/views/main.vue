<template lang="pug">
	.view.content.hero.is-fullheight-with-navbar.fg-white
		.hero-head
			
		.hero-body
			h1 Hello

		.hero-foot
			
</template>

<script lang="ts">
(async()=>{
	const libs = await System.import('/scripts/ts/browserified/libs.js');
	console.log('main debug - libs: ', libs, libs.qrcode);
})()
import helpers from '/scripts/ts/app/app.helpers.js';

export default  {

	data() {
		return {
		};
	},
	created() {
		helpers.updateMeta({...this.$app.layout.headers, ...{
			desc: 'Innovation first',
			image: '/resources/imgs/main/main-link-preview-innovation.png',
		}});
	},
	mounted() {},
	methods: {},
	watch: {},
	computed: {},
};
</script>

<style lang="less" scoped>
@import (reference) '../styles/essentials.less';
@import (reference) '../styles/style.less';

body { background:none; }
.view { background: #333; z-index: -2; position: relative; }

.main-slogan h1 { font-size:68px; .bolder }
.sitebg { z-index:-1; }

.block-intro {  max-width:500px; }
.feature-img { max-width:400px; border-radius:15px; }
.block-feature { margin-top:150px; margin-bottom:150px; max-width:1200px; margin-left:auto; margin-right:auto; }
.block-comp { max-width:500px; }

@media screen and (max-width: 599px) {
	.feature-img { max-width:95%; display:flex; margin:auto; }
	.block-feature { margin-top:50px; margin-bottom:50px; }
	.block-comp { max-width:100%; }
}
</style>
