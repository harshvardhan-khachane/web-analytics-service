import express from 'express';
import dotenv from 'dotenv';
import pool from './config/db.js';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Analytics service is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Server error: ${err.message}`);
  res.status(500).json({ 
    status: 'error',
    message: 'Internal server error' 
  });
});

// Database connection test endpoint
app.get('/db-status', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time');
    res.status(200).json({
      status: 'success',
      dbStatus: 'connected',
      currentTime: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});