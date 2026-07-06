import express from 'express';
import applovinRoute from './applovin.route.js';
import ironsourceRoute from './ironsource.route.js';
import tradplusRoute from './tradplus.route.js';

const router = express.Router();

router.use('/applovin', applovinRoute);

router.use('/ironsource', ironsourceRoute);

router.use('/tradplus', tradplusRoute);

export default router;
