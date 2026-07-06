import express from 'express';
import asyncHandler from 'express-async-handler';

import tradplusController from '../controllers/tradplus.controller.js';
import validate from '../middlewares/validate.js';
import { tradplusSchema, tradplusUpdateSchema } from '../validations/tradplus.validation.js';

const router = express.Router();

// GET route to list/preview the ad units
router.get('/', validate(tradplusSchema), asyncHandler(tradplusController.list));

// POST route to trigger the batch update
router.post('/', validate(tradplusUpdateSchema), asyncHandler(tradplusController.update));

export default router;
