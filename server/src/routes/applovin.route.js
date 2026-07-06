import express from 'express';
import asyncHandler from 'express-async-handler';

import applovinController from '../controllers/applovin.controller.js';
import validate from '../middlewares/validate.js';
import { applovinSchema, applovinUpdateSchema } from '../validations/applovin.validation.js';

const router = express.Router();

router.get('/', validate(applovinSchema), asyncHandler(applovinController.list));

router.post('/', validate(applovinUpdateSchema), asyncHandler(applovinController.update));

export default router;
