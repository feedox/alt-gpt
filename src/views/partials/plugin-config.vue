<template lang="pug">
form(@submit.prevent="submit").bg-white
	.modal-card(style='width: 960')
		header.modal-card-head
			p.modal-card-title() Configure Plugin - 
				span.italic {{obj.manifest.name_for_human}}

			a(v-if="$app.helpers.isModal(this)",type='button' @click="$emit('close')")
				i.fas.fa-window-close
		section.modal-card-body
			div.term
				fieldset
					legend General:
					.b-field
						b-checkbox#check(v-model='pSettings.corsProtected',type='checkbox') Is plugin's API is CORS protected?

				fieldset
					legend Authentication:

					b-field(label='Auth type').no-margin
						b-select(placeholder='Select auth type', v-model="pSettings.authType")
							option(v-for='(v, k) in authTypes' :value='k' :key='k') {{ v }}
							//- option(value="none") None
							//- option(value="bearer") Bearer (authorization headers)
							//- option(value="query") Query parameter
					br

					.form-group(v-if="pSettings.authType == 'bearer'")
						label Bearer Token:
						input(v-model='pSettings.authBearerToken',type='text',minlength='1')

					.layout-row(v-if="pSettings.authType == 'query'")
						.form-group(flex="30")
							label Query Param Name:
							input(v-model='pSettings.authQueryName',type='text',minlength='1')
						.form-group(flex)
							label Value:
							input(v-model='pSettings.authQueryValue',type='text',minlength='1')

					//- .layout-row
						//- .form-group
						//- 	label Last Name:
						//- 	input(v-model='obj.lastName',type='text',required,minlength='2')
					//- .row
					//- 	.form-group
					//- 		label Title:
					//- 		input(v-model='obj.title',type='text',required,minlength='2')
					//- .row
						.form-group
							label Organization:
							input(v-model='obj.organization',type='text',required,minlength='2')
					//- .row
					//- 	.form-group
					//- 		label About:
					//- 		textarea.textarea.my-input(v-model='obj.about',rows=5, placeholder='About')

					//- .row
					//- 	.form-group
					//- 		label Personal site:
					//- 		input(v-model='obj.website',type='url',required,minlength='6')

					//- .row
					//- 	.form-group
					//- 		label Location:
					//- 		input(v-model='obj.location',type='text',minlength='3')


				//- fieldset
					legend Images:
					div Profile Image:
					.layout-row
							.box-digital-card-avatar
								.img-bg(:style="{'background-image': 'url(\"' + obj.picture + '\")'}")

							.control.box-digital-card-avatar
								form-upload(v-model="obj.picture", :single="true", max-size="500")

					hr
					.row
						div Header Images:
						.control
							form-upload(v-model="obj.images", max-size="500")
						div Preview:
						b-carousel(:pause-info='false')
							b-carousel-item(v-for='(image, i) in obj.images', :key='i')
								section(:class='`hero is-medium`')
									.hero-body.has-text-centered
										.img-bg(:style="{'background-image': 'url(\"' + image.url + '\")'}",style="height:300px")

		//- footer.modal-card-foot
			b-button(label='Cancle' type="is-light", @click="$emit('close')",v-if="$app.helpers.isModal(this)")
			//- b-button(label='Delete' type='is-danger', @click="deleteItem", v-show='id != null').is-danger
			b-button(label='Save' type='submit', @click="submit").is-primary

	b-loading(:is-full-page='true', :active.sync='isBusy', :can-cancel='false')
		
</template>

<script lang="ts">
import { timeStamp } from 'console';
import { libx } from '/frame/scripts/ts/browserified/frame.js';
import helpers from '/scripts/ts/app/app.helpers.js';

export default {
	data() {
		return {
			isBusy: false,
			pSettings: {
				corsProtected: null,
				authType: null,
				authBearerToken: null,
				authQueryName: null,
				authQueryValue: null,
			},
			authTypes: {
				none: 'None',
				bearer: 'Bearer (authorization headers)',
				query: 'Query parameter',
			},
		};
	},
	props: {
		obj: {},
		settings: {},
	},
	created() {
		console.log('props: ', this.obj, this.settings);
	
		if (this.settings[this.obj.manifest.name_for_model] == null) this.settings[this.obj.manifest.name_for_model] = {};
		this.pSettings = libx.clone({...this.settings[this.obj.manifest.name_for_model]}, this.pSettings);
	
		if (this.pSettings.authType == null) {
			this.pSettings.authType = this.obj.manifest?.auth?.authorization_type ?? this.obj.manifest?.auth?.type;
		}
	
		if (this.pSettings.corsProtected != null)
			this.pSettings.corsProtected == (this.pSettings.corsProtected === true || this.pSettings.corsProtected === 'true');
		else 
			this.pSettings.corsProtected = this.obj.corsProtected;

		this.$forceUpdate();
	},
	async beforeMount() {
		// const unwatch = this.$watch('pSettings', (val) => {
		// 	// unwatch();
		// 	console.log('-- pSettings changed', val);
		// 	this.$forceUpdate;
		// 	// modal.close();
		// }, { deep: true });
	},
	methods: {
		// async submit() {
		// 	this.isBusy = true;
			
		// 	console.log('-submit');

		// 	this.isBusy = false;
		// 	this.$forceUpdate();
		// },
	},
	watch: {
		pSettings: {
			handler(val) {
				console.log('-- pSettings changed', val);
				this.settings[this.obj.manifest.name_for_model] = {...val};
			},
			deep: true,
		},
	},
	computed: {},
};
</script>

<style lang="less" scoped>
@import (reference) '../../styles/essentials.less';
@import (reference) '../../styles/style.less';

.modal-card-foot { justify-content: end; }
</style>
