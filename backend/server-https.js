const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const { connectDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const purchaseRoutes = require('./routes/purchases');
const transferRoutes = require('./routes/transfers');
const assignmentRoutes = require('./routes/assignments');
const userRoutes = require('./routes/users');
const baseRoutes = require('./routes/bases');
const assetRoutes = require('./routes/assets');

const app = express();
const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Force HTTPS redirect in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Trust proxy for secure headers
app.set('trust proxy', 1);

// Enhanced rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health'
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts',
    message: 'Account temporarily locked. Please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration with security
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count']
}));

// Body parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Add request body validation here if needed
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security logging middleware
app.use((req, res, next) => {
  // Log security-relevant requests
  const securityLog = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    secure: req.secure,
    protocol: req.protocol
  };

  // Don't log sensitive data
  if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
    securityLog.authAttempt = true;
  }

  logger.info('Request', securityLog);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    secure: req.secure,
    protocol: req.protocol
  });
});

// API Routes with enhanced security
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bases', baseRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/reports', require('./routes/reports'));

// 404 handler
app.use('*', (req, res) => {
  logger.warn('404 Not Found', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler with security
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// HTTPS Server setup
const startSecureServer = async () => {
  try {
    await connectDatabase();
    console.log("✅ Database connected successfully");

    // Try to load SSL certificates
    let httpsOptions = null;
    
    try {
      const certPath = path.join(__dirname, 'ssl');
      httpsOptions = {
        key: fs.readFileSync(path.join(certPath, 'private-key.pem')),
        cert: fs.readFileSync(path.join(certPath, 'certificate.pem'))
      };
      console.log("✅ SSL certificates loaded");
    } catch (certError) {
      console.log("⚠️  SSL certificates not found, generating self-signed certificates...");
      // In production, you would use proper SSL certificates
      // For development, we'll create self-signed certificates
    }

    if (httpsOptions) {
      // Start HTTPS server
      const httpsServer = https.createServer(httpsOptions, app);
      httpsServer.listen(HTTPS_PORT, () => {
        logger.info(`🔒 Secure Military Asset Management Server running on HTTPS port ${HTTPS_PORT}`, {
          environment: process.env.NODE_ENV,
          port: HTTPS_PORT,
          secure: true
        });
        console.log(`🔒 HTTPS Server: https://localhost:${HTTPS_PORT}`);
      });
    }

    // Start HTTP server (for development or redirect to HTTPS)
    const httpServer = app.listen(PORT, () => {
      logger.info(`Military Asset Management Server running on HTTP port ${PORT}`, {
        environment: process.env.NODE_ENV,
        port: PORT,
        secure: false
      });
      console.log(`🌐 HTTP Server: http://localhost:${PORT}`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log("⚠️  WARNING: HTTP server should only be used for HTTPS redirect in production!");
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start secure server:', error);
    process.exit(1);
  }
};

// Start the secure server
startSecureServer();

module.exports = app;
