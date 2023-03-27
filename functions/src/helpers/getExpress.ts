import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';

export function getExpress() {
	const app = express();

	app.set('json spaces', 4);

	var rawBodySaver = function (req, res, buf, encoding) {
		if (buf && buf.length) {
			req.rawBody = buf.toString(encoding || 'utf8');
		}
	};

	app.use(bodyParser.json({ verify: rawBodySaver }));
	app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
	app.use(bodyParser.raw({ verify: rawBodySaver, type: '*/*' }));

	app.use(cors());

	const router = express.Router();

	return { app, router };
}
