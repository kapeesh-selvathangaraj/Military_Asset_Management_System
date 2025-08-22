const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details from database
    const userResult = await query(
      'SELECT id, username, email, role, base_id, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Account disabled',
        message: 'Your account has been deactivated'
      });
    }

    // Add user info to request object
    req.user = user;
    
    // Log authentication
    logger.debug('User authenticated', {
      userId: user.id,
      username: user.username,
      role: user.role,
      ip: req.ip
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Authentication token is invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Authentication token has expired'
      });
    }

    logger.error('Authentication error:', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        username: req.user.username,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.path,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

// Base access control middleware (for base commanders)
const authorizeBaseAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    // Admins have access to all bases
    if (req.user.role === 'admin') {
      return next();
    }

    // Base commanders can only access their own base
    if (req.user.role === 'base_commander') {
      const requestedBaseId = req.params.baseId || req.body.base_id || req.query.base_id;
      
      if (requestedBaseId && requestedBaseId !== req.user.base_id) {
        logger.warn('Base access denied', {
          userId: req.user.id,
          username: req.user.username,
          userBaseId: req.user.base_id,
          requestedBaseId: requestedBaseId,
          endpoint: req.path,
          ip: req.ip
        });

        return res.status(403).json({ 
          error: 'Base access denied',
          message: 'You can only access data for your assigned base'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Base authorization error:', {
      error: error.message,
      userId: req.user?.id,
      endpoint: req.path,
      ip: req.ip
    });

    res.status(500).json({ 
      error: 'Authorization failed',
      message: 'Internal server error during authorization'
    });
  }
};

// Audit logging middleware
const auditMiddleware = (action) => {
  return (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    // Override send function to log after response
    res.send = function(data) {
      // Log the action
      logger.info('AUDIT', {
        action,
        userId: req.user?.id,
        username: req.user?.username,
        method: req.method,
        endpoint: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        statusCode: res.statusCode,
        requestBody: req.method !== 'GET' ? req.body : undefined
      });

      // Call original send function
      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  authenticateToken,
  authorize,
  authorizeBaseAccess,
  auditMiddleware
};
