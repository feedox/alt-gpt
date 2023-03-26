<template lang="pug">
.container.padding40
	h1 TESTT - Dynamic Comp 001-2
	.row
		.col-sm-3(v-for='item in items', v-bind:key='item.id')
			.artist
			img.artist__image(v-bind:src='item.image')
			h4.text-center {{ item.title }}

</template>

<script lang="ts">
import { libx } from '/frame/scripts/ts/browserified/frame.js';
import helpers from '/scripts/ts/app/app.helpers.js';

export default {
	created() {},
	mounted() {},
	props: {},
	data() {
		return {};
	},
	methods: {},
	watch: {},
	computed: {},
	components: {}
};
</script>

<style lang="less" scoped>
// @import (reference) '../styles/essentials.less';
// @import (reference) '../styles/style.less';

</style>
