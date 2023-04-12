<template lang="pug">
.view-wrapper.margin-top20
	.view.content.term.padding20
		//- .box-title 	
			.layout-row.layout-align-start-center
				//- div
					button(label='Save', type='submit' role='button', @click="submit").bg-dark.fg-grayLighter.bigger
						.icon
							i.fas.fa-angle-left
				h1
					a(@click="$app.helpers.navigate('/ai/bot/gallery')") &lt; 
					span.
						Chat

		.view-content
			.box-chat-playground.layout-gt-xs-row.layout-align-center-start
				.box-plugins.box-chat-column(flex-gt-xs="20") 
					fieldset
						legend Plugins
						//- .terminal-alert.fg-white.bg-dark(v-if="selectedPlugins.length>0").small <b>Please note</b>: AI-plugins are currently server-side only, meaning your API key will be securely sent to Feedox's dedicated server without being recorded, tracked, or logged. Ensure you create a dedicated key for testing. Client-side plugin support is <a href="https://github.com/Feedox/alt-gpt/issues/1" target="_blank">in progress</a>.
						.box-plugins-list
							.box-plugins-item(v-for="item in plugins").hover-container
								.layout-row.layout-start-center
									.box-plugins-item-icon
										img.bg-img(:src="item.icon") 
									.box-plugins-item-name.text-truncate(:title="item.name")
										span {{ item.name }}
										.box-plugins-item-configure
											a(@click="configurePlugin(item)").hover.small configure
								.layout-row.layout-align-space-between-end
									.box-plugins-item-desc {{ item.desc }}
									//- input.box-plugins-item-checkbox(type="checkbox")
									input.box-plugins-item-checkbox(type='checkbox', v-model='selectedPlugins', :value="item.id", :id='item.id', :true-value="[]", :d-isabled="selectedPlugins?.length > 0 && selectedPlugins[0] != item.id") 

								//- {{ item }}
				.box-main.box-chat-column(flex) 
					fieldset
						legend Chat

						chat-window(:botId="botId", ref="bot", :config="config", :renderHtml.sync="renderHtml", :docsIds="docsSelected", :selected-plugins="onlySelectedPlugins", :plugins-settings="settingsCache")

				.box-config.box-chat-column(flex-gt-xs="20") 
					fieldset
						legend Config

						form(@submit.prevent="").margin-bottom60
							//- .layout
								.control.flex
									label.label Name
									input(v-model='cache.botName', type="text").hero
									div
								.control(v-if="bot")
									label.label Owner:
									input(:value='bot.owner?.name', readonly, type="text").hero
							//- .layout-row
								.control.flex
									label.label Description:
									textarea.textarea(v-model='cache.desc', rows=2, placeholder='Description', :readonly="botId != null  && !isOwner").hero
							//- hr
							.layout-column
								.control.flex
									label.label Temperature (0-1):
									input(v-model='cache.temperature', type="text").hero
								.control.flex
									label.label Frequency Penalty (0-2):
									input(v-model='cache.frequency_penalty', type="text").hero
								.control.flex
									label.label Presence Penalty (0-2):
									input(v-model='cache.presence_penalty', type="text").hero
							div
								.control
									label.label Priming:
									textarea.textarea.input-priming(v-model='cache.priming', rows=2, placeholder='Priming', :readonly="botId != null  && !isOwner", ref="textareaPriming", @focus="resize('textareaPriming')", @keyup="resize('textareaPriming')").hero
								.control()
									label.label Default Input:
									input(v-model='cache.defaultInput', type="text").hero

							div
								b-field(label='Model').no-margin
									b-select(placeholder='Selected Model', v-model="cache.model")
										option(v-for='(v, k) in models' :value='v.split(":").pop()' :key='k', :disable="true") {{ v }}

							div
								b-field(label='Max Tokens')
									b-slider(v-model='cache.max_tokens', indicator, :tooltip='false', :min='128', :max='4096', :step="128", ticks, size="is-small" )

							div
								.control.flex
									.layout-row.layout-align-space-between-start
										label.label OpenAI API Key:
										b-tooltip(label='Your key is never sent anywhere else than OAI. It is stored in local cache for your convinvience.', multilined, type='is-dark', position='is-left')
											i.fas.fa-info-circle
									input(v-model='cache.apikey', type="password").hero

								
							//- .box-documents 
								h4 Context Documents 
									span (
										router-link(to="/ai/bot/docs").small manage documents
									span ):
								ul
									li.task-list-item(v-for="doc in docs", :key="doc._entity.id", v-if="doc.owner == null || bot?.docs?.contains(doc._entity.id) || doc.owner == $app.userManager.data.public.id").doc
										input(type='checkbox', v-model='docsSelected', :value="doc._entity.id", :id='doc._entity.id', :true-value="[]", :disabled="docsSelected?.length > 0 && docsSelected[0] != doc._entity.id") 
										label(:for='doc._entity.id') {{ doc.name ?? doc.filename }}
										//- router-link(:to="'/ai/bot/qna/?docId='+doc._entity.id", target="_blank") {{ doc.name ?? doc.filename }}
								
	b-loading(:is-full-page='true', :active.sync='isLoading', :can-cancel='false')
</template>

<script lang="ts">
import { libx, ProxyCache } from '/frame/scripts/ts/browserified/frame.js';
import { showdown } from '/scripts/ts/browserified/libs.js';
import helpers from '/scripts/ts/app/app.helpers.js';
import { IConvMessage } from '../scripts/ts/types/IConvMessage';
import { AltGPT } from '/scripts/ts/modules/altGPT.js';

var conv = new showdown.Converter({tables: true, strikethrough: true, tasklists: true, emoji: true, openLinksInNewWindow: true });
const settingsCacheMgr = new ProxyCache(`settings`, {});
// (<any>window).s = settingsCacheMgr;

export default {
	data() {
		return {
			botId: this.$route.params.botId,
			docId: this.$route.query.docId,
			isLoading: false,
			cache: null,
			settingsCache: null,
			messages2: null,
			messages: <IConvMessage[]>[],
			bot: null,
			userId: app.userManager?.data?.public?.id,
			messageHover: false,
			docs: [],
			docsSelected: [],
			models: [
				'openai:gpt-3.5-turbo-0301',
				'openal:gpt-4-0314',
				'openai:text-davinci-002',
				'cohere:command-xlarge-nightly',
				'cohere:xlarge',
				'anthropic:claude-instant-v1.0',
				'ai21:j2-grande-instruct',
			],
			showKeyWarning: true,
			plugins: [],
			selectedPlugins: [],
		};
	},
	beforeMount() {
		const defaultCache = {
			botName: '',
			userMessage: '',
			defaultInput: 'Hey',
			priming: '',
			frequency_penalty: 0,
			presence_penalty: 0,
			temperature: 0.8,
			showConfig: false,
			model: this.models[0].split(':').pop(),
			apikey: '',
			max_tokens: 256,
		}
		this.cacheMgr = new ProxyCache(`ai-chat-${this.botId}`, defaultCache);
		
		this.settingsCache = settingsCacheMgr.proxy;

		this.cache = this.cacheMgr.proxy;
		if (Object.keys(this?.$route?.query ?? {}).contains('gpt4')) this.cache.model = this.models[1].split(':').pop();

		if (this.cache.selectedPlugins == undefined) this.cache.selectedPlugins = [];
		this.selectedPlugins = this.cacheMgr._cache.get('selectedPlugins');
		if (this.selectedPlugins?.length > 0 && libx.isString(this.cache.selectedPlugins)) this.cache.selectedPlugins = this.selectedPlugins = libx.parse(this.cache.selectedPlugins) ?? [];

		// if (this.cache.docsSelected == undefined) this.cache.docsSelected = [];
		// this.docsSelected = this.cacheMgr._cache.get('docsSelected');
		// if (this.docsSelected?.length > 0 && libx.isString(this.cache.docsSelected)) this.cache.docsSelected = this.docsSelected = libx.parse(this.cache.docsSelected) ?? [];

		if (this.docId != null) this.docsSelected = [this.docId];
	},
	created() {
		helpers.updateMeta({...this.$app.layout.headers, ...{
			appName: 'alt-gpt',
			viewName: 'Chat',
			pageTitle: 'feedox/chatgpt-plugins-playground',
			desc: 'ChatGPT Playground',
			// image: '/resources/imgs/main/main-link-preview-innovation.png',
		}});

	},
	async mounted() {
		this.messages = this.cacheMgr._cache.get('messages');
		if (this.messages?.length == null || this.messages?.length == 0) {
			// this.$refs.bot.reset();
			this.messages = <IConvMessage[]>[
				// { role: "assistant", content: "Hey, how can I help you today?", },
			];
		}

		AltGPT.getPlugins().then(data=>{
			this.plugins = data;
			this.$forceUpdate();
		});
	},
	methods: {
		configurePlugin(plugin) {
			const _this = this;
			this.modal = this.$buefy.modal.open({
				parent: this,
				component: helpers.lazyLoader('/views/partials/plugin-config.vue.js'),
				hasModalCard: true,
				customClass: 'custom-class custom-class-2',
				trapFocus: true,
				props: {
					obj: plugin,
					settings: this.settingsCache,
				},
				events: {
					close() {
						_this.$forceUpdate();
					},
					submit(value) {
						console.log('--- chat: plugin configure modal submitted')
					},
				},
			});
			console.log('modal: ', this.modal);
		},
		makeHtml(input) {
			return conv.makeHtml(input);
		},
		async replay(msg, i) {
			console.log('replay: ', msg, i);
			this.messages.splice(i+1);
			this.cache.messages = this.messages;
			this.$forceUpdate();

			const last = this.messages.last();
			if (last.role == 'assistant') {
				libx.log.w('replay: the last message was from the assistant, not sending...');
				return;
			} else {
				libx.log.i('replay: the last message was from user, resending');
				await this.submit({ isReplay: true});
			}
		},
		resize(refToTextarea) {
			const elm = this.$refs[refToTextarea];
			elm.style.height = elm.scrollHeight - 4 + 'px';
		},
	},
	watch: {
		messages(val) {
			this.cacheMgr._cache.set('messages', val);
		},
		selectedPlugins(val) {
			this.cache.selectedPlugins = val;
		},
		// settingsCache: {
		// 	handler(val) {
		// 		console.log('-- settings changed', val);
		// 	},
		// 	deep: true,
		// },

		// docsSelected(val) {
		// 	console.log('docsSelected changed' )
		// 	this.cache.docsSelected = val;
		// }
	},
	computed: {
		onlySelectedPlugins() {
			return this.plugins.filter(x=>this.selectedPlugins.contains(x.id));
		},
		config() {
			return {
				frequency_penalty: parseFloat(this.cache.frequency_penalty),
				presence_penalty: parseFloat(this.cache.presence_penalty),
				temperature: parseFloat(this.cache.temperature),
				model: this.cache.model,
				user: this.userId,
				priming: this.cache.priming,
				defaultInput: this.cache.defaultInput, 
				apikey: this.cache.apikey, 
				max_tokens: this.cache.max_tokens, 
			}
		},
		renderHtml: app.helpers.bindQueryParam('renderHtml', 'false', true),
	},
	components: {
		'chat-window': helpers.lazyLoader('/components/chat-window.vue.js'),
	}
};
</script>

<style lang="less" scoped>
@import (reference) '../styles/essentials.less';
@import (reference) '../styles/style.less';

.view { --variable: 4px; }
.content { /* border-radius: var(--variable); border:1px solid @gray; */ }

.box-info { border-left:5px solid #333; padding:10px 20px; margin-bottom:10px; }
.box-info-desc { line-break: anywhere; padding-right: 30px; }

button.liked { color:red; }

.input-priming { resize: vertical; }

.doc { margin: 0px 0.35em 0.25em -1.6em; vertical-align: middle; }

.output-html {
	p { margin-top:0; margin-bottom:0; }
	img { min-width:40px; min-height:40px; border: 1px solid #999; background-color:#555 ; }
}

.box-chat-playground { max-width:1200px; margin:auto; }
.box-main { margin:0 5px; }
.box-chat-column {
	fieldset {
		@media screen and (min-width: 600px){ /* xs */
			height:660px;
			max-width:710px;
			overflow-y: scroll;
		}
	}
}
.box-plugins {
	fieldset {
		overflow-y: scroll;
	}
}

@pluginImgSize: 40px;
.box-plugins-item {
	border: 1px solid @dark; padding:10px; margin-bottom:20px;
	.box-plugins-item-name { .bold; }
	.box-plugins-item-desc { font-size:14px; margin-top:5px; }
	.box-plugins-item-icon { width:@pluginImgSize; height:@pluginImgSize; min-width:@pluginImgSize; max-width:@pluginImgSize; margin-right:10px; h-eight:60px; }
	.box-plugins-item-configure { min-height: 22px; } 
}

</style>
