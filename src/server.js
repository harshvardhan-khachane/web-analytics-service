import express from 'express';
import dotenv from 'dotenv';
import pool from './config/db.js';
import eventRoutes from './routes/eventRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Initialize configuration
dotenv.config();

// Constants
const PORT = process.env.PORT || 3000;

// Express setup
const app = express();

// Middleware Pipeline
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Analytics service is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/db-status', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time');
    res.status(200).json({
      status: 'success',
      dbStatus: 'connected',
      currentTime: result.rows[0].current_time
    });
  } catch (error) {
    next(error); // Pass to error handler
  }
});

// Main API routes
app.use('/events', eventRoutes);
app.use('/analytics', analyticsRoutes);

// =====================
// Error Handling
// =====================

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =====================
// Server Startup
// =====================
let server;
try {
  server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
} catch (startupError) {
  console.error('Server failed to start:', startupError);
  process.exit(1);
}

// =====================
// Process Cleanup
// =====================
const shutdown = (signal) => {
  console.log(`${signal} received: shutting down gracefully...`);
  server?.close(() => {
    pool.end().then(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  shutdown('unhandledRejection');
});