import { ChatOpenAI } from 'langchain/chat_models'
import { initializeAgentExecutor } from 'langchain/agents'
import { RequestsGetTool, RequestsPostTool, AIPluginTool } from 'langchain/tools'

export const usePlugin = async (pluginUrl: string, prompt: string, openaiApiKey: string, config?: any) => {
	const tools = [
		new RequestsGetTool(),
		new RequestsPostTool(),
		await AIPluginTool.fromPluginUrl(pluginUrl),
	];
	const agent = await initializeAgentExecutor(
		tools,
		new ChatOpenAI({ temperature: config.temperature ?? 0, openAIApiKey: openaiApiKey, modelName: config.model, frequencyPenalty: config.presence_penalty, maxTokens: config.max_tokens, presencePenalty: config.presence_penalty }),
		'chat-zero-shot-react-description',
		true,
	);

	let priming = config.priming;
	if (priming?.trim() != '') {
		priming += '. ';
	}

	const result = await agent.call({
		input: `${priming}${prompt}`,
	});

	return result;
}
