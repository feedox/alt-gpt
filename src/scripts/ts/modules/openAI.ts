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

  public async createChatCompletionStream({
    url,
    headers,
    payload,
    p,
    getNewData,
    onDelta,
    onProgress,
  }) {
    const eventSource = new SSE(url, {
      method: "POST",
      headers: headers,
      payload: JSON.stringify({
        ...payload,
        stream: true,
      }),
    }) as SSE;

    let contents = "";

    eventSource.addEventListener("error", (event: any) => {
      if (!contents) {
        let errorMessage;
        try {
          errorMessage = JSON.parse(event.data);
        } catch (e) {
          errorMessage = event.data;
        }

        libx.log.e("error: ", event, contents);
        p.reject(errorMessage);
      }
    });

    eventSource.addEventListener("message", async (event: any) => {
      console.log("🚀 ~ file: openAI.ts:140 ~ OpenAI ~ eventSource.addEventListener ~ event:", event);
      if (event?.data === "[DONE]") {
        // Handle this special case, maybe close the event source or do some other logic
        libx.log.d("message: done: ", event, contents);
        p.resolve(contents);
        return;
      }

      if (!event.data || event.data.trim() === "") {
        console.log("Received empty or invalid data.");
        return; // Skip processing for empty data
      }

      try {
        const newData = getNewData(event.data);
        if (newData) {
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

  public async createChatCompletionHTTP({
    url,
    headers,
    payload,
    getNewData,
    onDelta,
  }) {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    let httpResponse = await response.json();
    let res = getNewData(httpResponse);
    return onDelta(res);
  }

  public async createChatCompletionRes(
    messages: IConvMessage[],
    config,
    priming?: string,
    onDelta?: (data) => void,
    onProgress?: (wholeData) => void
  ) {
    const p = libx.newPromise();

    //// payloads
    const setupPayloadForGPT = (model) => {
      return {
        messages: [
          {
            role: "system",
            content: priming ?? `You are an assistant bot.`,
          },
          ...messages,
        ],
        // messages: [
        //   messages.length > 0
        //     ? { role: "user", content: messages[messages.length - 1].content }
        //     : "",
        // ],
        ...{
          frequency_penalty: 0,
          presence_penalty: 0,
          temperature: 0.8,
          max_tokens: 256,
          model,
          ...config,
          stream: true,
          top_p: 1.0,
          n: 1,
        },
      };
    };

    const setupPayloadForDavinci = (model) => {
      const userMessages = messages.filter((m) => m.role === "user");
      const prompt =
        userMessages.length > 0
          ? userMessages[userMessages.length - 1].content
          : "";
      return {
        prompt,
        frequency_penalty: 0,
        presence_penalty: 0,
        temperature: 0.8,
        max_tokens: 256,
        model,
        top_p: 1.0,
        n: 1,
        ...config,
      };
    };

    const setupPayloadForCohere = (model) => {
      return {
        prompt:
          messages.length > 0 ? messages[messages.length - 1].content : "",
        model,
        max_tokens: 256,
        // stream: true,
        ...config,
      };
    };

    const setupPayloadForAnthropic = (model) => {
      const systemPrompt = `\n\nHuman: ${messages.length > 0 ? messages[messages.length - 1].content : ""
        }\n\nAssistant:`;
      const newConfig = {
        provider: "anthropic",
        model: model,
        maxTokens: 300,
        stream: true,
        frequencyPenalty: config.frequencyPenalty || 0,
        presencePenalty: config.presencePenalty || 0,
        temperature: config.temperature || 0.8,
      };

      return {
        systemPrompt,
        config: newConfig,
        stream: true,

      };
    };
    const setupPayloadForAI21 = (model) => {
      return {
        prompt:
          messages.length > 0 ? messages[messages.length - 1].content : "",
        model_type: model,
        maxTokens: 256,
        ...config,
      };
    };

    //// handle responses
    const handleGPTResponse = (data) => {
      try {
        const chunk = JSON.parse(data);
        if (chunk.choices && chunk.choices.length > 0) {
          return chunk.choices[0]?.delta?.content || "";
        }
      } catch (err) {
        console.error("Error parsing GPT response", err);
      }
      return "";
    };

    const handleDavinciResponse = (data) => {
      return data.choices[0].text.trim();
    };

    const handleCohereResponse = (chunk) => {
      if (chunk.generations && chunk.generations.length > 0) {
        return chunk.generations[0].text;
      }
      throw new Error("No completion found in Cohere response.");
    };

    const handleAnthropicResponse = (data) => {
      try {
        const chunk = JSON.parse(data);
        return chunk.completion || "";
      } catch (err) {
        console.error("Error parsing Anthropics response", err);
        return "";
      }
    };

    const handleAI21Response = (httpResponse) => {
      return httpResponse?.completions[0]?.data?.text;
    };

    let url: string;
    let payload: any;
    let getNewData: (data: string) => string;
    let headers = {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    };

    switch (config.model) {
      case "gpt-3.5-turbo-0301":
      case "gpt-4-0314":
        url = `https://api.openai.com/v1/chat/completions`;
        payload = setupPayloadForGPT(config.model);
        getNewData = (data) => handleGPTResponse(data);
        headers["Authorization"] = `Bearer ${config.apikey}`;
        break;
      case "text-davinci-002":
        url = "https://api.openai.com/v1/completions";
        payload = setupPayloadForDavinci(config.model);
        getNewData = (data) => handleDavinciResponse(data);
        headers["Authorization"] = `Bearer ${config.apikey}`;
        break;
      case "command-xlarge-nightly":
      case "xlarge":
        url = `https://api.cohere.ai/v1/generate`;
        payload = setupPayloadForCohere(config.model);
        getNewData = (data) => handleCohereResponse(data);
        headers["Authorization"] = `Bearer ${config.apikey}`;
        break;
      case "claude-instant-v1.0":
        // url = `https://api.anthropic.com/v1/complete`;
        // url = `http://localhost:3001/api`;
        url = `https://ws-edge-v2.feedox.workers.dev/completion/650fb33a815c45d4191a1e094628ec7d/`
        payload = setupPayloadForAnthropic(config.model);
        getNewData = (data) => handleAnthropicResponse(data);
        headers["x-api-key"] = config.apikey;
        headers["anthropic-version"] = "2023-06-01";
        break;
      case "j2-grande-instruct":
        url = `https://api.ai21.com/studio/v1/j2-${config.model_type || "mid"
          }/complete`;
        payload = setupPayloadForAI21(config.model);
        getNewData = (data) => handleAI21Response(data);
        headers["Authorization"] = `Bearer ${config.apikey}`;
        break;
      // Add more cases for other models in the future as needed
      default:
        throw new Error("Unsupported model type.");
    }

    delete payload.apikey;

    console.log("Config:", config);
    console.log("Messages:", messages);

    if (payload.stream) {
      return this.createChatCompletionStream({
        url,
        headers,
        payload,
        p,
        getNewData,
        onDelta,
        onProgress,
      });
    } else {
      return this.createChatCompletionHTTP({
        url,
        headers,
        payload,
        getNewData,
        onDelta,
      });
    }
  }

  private parseChunk(buffer: any): OpenAIResponseChunk {
    const chunk = buffer.toString().split(/\s*data\:\s*/);
    // for (let content of chunk) {
    // 	content = content.trim();
    // }
    // const chunk = buffer.toString().replace('data: ', '').trim();

    if (libx.isEmptyString(chunk) || chunk === "[DONE]") {
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
