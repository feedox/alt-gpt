import express from 'express';
import request from 'request';

const router = express.Router();

router.use('/:targetUrl(*)', (req, res, next) => {
	let targetUrl = req.params.targetUrl + req.url.substring(1); //req.header('Target-URL');
	if (targetUrl == null || targetUrl == '') targetUrl = req.body?.url;

	// Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
	res.header("Access-Control-Allow-Headers", req.header('access-control-request-headers'));

	const url = targetUrl;
	const body = req.method == 'POST' ? req.body : null;
	const method = body?.method?.toUpperCase() ?? req.method;

	console.log('fetcher: ', { url, method, body });

	if (req.method === 'OPTIONS') {
		// CORS Preflight
		res.send();
	} else {
		if (!targetUrl) {
			res.status(400).json({ error: 'There is no Target-Endpoint header in the request' });
			return;
		}
		request({ url, method, json: body, headers: { 'Authorization': req.header('Authorization') } },
			function (error, response, body) {
				if (error) {
					const msg = error.message ?? error;
					console.error('error: ' + msg);
					res.status(response?.statusCode ?? 500).send(msg)
				}
				//                console.log(body);
			}).pipe(res);
	}
});

export default router;
