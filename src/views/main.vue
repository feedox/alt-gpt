<template lang="pug">
	.view.content.hero.is-fullheight-with-navbar.fg-white
		img.sitebg(src="/resources/imgs/bg_matrix_optimized.gif")
		// Hero head: will stick at the top
		.hero-head
			
		// Hero content: will be in the middle
		.hero-body
			.has-text-centered.main-slogan.centered.dots
				//- h1.title.bolder.prompt.marked-primary liv.tools
				//- h2.subtitle.lighter by Elya Livshitz
				div.margin60 &nbsp;

				div
					.my-logo
						//- img(src='/resources/imgs/feedox-logo-square.png')

					div.margin20 &nbsp;
					//- div.block-intro.huge
					//- 	div.padding.centered
					//- 		p(style="max-width:350px; line-height:1.5em;").bigger.
					//- 			The web, for machines. <br/>
					//- div.margin10 &nbsp;

					.row(layout-gt-xs="row",layout-align="space-between center")
						div.block-intro.huge
							//- The web, <br/>for machines. <br/>
							div.padding.centered.
								[TBD]&nbsp;
							div.padding.centered
								// /Web3.0, <br/>Semantic web.<br/>
						div &nbsp;
					
				//- .btn(@click="$app.helpers.navigate('/profile')").margin20 Create New Card<br/>for Free


				//- div
					.my-logo
						img(src='/resources/imgs/feedox-logo-square.png')

					div.margin20 &nbsp;
					//- div.block-intro.huge
					//- 	div.padding.centered
					//- 		p(style="max-width:350px; line-height:1.5em;").bigger.
					//- 			The web, for machines. <br/>
					//- div.margin10 &nbsp;

					.row(layout-gt-xs="row",layout-align="space-between center")
						div.block-intro.huge
							//- The web, <br/>for machines. <br/>
							div.padding.centered.
								Coming soon
							//- div.padding.centered.
								Web3.0, <br/>Semantic web.<br/>
						div &nbsp;
					
				//- .btn(@click="$app.helpers.navigate('/profile')").margin20 Create New Card<br/>for Free

		// Hero footer: will stick at the bottom
		.hero-foot
			
			//- nav.tabs.is-boxed.is-fullwidth
				.container
					ul
						li.is-active
							a Overview
						li
							a Modifiers
						li
							a Grid
						li
							a Elements
						li
							a Components
						li
							a Layout
											
</template>

<script lang="ts">
// import { documentToHtmlString } from '/scripts/ts/browserified/index.js';
(async()=>{
	const libs = await System.import('/scripts/ts/browserified/libs.js');
	console.log('main debug - libs: ', libs, libs.qrcode);
})()
// import { libx } from '/frame/scripts/ts/browserified/frame.js';
import helpers from '/scripts/ts/app/app.helpers.js';
// import a from '/scripts/ts/browserified/index.js';
// import x from '/scripts/ts/browserified/libs.js';
// console.log('main debug: ', a, x);

export default  {

	data() {
		return {
		};
	},
	created() {
		helpers.updateMeta({...this.$app.layout.headers, ...{
			// viewName: 'zuz.to - Digital Business Cards',
			// pageTitle: 'Web3.0 - Semantic Web',
			// desc: 'Rediscover the web',
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
// @import (reference) '../styles/style.less';
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
