import express from 'express';
import { eventValidationRules, validate } from '../middleware/eventValidation.js';
import { createEvent } from '../controllers/eventController.js';

const router = express.Router();

router.post(
  '/',
  eventValidationRules(),
  validate,
  createEvent
);

export default router;