import { libx } from '/frame/scripts/ts/browserified/frame.js';
import { EventsStream } from '/scripts/ts/browserified/libs.js';
import { api } from "../app/app.api.js";
import { OpenAI } from './openAI.js';
import { IConvMessage } from '../types/IConvMessage.js';

interface IOperation<T = any> {
	url: string;
	method: string;
	body: T;
}
interface IIntent {
	action: string;
	thought: string;
}
interface IPluginsSettingsMap {
	[key: string]: IPluginsSettings;
}
interface IPluginsSettings {
	authType: 'none' | 'bearer' | 'query';
	corsProtected: Boolean;
	authBearerToken: string;
	authQueryName: string;
	authQueryValue: string;
}

export class AltGPT {
	public apiUrl = api.getApiPrefix();
	public apiUrlDev = 'http://0.0.0.0:8080';
	public events = new EventsStream.EventsStream();
	private defaultFetchOptions = {
		method: "GET",
		body: null,
		isJson: true
	};
	private openAI = new OpenAI();
	private basicConfig = {
		frequency_penalty: 0,
		presence_penalty: 0,
		temperature: 0,
		user: app.userManager?.data?.public?.id,
		model: 'gpt-3.5-turbo-0301',
		// defaultInput: this.cache.defaultInput, 
		apikey: this.apikey,
		max_tokens: 256,
		// ...this.config,
	};

	public constructor(private apikey: string, public options?: Partial<ModuleOptions>) {
		libx.log.v('AltGPT:ctor: ');
		this.options = { ...new ModuleOptions(), ...options };

		if (!!localStorage.isLocal) {
			libx.log.i('AltGPT: Detected isLocal, setting remote API to local env', this.apiUrlDev);
			this.apiUrl = this.apiUrlDev;
		} else {
			this.apiUrl += '/altgpt-plugins';
		}
	}

	public changeApikey(val) {
		this.apikey = val;
		this.basicConfig.apikey = val;
	}

	public async getIntents(messages: IConvMessage[], selectedPlugins: any[]) {
		const userQuery = messages[messages.length - 1].content;

		const actions = this.getAvailableActions(selectedPlugins);
		const _messages = [...messages].map(x => {
			const ret = { ...x };
			delete ret.events;
			return ret;
		});
		_messages.pop();
		_messages.push({
			content: `
			User query: "${userQuery}"
			Your objective: As an assistant bot is to help the machine comprehend human intentions based on user input and available tools. Your goal is to identify the best action to directly address the user's inquiry. In your subsequent steps, you will utilize the chosen action. You may select multiple actions and list them in a meaningful order. Prioritize actions that directly relate to the user's query over general ones. Ensure that the generated thought is highly specific and explicit to best match the user's expectations. Construct the result in a manner that an online open-API would most likely expect. You can repeat and chain actions, even if they are the same, one after the another.

			Output exactly with this format, avoid any other text as this will be parsed by a machine: 
			<action name, single word>: <your thought as a bot about how to use this action in your next steps (use verbs as: search, query, calculate, store, etc.), concisely up to 10 words, use only data extraction without any calculations>.

			Available Actions: 
			N/A: no suitable action, just perform simple GPT completion.
			 - ${actions.join('\n - ')}.

			`,
			role: 'user',
		});
		const priming = `You are an assistant bot designed to deduce the intent of a given text. Treat the provided objective as your goal and adhere to the instructions.`;
		const config = this.basicConfig;
		const completion = await this.openAI.createChatCompletion(_messages, config, priming);

		const res = <IIntent[]>[];
		const lines = completion.split(/\n+/);
		lines.map(line => {
			const parts = line.split(/^(.*?):\s*(.*)$/);
			const action = parts[1];
			const thought = parts[2];
			if (action == null || thought == null) return;
			res.push({
				action,
				thought
			});
		})

		return res;
	}

	public async getOperation<T>(messages: IConvMessage[], thought: string, pluginDescriptor: string, apiDescriptor: string, priming?: string, pluginSettings?: IPluginsSettings): Promise<IOperation<T>> {
		const userQuery = messages[messages.length - 1].content;

		let pSettings = '';
		if (pluginSettings != null) {
			pSettings = `authType: ${pluginSettings.authType}`;
			if (pluginSettings.authType == 'query') pSettings += `. add to query: ${pluginSettings.authQueryName}=${pluginSettings.authQueryValue}`;
			if (pluginSettings.authType == 'bearer') pSettings += `. bearer token auth header: ${pluginSettings.authBearerToken}`;
		}

		const _messages = [...messages].map(x => {
			const ret = { ...x };
			delete ret.events;
			return ret;
		});
		_messages.pop();
		_messages.push({
			content: `
			User query: \n"${userQuery}".
			Plugin description: \n"${pluginDescriptor}".
			Plugin settings: \n"${pSettings}",
			Usage thought: \n"${thought}".
			OpenAPI definition: \n"${apiDescriptor}".
			Your objective: As an assistant bot, your purpose is to help the machine comprehend human intentions based on user input and the available open-API definition file. Respond only with the URL, method, and parameters that best align with the user's query. Ensure that any placeholders are replaced with relevant data according to the given query, thought, and context. The outputted thought should be highly specific and explicit to best match the user's expectations. If there is only one endpoint available, select it. Make sure to incorporate the plugin settings into the output.
			
			Output exactly with this format, avoid any other text as this will be parsed by a machine: 
			URL: <url + parameters, respecting plugin settings>
			METHOD: <method (GET/POST/etc)>
			BODY: <body in case of POST>
			[END]`,
			role: 'user',
		});
		const _priming = `You are an assistant bot designed to extract and generate suitable actions based on the given text. Treat the provided objective as your goal and adhere to the instructions. To assist you in connecting to the internet, we have included excerpts from the web, which you can utilize to respond to user inquiries. ${priming}`;
		const config = this.basicConfig;
		const res = await this.openAI.createChatCompletion(_messages, config, _priming);

		const lines = res.split(/\n+/);
		const url = lines[0].split(/\s*URL\s*:\s*/)?.[1];
		const method = lines[1]?.split(/\s*METHOD\s*:\s*/)?.[1];
		const body = lines[2]?.split(/\s*BODY\s*:\s*/)?.[1];

		return {
			url, method, body
		};
	}

	public async getAnswer<T>(messages: IConvMessage[], context: string, intents: IIntent[], config: any, onDelta: (data) => void, priming?: string,) {
		const userQuery = messages[messages.length - 1].content;
		const _messages = [...messages].map(x => {
			const ret = { ...x };
			delete ret.events;
			return ret;
		});
		_messages.pop();
		_messages.push({
			content: `
			User query: \n"${userQuery}".
			Thoughts: \n"${intents.map(x => x.thought).join('.')}."
			Context from the web: \n"${context}".
			`,
			role: 'user',
		});
		const _priming = `You are a bot designed to assist machines in answering user inquiries based solely on the given context. If relevant to user's inquiry, extract full links from the context and maintain them unchanged. If there are multiple outcomes, present them as bullet points, each accompanied by the pertinent link. If the supplied context is empty or yields no results, state that the search produced no findings and recommend refining the query. If the answer is not included, respond with 'Hmm, I'm not sure...'. ${priming}`;
		const _config = { ...this.basicConfig, ...config };
		const res = await this.openAI.createChatCompletionStream(_messages, _config, _priming, onDelta);

		return res;
	}

	public getAvailableActions(selectedPlugins: any[]) {
		return selectedPlugins.map(p => `${p.manifest.name_for_model}: "${p.manifest.description_for_model}"`);
	}

	public getPluginByName(name: string, selectedPlugins: any[]) {
		const ret = selectedPlugins.filter(p => p.manifest.name_for_model == name)?.[0];
		if (localStorage.isLocal != null && ret != null) {
			if (ret.devUrlReplace && ret.devUrlReplaceWith) {
				ret.url = ret.url.replace(ret.devUrlReplace, ret.devUrlReplaceWith);
				ret.icon = ret.icon?.replace(ret.devUrlReplace, ret.devUrlReplaceWith);
				if (ret.manifest?.api?.url) ret.manifest.api.url = ret.manifest.api.url.replace(ret.devUrlReplace, ret.devUrlReplaceWith);
				if (ret.manifest?.logo_url) ret.manifest.logo_url = ret.manifest.logo_url.replace(ret.devUrlReplace, ret.devUrlReplaceWith);
			}
		}
		return ret;
	}

	public async getApiDescription(apiDescriptionUrl: string, viaProxy = false) {
		return await this.fetchSmart(apiDescriptionUrl, viaProxy, { isJson: false });
	}

	public async executeOperation<T>(operation: IOperation<T>, viaProxy = false) {
		return await this.fetchSmart(operation.url, viaProxy, {
			body: operation.body,
			method: operation.method,
			isJson: false,
		});
	}

	public async performSmartCompletion(messages: IConvMessage[], selectedPlugins: any[], config: any, onDelta: (data) => void, priming?: string, pluginsSettings?: IPluginsSettingsMap) {

		// step 1 - find intent: 
		this.events.emit({ step: 'intent', status: 'start', availablePlugins: selectedPlugins?.map(x => x.name).join(', ') }, 'smart-completion');
		const intents = await this.getIntents(messages, selectedPlugins)
		libx.log.v('smartCompletion: intents: ', intents);
		this.events.emit({ step: 'intent', status: 'success', result: intents }, 'smart-completion');

		let context = null;

		for (let intent of intents) {
			if (intent.action != 'N/A') {
				// step 1.2 - find operation:
				this.events.emit({ step: 'get-plugin', status: 'start', thought: intent.thought }, 'smart-completion');
				const plugin = this.getPluginByName(intent.action, selectedPlugins);
				if (plugin == null) {
					libx.log.w('smartCompletion: Could not find plugin by name', intent);
					continue;
				}
				const corsProtected = pluginsSettings[intent.action]?.corsProtected ?? plugin.corsProtected;
				const apiDescriptorUrl = plugin.manifest?.api?.url;
				const apiDescriptor = await this.getApiDescription(apiDescriptorUrl, corsProtected);
				this.events.emit({ step: 'get-plugin', status: 'success', result: { name: plugin.name, url: apiDescriptorUrl }, }, 'smart-completion');

				this.events.emit({ step: 'operation', status: 'start' }, 'smart-completion');
				const operation = await this.getOperation(messages, intent.thought, plugin.manifest.description_for_model, apiDescriptor, priming, pluginsSettings[intent.action]);
				libx.log.v('smartCompletion: operation: ', operation);
				this.events.emit({ step: 'operation', status: 'success', result: operation }, 'smart-completion');

				// step 2 - execute intent to get context: 
				if (context == null) context = '';
				if (localStorage.isLocal != null) {
					if (plugin.devUrlReplace && plugin.devUrlReplaceWith) {
						operation.url = operation.url.replace(plugin.devUrlReplace, plugin.devUrlReplaceWith);
					}
				}

				this.events.emit({ step: 'execute', status: 'start' }, 'smart-completion');
				context = await this.executeOperation(operation, corsProtected) + '\n';
				if (context.length > this.options.maxLength) {
					libx.log.w('smartCompletion: context is too big, removing from the end...', { context: context.length, max: this.options.maxLength });
					context = context.substring(0, this.options.maxLength);
				}
				libx.log.v('smartCompletion: context: ', context);
				this.events.emit({ step: 'execute', status: 'success', result: context.substring(0, 200) }, 'smart-completion');
			}
		}

		// step 3 - perform completion with user's original query and dynamic context: 
		this.events.emit({ step: 'answer', status: 'start' }, 'smart-completion');
		const answer = await this.getAnswer(messages, context, intents, config, onDelta, priming);
		libx.log.v('smartCompletion: answer: ', answer);
		this.events.emit({ step: 'answer', status: 'success', result: answer.substring(0, 20) }, 'smart-completion');

		return answer
	}

	public async fetch(url: string, options?: Partial<typeof this.defaultFetchOptions>) {
		const _options = { ...this.defaultFetchOptions, ...options };
		const res = await libx.di.modules.network.request(_options.method, url, null, _options.body);
		const str = libx.Buffer(res)?.toString();
		if (_options?.isJson) {
			try {
				return JSON.parse(str);
			} catch (err) {
				libx.log.w('fetch: error while parsing fetched response', err);
			}
		}
		return str;
	}

	public async fetchSmart(url: string, viaProxy = false, options?: Partial<typeof this.defaultFetchOptions>) {
		const _url = viaProxy ? this.apiUrl + '/fetcher/' + url : url;
		return await this.fetch(_url, options);
	}

	public async callAgent(pluginUrl: string, prompt: string, apikey: string, config?: {}) {
		try {
			return await libx.di.modules.network.httpPostJson(this.apiUrl, {
				plugin: pluginUrl,
				prompt,
				apikey,
				config,
			});
		} catch (e) {
			libx.log.w('AltGPT: callAgent: ', e.response);
			try {
				e = JSON.parse(e.response);
				try {
					const w = JSON.parse(e.error?.config?.data);
					return w.messages;
				} catch {
					throw e?.error ?? e;
				}
			} catch {
				throw e;
			}
		}
	}

	public static async getPlugins() {
		return await libx.browser.require(`/resources/chat/plugins.json`);
	}
}

export class ModuleOptions {
	maxLength = 3500;
}
