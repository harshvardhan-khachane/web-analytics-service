import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan'; // Added for HTTP request logging
import pool from './config/db.js';
import eventRoutes from './routes/eventRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Initialize configuration
dotenv.config();

// Constants
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Express setup
const app = express();

// ======================
// Logging Middleware
// ======================

// HTTP request logger
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: {
    write: (message) => console.log(`[HTTP] ${message.trim()}`)
  }
}));

// Custom request logger
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    console[logLevel](JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'request',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      ...(NODE_ENV === 'development' && { 
        query: req.query,
        params: req.params 
      })
    }));
  });
  
  next();
});

// ======================
// Application Middleware
// ======================
app.use(express.json());

// ======================
// Routes
// ======================
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
    next(error);
  }
});

// Main API routes
app.use('/events', eventRoutes);
app.use('/analytics', analyticsRoutes);

// ======================
// Error Handling
// ======================

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log the error
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'error',
    message: err.message,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    ...(err.sql && { sql: err.sql })
  }));

  // Send response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(NODE_ENV === 'development' && { 
      stack: err.stack,
      ...(err.details && { details: err.details })
    })
  });
});

// ======================
// Server Startup
// ======================
let server;
try {
  server = app.listen(PORT, () => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'startup',
      message: `Server running on http://localhost:${PORT}`,
      environment: NODE_ENV,
      pid: process.pid
    }));
  });
} catch (startupError) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'fatal',
    message: 'Server failed to start',
    error: startupError.message,
    stack: startupError.stack
  }));
  process.exit(1);
}

// ======================
// Process Cleanup
// ======================
const shutdown = (signal) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'shutdown',
    message: `${signal} received: shutting down gracefully...`
  }));
  
  server?.close(() => {
    pool.end().then(() => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'shutdown',
        message: 'Database pool closed'
      }));
      process.exit(0);
    }).catch(dbError => {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'shutdown-error',
        message: 'Failed to close database pool',
        error: dbError.message
      }));
      process.exit(1);
    });
  });
};

// Signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Unhandled exceptions
process.on('uncaughtException', (err) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'uncaught-exception',
    message: 'Unhandled exception occurred',
    error: err.message,
    stack: err.stack
  }));
  shutdown('uncaughtException');
});

// Unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'unhandled-rejection',
    message: 'Unhandled promise rejection',
    reason: reason.message || reason,
    stack: reason.stack
  }));
  shutdown('unhandledRejection');
});