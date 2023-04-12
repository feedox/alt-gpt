import { getExpress } from './helpers/getExpress.js';
import foo from './controllers/foo.js';
import plugins from './controllers/use-plugins.js';
import fetcher from './controllers/fetcher.js';

const { app, router } = getExpress();

app.use('/plugins', plugins);
app.use('/fetcher', fetcher);
app.use('/foo', foo); // just for testing
app.use('/*', plugins);

export const api = app;

if (['serve'].indexOf(process.env.npm_lifecycle_event) != -1) { // only lunch manual local server if using 'serve' command
	const port = 8080;
	try {
		app.listen(port, () => {
			console.log(`Server listening on 0.0.0.0:${port}`);
		});
	} catch (err) {
		console.warn(`LOCAL: Failed to start local server on port: ${port}`)
	}
}