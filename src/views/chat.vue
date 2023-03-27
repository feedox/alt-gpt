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
				.box-main.box-chat-column(flex) 
					fieldset
						legend Chat

						chat-window(:botId="botId", ref="bot", :config="config", :renderHtml.sync="renderHtml", :docsIds="docsSelected")

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
										option(v-for='(v, k) in models' :value='v.split(":").pop()' :key='k') {{ v }}

							div
								.control.flex
									label.label OpenAI API Key:
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

var conv = new showdown.Converter({tables: true, strikethrough: true, tasklists: true, emoji: true, openLinksInNewWindow: true });

export default {
	data() {
		return {
			botId: this.$route.params.botId,
			docId: this.$route.query.docId,
			isLoading: false,
			cache: null,
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
			]
		};
	},
	created() {
		helpers.updateMeta({...this.$app.layout.headers, ...{
			appName: 'chatgpt-plugins-playground',
			viewName: 'Chat',
			pageTitle: 'feedox/chatgpt-plugins-playground',
			desc: 'ChatGPT Playground',
			// image: '/resources/imgs/main/main-link-preview-innovation.png',
		}});

		this.cacheMgr = new ProxyCache(`ai-chat-${this.botId}`, {});

		this.cache = this.cacheMgr.proxy;
		if (this.cache.botName == undefined) this.cache.botName = '';
		if (this.cache.userMessage == undefined) this.cache.userMessage = '';
		if (this.cache.frequency_penalty == undefined) this.cache.frequency_penalty = 0;
		if (this.cache.presence_penalty == undefined) this.cache.presence_penalty = 0;
		if (this.cache.temperature == undefined) this.cache.temperature = 0.8;
		if (this.cache.showConfig == undefined) this.cache.showConfig = false;
		if (this.cache.model == undefined) this.cache.model = this.models[0];
		if (this.cache.apikey == undefined) this.cache.apikey = '';
		if (Object.keys(this?.$route?.query ?? {}).contains('gpt4')) this.cache.model = this.models[1];

		if (this.cache.docsSelected == undefined) this.cache.docsSelected = [];
		this.docsSelected = this.cacheMgr._cache.get('docsSelected');
		if (this.docsSelected?.length > 0 && libx.isString(this.cache.docsSelected)) this.cache.docsSelected = this.docsSelected = libx.parse(this.cache.docsSelected) ?? [];

		if (this.docId != null) this.docsSelected = [this.docId];
	},
	mounted() {
		this.messages = this.cacheMgr._cache.get('messages');
		if (this.messages?.length == null || this.messages?.length == 0) {
			// this.$refs.bot.reset();
			this.messages = <IConvMessage[]>[
				// { role: "assistant", content: "Hey, how can I help you today?", },
			];
		}
	},
	methods: {
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
		// docsSelected(val) {
		// 	console.log('docsSelected changed' )
		// 	this.cache.docsSelected = val;
		// }
	},
	computed: {
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
			height: 660px;
			overflow-y: scroll;
		}
	}
}

</style>
