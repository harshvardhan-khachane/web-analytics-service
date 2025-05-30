import { query, validationResult } from 'express-validator';

export const eventCountValidation = [
  // Validate event_type
  query('event_type')
    .optional()
    .isIn(['view', 'click', 'location'])
    .withMessage('Invalid event type. Must be view, click, or location'),
  
  // Validate date formats and logical ordering
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid start_date format. Use ISO 8601 (YYYY-MM-DD)')
    .toDate(),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid end_date format. Use ISO 8601 (YYYY-MM-DD)')
    .toDate()
    .custom((value, { req }) => {
      if (req.query.start_date && value < req.query.start_date) {
        throw new Error('end_date must be after start_date');
      }
      return true;
    })
];

export const validateAnalytics = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const errorMessages = errors.array().map(err => err.msg);
  return res.status(400).json({
    status: 'error',
    message: 'Invalid query parameters',
    errors: errorMessages
  });
};