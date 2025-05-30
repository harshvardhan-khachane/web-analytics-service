import { query } from '../config/db.js';

export const getEventCounts = async (filters = {}) => {
  const { event_type, start_date, end_date } = filters;
  
  // Base query
  let sql = 'SELECT COUNT(*) AS total_events FROM events';
  const params = [];
  
  // Build WHERE clauses
  const conditions = [];
  
  if (event_type) {
    conditions.push(`event_type = $${params.length + 1}`);
    params.push(event_type);
  }
  
  if (start_date) {
    conditions.push(`timestamp >= $${params.length + 1}`);
    params.push(start_date);
  }
  
  if (end_date) {
    // Add 1 day to include all events on end_date
    const nextDay = new Date(end_date);
    nextDay.setDate(nextDay.getDate() + 1);
    conditions.push(`timestamp < $${params.length + 1}`);
    params.push(nextDay.toISOString());
  }
  
  // Combine conditions
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  // Execute query
  const result = await query(sql, params);
  return parseInt(result.rows[0].total_events, 10);
};

export const getEventCountsByType = async (filters = {}) => {
  const { start_date, end_date } = filters;
  
  // Base query
  let sql = `SELECT event_type, COUNT(*) AS count FROM events`;
  
  const params = [];
  const conditions = [];
  
  // Date filtering
  if (start_date) {
    conditions.push(`timestamp >= $${params.length + 1}`);
    params.push(start_date);
  }
  
  if (end_date) {
    // Add 1 day to include all events on end_date
    const nextDay = new Date(end_date);
    nextDay.setDate(nextDay.getDate() + 1);
    conditions.push(`timestamp < $${params.length + 1}`);
    params.push(nextDay.toISOString());
  }
  
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  // Grouping
  sql += ` GROUP BY event_type`;
  
  // Execute query
  const result = await query(sql, params);
  
  // Transform to { view: 123, click: 45 } format
  return result.rows.reduce((acc, row) => {
    acc[row.event_type] = parseInt(row.count, 10);
    return acc;
  }, {});
};