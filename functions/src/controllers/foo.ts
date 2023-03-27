import * as express from 'express';

const router = express.Router();

const foo = (req, res) => {
	res.send('Hello from the foo...');
};

router.get('', foo)

export default router;