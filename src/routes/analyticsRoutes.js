import express from 'express';
import { 
  eventCountValidation, 
  validateAnalytics 
} from '../middleware/analyticsValidation.js';
import { getEventCounts } from '../controllers/analyticsController.js';

const router = express.Router();

router.get(
  '/event-counts',
  eventCountValidation,
  validateAnalytics,
  getEventCounts
);

export default router;