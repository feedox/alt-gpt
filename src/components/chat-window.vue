<template lang="pug">
div
	div.box-info(v-if="showInfo && bot != null", v-cloak)
		.layout-gt-xs-row.layout-align-space-between-end
			div
				h2 "{{ bot.name }}" Bot
				p.box-info-desc {{ bot.desc }}
			div 

	div.box-messages
		.box-messages-item(v-for="(msg, i) of messages")
			.box-messages-item-content(:class="msg.role == 'user' ? 'message-bot' : 'message-user'", v-if="msg")
				div(v-if="msg.events").small.padding-left20
					div(v-for="e of msg.events") 
						//- div.ultra-small (( {{ e.payload.step }}-{{ e.payload.status }} -- {{e.payload.result}} ))&nbsp; 
						span(v-if="e.payload.step=='intent' && e.payload.status=='start'") - Available actions: {{ e.payload?.availablePlugins }}
						span(v-if="e.payload.step=='intent' && e.payload.status=='success'") - Matching actions:
							div.padding-left10(v-if="e.payload.status=='success'", v-for="act of e.payload.result", :title="act.thought") - {{ act.action }} ({{ act.thought }})
						span(v-if="e.payload.step=='get-plugin' && e.payload.status=='success'") - Using plugin: "{{ e.payload.result?.name }}" - {{ e.payload.result?.thought }}
						span(v-if="e.payload.step=='operation' && e.payload.status=='success'", :title="e.payload.result?.url") - Executing: "{{ e.payload.result?.url }}
						span(v-if="e.payload.step=='answer' && e.payload.status=='success'", :title="e.payload.result") - Got context, running completion: "{{ e.payload.result }}"...
					br
				span(v-if="!renderHtml")
					editable(contenteditable="true",v-model="msg.content") 
				span(v-else)
					div.output-html(v-html="makeHtml(msg.content)")

			.box-messages-item-hover.layout-column
				.icon.btn-sqr.message-replay(label='replay from here', @click="replay(msg, i)", :disabled="isActive").pointer
					i.fas.fa-redo
				//- .icon.btn-sqr.message-speak(v-if="!isSpeaking", label='read out loud this message', @click="speak(msg.content)").pointer
					i.fas.fa-volume-up
				//- .icon.btn-sqr.message-speak(v-if="isSpeaking", label='stop read out loud', @click="stopSpeak()").pointer
					i.fas.fa-volume-mute

	form(@submit.prevent="submit", :disabled="isLoading").layout-row
		.field.margin-bottom0
			b-dropdown.is-pulled-right(v-if="showMore", aria-role='list', position='is-top-right').chat-control.pointer.fg-grayLighter.bg-dark.margin-right20
				template(#trigger='')
					b-icon(icon='ellipsis-v')
				b-dropdown-item(aria-role='listitem', @click="$emit('update:renderHtml', !renderHtml)") 
					span.margin-right10.fas(:class="{ 'fa-square': !renderHtml, 'fa-check-square': renderHtml }")
					span Render HTML
				b-dropdown-item(aria-role='listitem', @click="reset()") Reset
		.field.flex.padding-right20.margin-bottom0
			.control
				textarea.user-input(v-model='userMessage', type="text", ref="input", :rows="inputHeight", placeholder="Ask a question here").chat-control.x-font
		.field.form-group.margin-bottom0
			.control
				button.btn-submit(label='Save', type='submit', role='button', :disabled="isActive").bg-dark.fg-grayLighter.bigger.chat-control
					.icon
						i.fab.fa-telegram-plane

	.related-chunks(v-if="relatedChunks?.length > 0")
		h2 Related Sources:
		.chunk(v-for="chunk in relatedChunks") 
			h4 {{ chunk.title }}
			pre {{ chunk.text }}

	b-loading(:is-full-page='true', :active.sync='isLoading', :can-cancel='false')
</template>

<script lang="ts">
import { libx, ProxyCache } from '/frame/scripts/ts/browserified/frame.js';
import { showdown, hotkeys } from '/scripts/ts/browserified/libs.js';
import helpers from '/scripts/ts/app/app.helpers.js';
import { OpenAI } from '/scripts/ts/modules/openAI.js';
import { IConvMessage } from '../scripts/ts/types/IConvMessage';
import { AltGPT } from '/scripts/ts/modules/altGPT.js';

var conv = new showdown.Converter({tables: true, strikethrough: true, tasklists: true, emoji: true, openLinksInNewWindow: true });
let cacheMgr = <ProxyCache>null;

export default {
	async created() {

	},
	async mounted() {
		hotkeys.filter = (event:any) => (event.target || event.srcElement)?.tagName == 'TEXTAREA' ? true : false;
		hotkeys('ctrl+enter, command+enter, enter', (event, handler)=>{
			const isEnter = handler.key == 'enter';
			libx.log.v('ctrl-enter pressed, submitting...');
			if (isEnter && this.inputHeight > 1) return;
			this.submit({ isReplay: false });
			return false;
		});

		this.isLoading = false;

		cacheMgr = new ProxyCache(`ai-chat-${this.botId}`, {});
		this.messages = cacheMgr._cache.get('messages');
		if (this.messages?.length == null || this.messages?.length == 0) {
			this.reset();
		}

		this.altGpt = new AltGPT(this.config.apikey),
		this.altGpt.events.subscribe(e=>{
			if (e == null) return;
			console.log('altgpt-event: ', e);
			const lastMsg = this.messages[this.messages.length-1];
			if (lastMsg.events == null) lastMsg.events = [];
			lastMsg.events.push(e);
			this.$forceUpdate();
		});

		setTimeout(this.scrollChatToBottom, 3000);
	},
	async destroyed() {
		console.log('destroyed')
		hotkeys.unbind();
	},
	props: {
		botId: String,
		docsIds: Array,
		selectedPlugins: Array,
		config: {},
		pluginsSettings: {},
		showInfo: Boolean,
		showMore: {
			type: Boolean,
			default: true,
		},
		renderHtml: {
			type: Boolean,
			default: false,
		},
		autoSpeak: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			openAI: new OpenAI(),
			messages: [],
			userMessage: null,
			isLoading: true,
			bot: null,
			isSpeaking: false,
			relatedChunks: [],
			isActive: false,
			isNewModel: false,
			altGpt: <AltGPT>null,
		};
	},
	methods: {
		toggleProp(toggleName) {
			this.$emit('update:' + toggleName, !this[toggleName]);
		},
		reset() {
			cacheMgr._cache.delete('messages')
			this.messages = <IConvMessage[]>[
				// { role: "assistant", content: "Hey, how can I help you today?", },
			];

			this.userMessage = this.config?.defaultInput ?? this.bot?.defaultInput;

			if (this.selectedPlugins?.length > 0 && this.selectedPlugins[0].examplePrompt) {
				this.userMessage = this.selectedPlugins[0].examplePrompt;
			}
		},
		async submit({isReplay=false}) {
			if (this.isActive) return;
			const msg = this.userMessage;
			console.log('submit: ', msg);
			
			this.isLoading = true; this.$forceUpdate();
			
			// if (this.selectedPlugins?.length > 0) {
			// 	try{
			// 		console.log('chat:submit: Selected plugins: ', this.selectedPlugins);
			// 		const plugin = this.selectedPlugins[0];

			// 		const response = await this.altGpt.performSmartCompletion(this.userMessage, this.selectedPlugins);
			// 		// const response = await this.altGpt.callAgent(plugin.url, this.userMessage, this.config.apikey, this.config);
			// 		const newUserMsg = <IConvMessage>{ role: 'user', content: msg };
			// 		this.messages.push(newUserMsg);
			// 		this.messages.push(<IConvMessage>{ role: 'assistant', content: response });
			// 		this.userMessage = '';
			// 	} catch(err) {
			// 		let msg = err?.error?.message || err?.message;
			// 		if (err.statusText) msg = `${err?.statusText} (${err?.statusCode})`;

			// 		helpers.toast(`Failed to process request: ${msg || ''}`, 'is-danger', 'is-top');
			// 		this.isLoading = false; this.$forceUpdate();
			// 		console.error(err);
			// 	}
			// 	this.isLoading = false;

			// 	return;
			// }

			try{
				const config = { 
					frequency_penalty: this.bot?.frequency_penalty,
					presence_penalty: this.bot?.presence_penalty,
					temperature: this.bot?.temperature,
					user: app.userManager?.data?.public?.id,
					...this.config,
				};
				delete config.priming; // openai api doesn't like it there.
				delete config.defaultInput; // openai api doesn't like it there.
				if (this.bot?.model != null) {
					config.model = this.bot?.model;
				}else if (this.isNewModel) {
					config.model = 'gpt-4-0314';
				}

				const newUserMsg = <IConvMessage>{ role: 'user', content: msg };
				const messages = [...this.messages];
				if (!isReplay) messages.push(newUserMsg);

				if (!isReplay) {
					this.userMessage = '';
					this.messages.push(newUserMsg)
				}
				
				const newMsg = {role:'assistant', content: ''};
				this.messages.push(newMsg);
				this.scrollChatToBottom();

				const priming = this.config?.priming ?? this.bot?.priming;

				const onDelta = (delta)=> {
					this.isLoading = false;
					newMsg.content += delta;
					this.scrollChatToBottom(true);
				};

				if (this.selectedPlugins?.length > 0) {
					await this.altGpt.performSmartCompletion(messages, this.selectedPlugins, config, onDelta, priming, this.pluginsSettings);
				} else {
					await this.openAI.createChatCompletionStream(messages, config, priming, onDelta);
				}

				this.$forceUpdate();
				
				this.messages.push(this.messages.pop()); // so it'll be stored properly in cache
				// newText = newMsg.content;
			} catch(err) {
				let msg = err?.error?.message || err?.message;
				if (err.statusText) msg = `${err?.statusText} (${err?.statusCode})`;

				helpers.toast(`Failed to process request: ${msg || ''}`, 'is-danger', 'is-top');
				this.isLoading = false; this.$forceUpdate();
				console.error(err);
			}
		},
		scrollChatToBottom(gentle=false) {
			setTimeout(()=>{
				var myDiv = document.getElementsByClassName('box-messages')?.[0];
				if (myDiv == null) return;

				const isAtBottom = (myDiv.scrollHeight - myDiv.scrollTop) - myDiv.clientHeight <= 80;
				if (gentle && !isAtBottom) return;

				// if (myDiv.scrollTop - (myDiv.scrollHeight - myDiv.clientHeight) > -3) return;
				myDiv.scrollTop = myDiv.scrollHeight;
			},10);
		},
		makeHtml(input) {
			return conv.makeHtml(input);
		},
		async replay(msg, i) {
			console.log('replay: ', msg, i);
			this.messages.splice(i+1);
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
	},
	watch: {
		messages(val) {
			cacheMgr._cache.set('messages', val);
		},
		selectedPlugins(val) {
			// this.reset();
			if (this.selectedPlugins?.length > 0 && this.selectedPlugins[0].examplePrompt) {
				this.userMessage = this.selectedPlugins[0].examplePrompt;
			}
		},
		'config.apikey'(val) {
			console.log('- apikey changed!')
			this.altGpt.changeApikey(val);
		},
	},
	computed: {
		inputHeight() {
			const rows = (this.userMessage?.match(/\n/g)?.length || 0) + 1;
			return rows; // & 12;
		},
	},
	components: {}
};
</script>

<style lang="less" scoped>
@import (reference) '../styles/essentials.less';
@import (reference) '../styles/style.less';

@borderColor: #888;

.box-info { border-left:5px solid #333; padding:10px 20px; margin-bottom:10px; }
.box-info-desc { line-break: anywhere; padding-right: 30px; }

.box-messages { overflow-y: scroll; position: relative; border: 1px solid @borderColor; margin-bottom: 5px; padding: 1em; }
.box-messages-item { margin-bottom:20px; position:relative; }
.box-messages-item ul { margin:0; line-height: 12px; }
.box-messages-item p { margin:0; display: inline; }
.box-messages-item-content { background-color: #eee; padding:10px; white-space:break-spaces; }
.box-messages-item-hover { display:none; }
.box-messages-item:hover .box-messages-item-hover { display:inline-flex; }
.message-bot { margin-left: 60px; text-align:left; }
.message-user { margin-right: 60px; }
.message-bot:before { content: '> '; }
.message-user:before { content: '< '; }
.box-messages-item-hover { position:absolute; right:0px; top:5px; }
.chat-control { min-height:42px; max-height:42px*2; }
.user-input { border: 1px solid @borderColor !important; }

.chunk pre { white-space: break-spaces; }

.btn-sqr { font-size: 8px; width: 11px; height: 22px; padding: 10px; border: 1px solid #aaa; background-color: #eee; }
.btn-submit[disabled], .btn-sqr[disabled] { opacity: .5; cursor: not-allowed; }

.output-html {
	p { margin-top:0; margin-bottom:0; }
	img { min-width:40px; min-height:40px; border: 1px solid #999; background-color:#555 ; }
}

</style>
