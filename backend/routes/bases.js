const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const baseFiltersSchema = Joi.object({
  isActive: Joi.boolean().optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0)
});

// GET /api/bases
router.get('/',
  authenticateToken,
  authorize('admin', 'base_commander', 'logistics_officer'),
  async (req, res) => {
    try {
      // Validate query parameters
      const { error, value } = baseFiltersSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.details[0].message
        });
      }

      const { isActive, limit, offset } = value;

      // Build WHERE clause based on user role and filters
      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramIndex = 1;

      // Role-based filtering - base commanders can only see their own base
      if (req.user.role === 'base_commander') {
        whereConditions.push(`b.id = $${paramIndex}`);
        queryParams.push(req.user.base_id);
        paramIndex++;
      }

      // Additional filters
      if (isActive !== undefined) {
        whereConditions.push(`b.is_active = $${paramIndex}`);
        queryParams.push(isActive);
        paramIndex++;
      }

      // Add limit and offset
      queryParams.push(limit, offset);
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get bases with commander information
      const basesQuery = `
        SELECT 
          b.id,
          b.name,
          b.code,
          b.location,
          b.commander_id,
          u.username as commander_username,
          u.first_name as commander_first_name,
          u.last_name as commander_last_name,
          b.contact_info,
          b.is_active,
          b.created_at,
          b.updated_at
        FROM bases b
        LEFT JOIN users u ON b.commander_id = u.id
        ${whereClause}
        ORDER BY b.name
        ${limitClause}
      `;

      const basesResult = await query(basesQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM bases b
        ${whereClause.replace(/LIMIT.*$/, '')}
      `;

      const countResult = await query(countQuery, queryParams.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        bases: basesResult.rows,
        pagination: {
          limit,
          offset,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: { isActive }
      });

    } catch (error) {
      logger.error('Get bases error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        filters: req.query
      });

      res.status(500).json({
        error: 'Failed to fetch bases',
        message: 'Internal server error while fetching bases'
      });
    }
  }
);

// GET /api/bases/:id
router.get('/:id',
  authenticateToken,
  authorize('admin', 'base_commander', 'logistics_officer'),
  async (req, res) => {
    try {
      const baseId = req.params.id;

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(baseId)) {
        return res.status(400).json({
          error: 'Invalid base ID',
          message: 'Base ID must be a valid UUID'
        });
      }

      // Check access for base commanders
      if (req.user.role === 'base_commander' && baseId !== req.user.base_id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access information for your assigned base'
        });
      }

      // Get base with commander and asset summary information
      const baseQuery = `
        SELECT 
          b.id,
          b.name,
          b.code,
          b.location,
          b.commander_id,
          u.username as commander_username,
          u.first_name as commander_first_name,
          u.last_name as commander_last_name,
          b.contact_info,
          b.is_active,
          b.created_at,
          b.updated_at,
          COUNT(DISTINCT ab.asset_type_id) as asset_types_count,
          COALESCE(SUM(ab.current_balance), 0) as total_assets
        FROM bases b
        LEFT JOIN users u ON b.commander_id = u.id
        LEFT JOIN asset_balances ab ON b.id = ab.base_id
        WHERE b.id = $1
        GROUP BY b.id, b.name, b.code, b.location, b.commander_id, u.username, u.first_name, u.last_name, b.contact_info, b.is_active, b.created_at, b.updated_at
      `;

      const baseResult = await query(baseQuery, [baseId]);

      if (baseResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Base not found',
          message: 'The specified base does not exist'
        });
      }

      res.json({
        base: baseResult.rows[0]
      });

    } catch (error) {
      logger.error('Get base error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        baseId: req.params.id
      });

      res.status(500).json({
        error: 'Failed to fetch base',
        message: 'Internal server error while fetching base'
      });
    }
  }
);

// Validation schema for creating a base
const createBaseSchema = Joi.object({
  name: Joi.string().max(100).required(),
  code: Joi.string().max(20).required(),
  location: Joi.string().max(200).required(),
  commander_id: Joi.string().uuid().allow(null, '').optional(),
  contact_info: Joi.object().optional(),
  is_active: Joi.boolean().default(true)
});

// Validation schema for updating a base
const updateBaseSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  code: Joi.string().max(20).optional(),
  location: Joi.string().max(200).optional(),
  commander_id: Joi.string().uuid().allow(null, '').optional(),
  contact_info: Joi.object().optional(),
  is_active: Joi.boolean().optional()
}).min(1);

// POST /api/bases  (Create base)
router.post('/',
  authenticateToken,
  authorize('admin'),
  async (req, res) => {
    try {
      const { error, value } = createBaseSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: 'Validation failed', message: error.details[0].message });
      }

      const { name, code, location, commander_id, contact_info, is_active } = value;

      const insertQuery = `
        INSERT INTO bases (name, code, location, commander_id, contact_info, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await query(insertQuery, [name, code, location, commander_id || null, contact_info || null, is_active]);

      res.status(201).json({ base: result.rows[0] });
    } catch (err) {
      logger.error('Create base error', err);
      res.status(500).json({ error: 'Failed to create base' });
    }
  }
);

// PUT /api/bases/:id  (Update base)
router.put('/:id',
  authenticateToken,
  authorize('admin'),
  async (req, res) => {
    try {
      const baseId = req.params.id;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(baseId)) {
        return res.status(400).json({ error: 'Invalid base ID', message: 'Base ID must be a valid UUID' });
      }

      const { error, value } = updateBaseSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: 'Validation failed', message: error.details[0].message });
      }

      const fields = [];
      const params = [];
      let idx = 1;
      for (const [key, val] of Object.entries(value)) {
        fields.push(`${key} = $${idx}`);
        params.push(val);
        idx++;
      }
      params.push(baseId);

      const updateQuery = `
        UPDATE bases SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${idx}
        RETURNING *
      `;

      const result = await query(updateQuery, params);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Base not found', message: 'No base with given ID' });
      }

      res.json({ base: result.rows[0] });
    } catch (err) {
      logger.error('Update base error', err);
      res.status(500).json({ error: 'Failed to update base' });
    }
  }
);

// PATCH /api/bases/:id/activate or /deactivate
router.patch('/:id/:action(activate|deactivate)',
  authenticateToken,
  authorize('admin'),
  async (req, res) => {
    try {
      const { id, action } = req.params;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return res.status(400).json({ error: 'Invalid base ID', message: 'Base ID must be a valid UUID' });
      }

      const isActive = action === 'activate';
      const updateQuery = 'UPDATE bases SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
      const result = await query(updateQuery, [isActive, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Base not found', message: 'No base with given ID' });
      }

      res.json({ base: result.rows[0] });
    } catch (err) {
      logger.error('Toggle base active error', err);
      res.status(500).json({ error: 'Failed to update base status' });
    }
  }
);

module.exports = router;
