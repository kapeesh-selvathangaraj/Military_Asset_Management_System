const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { query } = require('../config/database');
const { authenticateToken, auditMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  // Accept username with underscores OR an email address in the same field
  username: Joi.alternatives().try(
    Joi.string().pattern(/^[A-Za-z0-9_]+$/).min(3).max(50),
    Joi.string().email()
  ).required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  role: Joi.string().valid('admin', 'base_commander', 'logistics_officer').required(),
  baseId: Joi.string().uuid().optional()
});

// Generate JWT token
const generateToken = (userId, username, role) => {
  return jwt.sign(
    { userId, username, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// POST /api/auth/login
router.post('/login', auditMiddleware('USER_LOGIN'), async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const { username, password } = value;

    // Find user by username or email
    const isEmail = username.includes('@');
    const userResult = await query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name, 
              u.role, u.base_id, u.is_active, b.name as base_name
       FROM users u
       LEFT JOIN bases b ON u.base_id = b.id
       WHERE ${isEmail ? 'u.email' : 'u.username'} = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      logger.warn('Login attempt with invalid username', {
        username,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      logger.warn('Login attempt with deactivated account', {
        userId: user.id,
        username: user.username,
        ip: req.ip
      });

      return res.status(401).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', {
        userId: user.id,
        username: user.username,
        ip: req.ip
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.username, user.role);

    // Log successful login
    logger.info('User logged in successfully', {
      userId: user.id,
      username: user.username,
      role: user.role,
      ip: req.ip
    });

    // Return user data and token
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        baseId: user.base_id,
        baseName: user.base_name
      }
    });

  } catch (error) {
    logger.error('Login error:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });

    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error during login'
    });
  }
});

// POST /api/auth/register (Admin only)
router.post('/register', 
  authenticateToken,
  auditMiddleware('USER_REGISTER'),
  async (req, res) => {
    try {
      // Only admins can register new users
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only administrators can register new users'
        });
      }

      // Validate input
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.details[0].message
        });
      }

      const { username, email, password, firstName, lastName, role, baseId } = value;

      // Check if username already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'Username or email is already taken'
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const newUserResult = await query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, role, base_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, username, email, first_name, last_name, role, base_id, created_at`,
        [username, email, passwordHash, firstName, lastName, role, baseId]
      );

      const newUser = newUserResult.rows[0];

      logger.info('New user registered', {
        newUserId: newUser.id,
        newUsername: newUser.username,
        newUserRole: newUser.role,
        registeredBy: req.user.id,
        registeredByUsername: req.user.username
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role,
          baseId: newUser.base_id,
          createdAt: newUser.created_at
        }
      });

    } catch (error) {
      logger.error('Registration error:', {
        error: error.message,
        stack: error.stack,
        registeredBy: req.user?.id
      });

      res.status(500).json({
        error: 'Registration failed',
        message: 'Internal server error during registration'
      });
    }
  }
);

// GET /api/auth/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Get user profile with base information
    const userResult = await query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
              u.role, u.base_id, u.created_at, b.name as base_name
       FROM users u
       LEFT JOIN bases b ON u.base_id = b.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    const user = userResult.rows[0];

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        baseId: user.base_id,
        baseName: user.base_name,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    logger.error('Profile fetch error:', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'Internal server error while fetching profile'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', 
  authenticateToken,
  auditMiddleware('USER_LOGOUT'),
  (req, res) => {
    logger.info('User logged out', {
      userId: req.user.id,
      username: req.user.username,
      ip: req.ip
    });

    res.json({
      message: 'Logout successful'
    });
  }
);

// GET /api/auth/activity - User activity log
router.get('/activity',
  authenticateToken,
  async (req, res) => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      
      // For now, return empty activity log as this would require audit log table
      // In a full implementation, this would query an audit_logs table
      res.json({
        activities: [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: 0,
          pages: 0
        },
        message: 'Activity logging not yet implemented'
      });

    } catch (error) {
      logger.error('Auth activity error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Failed to fetch user activity',
        message: 'Internal server error while fetching activity log'
      });
    }
  }
);

module.exports = router;
