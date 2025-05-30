import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';

// Create and store event in database
export const createEvent = async (eventData) => {
  const { user_id, event_type, payload } = eventData;
  const event_id = uuidv4();
  
  const result = await query(
    `INSERT INTO events (event_id, user_id, event_type, payload) 
     VALUES ($1, $2, $3, $4) 
     RETURNING event_id, timestamp`,
    [event_id, user_id, event_type, JSON.stringify(payload)]
  );
  
  return result.rows[0];
};