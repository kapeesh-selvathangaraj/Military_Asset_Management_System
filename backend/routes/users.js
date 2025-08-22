const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const userFiltersSchema = Joi.object({
  role: Joi.string().valid('admin', 'base_commander', 'logistics_officer').optional(),
  baseId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

// GET /api/users
router.get('/',
  authenticateToken,
  authorize('admin', 'base_commander'),
  async (req, res) => {
    try {
      // Validate query parameters
      const { error, value } = userFiltersSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.details[0].message
        });
      }

      const { role, baseId, isActive, limit, offset } = value;

      // Build WHERE clause based on user role and filters
      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramIndex = 1;

      // Role-based filtering - base commanders can only see users from their base
      if (req.user.role === 'base_commander') {
        whereConditions.push(`u.base_id = $${paramIndex}`);
        queryParams.push(req.user.base_id);
        paramIndex++;
      } else if (baseId) {
        whereConditions.push(`u.base_id = $${paramIndex}`);
        queryParams.push(baseId);
        paramIndex++;
      }

      // Additional filters
      if (role) {
        whereConditions.push(`u.role = $${paramIndex}`);
        queryParams.push(role);
        paramIndex++;
      }

      if (isActive !== undefined) {
        whereConditions.push(`u.is_active = $${paramIndex}`);
        queryParams.push(isActive);
        paramIndex++;
      }

      // Add limit and offset
      queryParams.push(limit, offset);
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get users with base information
      const usersQuery = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.first_name,
          u.last_name,
          u.full_name,
          u.role,
          u.base_id,
          b.name as base_name,
          b.code as base_code,
          u.is_active,
          u.created_at,
          u.updated_at
        FROM users u
        LEFT JOIN bases b ON u.base_id = b.id
        ${whereClause}
        ORDER BY u.created_at DESC
        ${limitClause}
      `;

      const usersResult = await query(usersQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        ${whereClause.replace(/LIMIT.*$/, '')}
      `;

      const countResult = await query(countQuery, queryParams.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        users: usersResult.rows,
        pagination: {
          limit,
          offset,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: { role, baseId, isActive }
      });

    } catch (error) {
      logger.error('Get users error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        filters: req.query
      });

      res.status(500).json({
        error: 'Failed to fetch users',
        message: 'Internal server error while fetching users'
      });
    }
  }
);

// GET /api/users/:id
router.get('/:id',
  authenticateToken,
  authorize('admin', 'base_commander'),
  async (req, res) => {
    try {
      const userId = req.params.id;

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        return res.status(400).json({
          error: 'Invalid user ID',
          message: 'User ID must be a valid UUID'
        });
      }

      // Get user with base information
      let userQuery = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.first_name,
          u.last_name,
          u.full_name,
          u.role,
          u.base_id,
          b.name as base_name,
          b.code as base_code,
          u.is_active,
          u.created_at,
          u.updated_at
        FROM users u
        LEFT JOIN bases b ON u.base_id = b.id
        WHERE u.id = $1
      `;

      let queryParams = [userId];

      // Add base restriction for base commanders
      if (req.user.role === 'base_commander') {
        userQuery += ' AND u.base_id = $2';
        queryParams.push(req.user.base_id);
      }

      const userResult = await query(userQuery, queryParams);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The specified user does not exist or you do not have access to it'
        });
      }

      res.json({
        user: userResult.rows[0]
      });

    } catch (error) {
      logger.error('Get user error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        requestedUserId: req.params.id
      });

      res.status(500).json({
        error: 'Failed to fetch user',
        message: 'Internal server error while fetching user'
      });
    }
  }
);

module.exports = router;
