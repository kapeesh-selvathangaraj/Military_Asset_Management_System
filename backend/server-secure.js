const express = require('express');
const https = require('https');
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

// Trust proxy for secure headers
app.set('trust proxy', 1);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts',
    message: 'Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.',
    retryAfter: 900,
    lockoutTime: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for auth endpoint', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.',
      retryAfter: 900
    });
  }
});

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});

app.use(generalLimiter);

// CORS configuration with enhanced security
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://127.0.0.1:3000',
      'https://127.0.0.1:3000'
    ];
    
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from unauthorized origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
}));

// Body parsing with size limits and validation
app.use(express.json({ 
  limit: '1mb', // Reduced from 10mb for security
  verify: (req, res, buf) => {
    // Basic validation - ensure it's valid JSON
    try {
      JSON.parse(buf);
    } catch (e) {
      logger.warn('Invalid JSON received', { 
        ip: req.ip, 
        path: req.path,
        error: e.message 
      });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Enhanced security logging middleware
app.use((req, res, next) => {
  const securityLog = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    secure: req.secure,
    protocol: req.protocol,
    contentLength: req.get('Content-Length') || 0
  };

  // Log auth attempts without sensitive data
  if (req.path.includes('/auth/')) {
    securityLog.authEndpoint = true;
    securityLog.hasCredentials = !!(req.body && (req.body.username || req.body.email));
  }

  // Don't log request bodies for security
  logger.info('Request', securityLog);
  next();
});

// Security warning for HTTP
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    logger.warn('Insecure HTTP request in production', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
  }
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
    protocol: req.protocol,
    security: {
      https: req.secure,
      rateLimit: 'active',
      helmet: 'active',
      cors: 'restricted'
    }
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

// Security endpoint to check system security status
app.get('/api/security/status', (req, res) => {
  res.json({
    secure: req.secure,
    protocol: req.protocol,
    rateLimiting: 'active',
    securityHeaders: 'active',
    corsRestricted: true,
    environment: process.env.NODE_ENV,
    warning: req.secure ? null : 'Connection is not secure. Use HTTPS in production.'
  });
});

// 404 handler with security logging
app.use('*', (req, res) => {
  logger.warn('404 Not Found - Potential scanning attempt', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Enhanced error handler with security
app.use((err, req, res, next) => {
  // Log security-relevant errors
  logger.error('Application error', {
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Don't expose internal errors in production
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(err.status || 500).json({
    error: errorMessage,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      details: err.details 
    })
  });
});

// Start server with security warnings
const startSecureServer = async () => {
  try {
    await connectDatabase();
    console.log("✅ Database connected successfully");

    const server = app.listen(PORT, () => {
      logger.info(`Military Asset Management Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV,
        port: PORT,
        secure: false,
        securityFeatures: {
          helmet: true,
          rateLimit: true,
          cors: true,
          authLimiter: true
        }
      });

      console.log(`\n🚀 Military Asset Management Server Started`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🛡️  Security Features: Enhanced rate limiting, CORS, Helmet`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`\n⚠️  SECURITY WARNING:`);
        console.log(`🔓 Running on HTTP in production mode!`);
        console.log(`🔒 For production deployment, use HTTPS with valid SSL certificates`);
        console.log(`📋 See SECURITY.md for implementation guide`);
      } else {
        console.log(`\n🔧 Development Mode:`);
        console.log(`🔓 HTTP is acceptable for development only`);
        console.log(`🔒 Use HTTPS for production deployment`);
      }
      
      console.log(`\n📊 Security Status:`);
      console.log(`✅ Rate Limiting: 5 auth attempts/15min, 100 general requests/15min`);
      console.log(`✅ Security Headers: Helmet.js active`);
      console.log(`✅ CORS: Restricted to allowed origins`);
      console.log(`✅ Input Validation: JSON validation active`);
      console.log(`✅ Security Logging: All requests logged`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start secure server:', error);
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

// Start the secure server
startSecureServer();

module.exports = app;
