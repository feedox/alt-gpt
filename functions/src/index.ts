import { getExpress } from './helpers/getExpress.js';
import foo from './controllers/foo.js';
import plugins from './controllers/use-plugins.js';

const { app, router } = getExpress();

app.use('/*', plugins);
app.use('/foo', foo); // just for testing

export const api = app;

app.listen(8080, () => {
	console.log('Server listening on 0.0.0.0:8080');
});