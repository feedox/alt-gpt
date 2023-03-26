export interface IConvMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
	name?: string;
}