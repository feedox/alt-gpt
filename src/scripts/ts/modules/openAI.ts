import { AxiosResponse } from 'axios';
import { SSE } from '/scripts/ts/browserified/index.js';
import { libx } from '/frame/scripts/ts/browserified/frame.js';
import { openai } from '/scripts/ts/browserified/libs.js';
import { IConvMessage } from '../types/IConvMessage.js';
import { OpenAIResponseChunk } from '../types/OpenAIResponseChunk.js';

export class OpenAI {
	public openaiLib: typeof openai;
	public openaiApi;

	public constructor(public options?: Partial<ModuleOptions>) {
		this.options = { ...new ModuleOptions(), ...options };
		this.openaiLib = openai;

		const configuration = new openai.Configuration({
			apiKey: '',
		});
		this.openaiApi = new openai.OpenAIApi(configuration);
	}

	public async makeCompletion(prompt: string): Promise<AxiosResponse<openai.CreateCompletionResponse, any>> {
		const response = await this.openaiApi.createCompletion({
			model: 'text-davinci-003', // 'text-davinci-003',
			prompt: prompt,
			temperature: 0.1,
			max_tokens: 512,
			top_p: 1.0,
			frequency_penalty: 0.0,
			presence_penalty: 0.0,
			// stop: [''],
		});
		return response;
	}

	public async createChatCompletion(messages: IConvMessage[], config, priming?: string) {
		const p = libx.newPromise();
		const url = `https://api.openai.com/v1/chat/completions`;
		const apiKey = config.apikey;
		const payload = {
			"messages": [
				{
					role: 'system',
					content: priming ?? `You are an assistant bot.`,
				},
				...messages
			],
			...{
				// defaults:
				frequency_penalty: 0,
				presence_penalty: 0,
				temperature: 0.8,
				max_tokens: 256, // 512,
				model: "gpt-3.5-turbo",
				...config, // override
				stream: false,
				// user: 'userId',
				top_p: 1.0,
				n: 1,
			}
		};
		delete payload.apikey;

		const res: any = await fetch(url, {
			method: "POST",
			headers: {
				'Accept': 'application/json, text/plain, */*',
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				...payload,
				"stream": false,
			}),
		});

		const json = await res.json();

		if (json.choices && json.choices.length > 0) {
			return json.choices[0]?.message?.content || '';
		}

		return json ?? res;
	}

	public async createChatCompletionStream(messages: IConvMessage[], config, priming?: string, onDelta?: (data) => void, onProgress?: (wholeData) => void) {
		const p = libx.newPromise();
		const url = `https://api.openai.com/v1/chat/completions`;
		const apiKey = config.apikey;
		const payload = {
			"messages": [
				{
					role: 'system',
					content: priming ?? `You are an assistant bot.`,
				},
				...messages
			],
			...{
				// defaults:
				frequency_penalty: 0,
				presence_penalty: 0,
				temperature: 0.8,
				max_tokens: 256, // 512,
				model: "gpt-3.5-turbo",
				...config, // override
				stream: true,
				// user: 'userId',
				top_p: 1.0,
				n: 1,
			}
		};
		delete payload.apikey;

		const eventSource = new SSE(url, {
			method: "POST",
			headers: {
				'Accept': 'application/json, text/plain, */*',
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			payload: JSON.stringify({
				...payload,
				"stream": true,
			}),
		}) as SSE;

		let contents = '';

		eventSource.addEventListener('error', (event: any) => {
			if (!contents) {
				libx.log.e('error: ', event, contents)
				p.reject(JSON.parse(event.data));
			}
		});

		eventSource.addEventListener('message', async (event: any) => {
			if (event.data === '[DONE]') {
				libx.log.d('message: done: ', event, contents)
				p.resolve(contents);
				return;
			}

			try {
				const chunk = this.parseChunk(event.data);
				if (chunk.choices && chunk.choices.length > 0) {
					const newData = chunk.choices[0]?.delta?.content || '';
					contents += newData;
					if (onDelta) onDelta(newData);
					if (onProgress) onProgress(contents);
				}
			} catch (err) {
				console.error(err);
				p.reject(err);
			}
		});

		eventSource.stream();
		return p;
	}

	private parseChunk(buffer: any): OpenAIResponseChunk {
		const chunk = buffer.toString().split(/\s*data\:\s*/);
		// for (let content of chunk) {
		// 	content = content.trim();
		// }
		// const chunk = buffer.toString().replace('data: ', '').trim();

		if (libx.isEmptyString(chunk) || chunk === '[DONE]') {
			return {
				done: true,
			};
		}

		const parsed = JSON.parse(chunk);

		return {
			id: parsed.id,
			done: false,
			choices: parsed.choices,
			model: parsed.model,
		};
	}
}

export class ModuleOptions { }
