import * as analyticsService from '../services/analyticsService.js';

export const getEventCounts = async (req, res) => {
  try {
    const filters = {
      event_type: req.query.event_type,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };
    
    const totalEvents = await analyticsService.getEventCounts(filters);
    
    res.status(200).json({
      status: 'success',
      data: {
        total_events: totalEvents
      }
    });
    
  } catch (error) {
    console.error(`Analytics error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve event counts'
    });
  }
};