import { body, validationResult } from 'express-validator';

// Event type-specific validation rules
const eventValidationRules = () => [
  body('user_id').trim().notEmpty().withMessage('User ID is required'),
  body('event_type').isIn(['view', 'click', 'location']).withMessage('Invalid event type'),
  
  // Payload validation based on event type
  body('payload').custom((value, { req }) => {
    switch(req.body.event_type) {
      case 'view':
        if (!value.url) throw new Error('URL is required for view events');
        break;
      case 'click':
        if (!value.element_id && !value.text && !value.xpath) 
          throw new Error('At least one click identifier is required');
        break;
      case 'location':
        if (typeof value.latitude !== 'number' || typeof value.longitude !== 'number')
          throw new Error('Latitude and longitude must be numbers');
        if (Math.abs(value.latitude) > 90 || Math.abs(value.longitude) > 180)
          throw new Error('Invalid coordinate values');
        break;
    }
    return true;
  })
];

// Error handling middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const errorMessages = errors.array().map(err => `${err.param}: ${err.msg}`);
  return res.status(400).json({
    status: 'error',
    message: 'Validation failed',
    errors: errorMessages
  });
};

export { eventValidationRules, validate };