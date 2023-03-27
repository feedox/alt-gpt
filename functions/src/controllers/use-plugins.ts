import express from 'express';
import { usePlugin as langchain } from '../modules/langchain.js'

// Polyfill for node v16:
import fetch, {
	Blob,
	blobFrom,
	blobFromSync,
	File,
	fileFrom,
	fileFromSync,
	FormData,
	Headers,
	Request,
	Response,
} from 'node-fetch'
if (!globalThis.fetch) {
	(<any>globalThis).fetch = fetch;
	(<any>globalThis).Headers = Headers;
	(<any>globalThis).Request = Request;
	(<any>globalThis).Response = Response;
}

const router = express.Router();

router.post('', async (req: express.Request, res: express.Response) => {
	try {
		const body = req?.body ?? {};
		delete body.config?.apikey;
		console.log('starting... ', { plugin: body.plugin, prompt: body.prompt, config: body.config });
		const openaiApiKey = body.apikey

		const result = await langchain(
			body.plugin,
			body.prompt,
			openaiApiKey,
			body.config,
		)
		res.status(200).json({
			result,
		});

	} catch (e) {
		try {
			e = e.response.data.error;
		} catch { }
		console.log(e);
		res.status(400).json({ message: e?.message, error: e });
		return e;
	}
});

export default router;
