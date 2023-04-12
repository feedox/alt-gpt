export interface IEvent<T = any> {
	type: string;
	payload: T;
}

export interface IConvMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
	name?: string;
	events?: IEvent[];
}