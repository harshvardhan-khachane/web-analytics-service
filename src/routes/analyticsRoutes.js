import express from 'express';
import { 
  eventCountValidation, 
  eventTypeCountValidation,
  validateAnalytics 
} from '../middleware/analyticsValidation.js';
import { getEventCounts } from '../controllers/analyticsController.js';
import { getEventCountsByType } from '../controllers/analyticsController.js';

const router = express.Router();

router.get(
  '/event-counts',
  eventCountValidation,
  validateAnalytics,
  getEventCounts
);

router.get(
  '/event-counts-by-type',
  eventTypeCountValidation,
  validateAnalytics,
  getEventCountsByType
);

export default router;