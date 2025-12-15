const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { pool } = require('./config/database');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));



// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║                                                      ║`);
  console.log(`║  🚀 Base2 Backend Server                            ║`);
  console.log(`║                                                      ║`);
  console.log(`║  Server running on: http://localhost:${PORT.toString().padEnd(9)}      ║`);
  console.log(`║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(10)}                     ║`);
  console.log(`║                                                      ║`);
  console.log(`║  Available routes:                                   ║`);
  console.log(`║  - POST   /api/auth/register                        ║`);
  console.log(`║  - POST   /api/auth/login                           ║`);
  console.log(`║  - GET    /api/auth/verify-email/:token             ║`);
  console.log(`║  - POST   /api/auth/resend-verification             ║`);
  console.log(`║  - POST   /api/auth/forgot-password                 ║`);
  console.log(`║  - POST   /api/auth/reset-password/:token           ║`);
  console.log(`║  - GET    /api/auth/me                              ║`);
  console.log(`║  - POST   /api/auth/google                          ║`);
  console.log(`║  - GET    /api/health                               ║`);
  console.log(`║                                                      ║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await pool.end();
  console.log('Database pool closed');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

module.exports = app;
