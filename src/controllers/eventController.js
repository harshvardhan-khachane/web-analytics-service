import * as eventService from '../services/eventService.js';

// Handle event creation
export const createEvent = async (req, res) => {
  try {
    const event = {
      user_id: req.body.user_id,
      event_type: req.body.event_type,
      payload: req.body.payload
    };

    const createdEvent = await eventService.createEvent(event);
    
    res.status(202).json({
      status: 'success',
      message: 'Event accepted',
      event_id: createdEvent.event_id,
      timestamp: createdEvent.timestamp
    });
  } catch (error) {
    console.error(`Event creation error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process event'
    });
  }
};