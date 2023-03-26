declare namespace LibxJS {
	interface IDeferred<T> extends Promise<any> {
		progress: any;
	}
}
