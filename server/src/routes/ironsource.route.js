import express from 'express';
import asyncHandler from 'express-async-handler';

import ironSourceController from '../controllers/ironsource.controller.js';
import validate from '../middlewares/validate.js';
import { ironSourceFetchSchema, ironSourceUpdateSchema } from '../validations/ironsource.validation.js';

const router = express.Router();

router.get('/', validate(ironSourceFetchSchema), asyncHandler(ironSourceController.list));

router.post('/', validate(ironSourceUpdateSchema), asyncHandler(ironSourceController.update));

export default router;
