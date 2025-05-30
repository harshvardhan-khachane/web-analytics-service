import { query, validationResult } from 'express-validator';

// Common date validations reusable across endpoints
const dateValidations = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid start_date format. Use ISO 8601 (YYYY-MM-DD)'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid end_date format. Use ISO 8601 (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (req.query.start_date && value < req.query.start_date) {
        throw new Error('end_date must be after start_date');
      }
      return true;
    })
];

// Validation for GET /analytics/event-counts
export const eventCountValidation = [
  query('event_type')
    .optional()
    .isIn(['view', 'click', 'location'])
    .withMessage('Invalid event type. Must be view, click, or location'),
  ...dateValidations
];

// Validation for GET /analytics/event-counts-by-type
export const eventTypeCountValidation = [
  ...dateValidations
];

// Reusable validation handler
export const validateAnalytics = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const errorMessages = errors.array().map(err => `${err.param}: ${err.msg}`);
  return res.status(400).json({
    status: 'error',
    message: 'Invalid query parameters',
    errors: errorMessages
  });
};