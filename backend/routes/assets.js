const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const assetFiltersSchema = Joi.object({
  baseId: Joi.string().uuid().optional(),
  assetTypeId: Joi.string().uuid().optional(),
  current_status: Joi.string().valid('available', 'assigned', 'maintenance', 'disposed', 'transferred').optional(),
  condition_status: Joi.string().valid('new', 'good', 'fair', 'poor', 'unserviceable').optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

const createAssetSchema = Joi.object({
  asset_type_id: Joi.string().uuid().required(),
  serial_number: Joi.string().max(100).optional(),
  base_id: Joi.string().uuid().required(),
  model: Joi.string().max(100).optional(),
  manufacturer: Joi.string().max(100).optional(),
  current_status: Joi.string().valid('available', 'assigned', 'maintenance', 'disposed', 'transferred').default('available'),
  condition_status: Joi.string().valid('new', 'good', 'fair', 'poor', 'unserviceable').default('good'),
  acquisition_date: Joi.date().optional(),
  acquisition_cost: Joi.number().precision(2).min(0).optional(),
  metadata: Joi.object().optional(),
  notes: Joi.string().optional()
});

// GET /api/assets
router.get('/',
  authenticateToken,
  authorize('admin', 'base_commander', 'logistics_officer'),
  async (req, res) => {
    try {
      // Validate query
      const { error, value } = assetFiltersSchema.validate(req.query);
      if (error) {
        return res.status(400).json({ error: 'Validation failed', message: error.details[0].message });
      }

      const { baseId, assetTypeId, current_status, condition_status, limit, offset } = value;

      // Build WHERE conditions
      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramIndex = 1;

      if (req.user.role === 'base_commander') {
        if (!req.user.base_id) {
          return res.status(400).json({ 
            error: 'No base assigned', 
            message: 'Base commander does not have a base_id' 
          });
        }
        whereConditions.push(`a.base_id = $${paramIndex}`);
        queryParams.push(req.user.base_id);
        paramIndex++;
      } else if (baseId) {
        whereConditions.push(`a.base_id = $${paramIndex}`);
        queryParams.push(baseId);
        paramIndex++;
      }

      if (assetTypeId) {
        whereConditions.push(`a.asset_type_id = $${paramIndex}`);
        queryParams.push(assetTypeId);
        paramIndex++;
      }

      if (current_status) {
        whereConditions.push(`a.current_status = $${paramIndex}`);
        queryParams.push(current_status);
        paramIndex++;
      }

      if (condition_status) {
        whereConditions.push(`a.condition_status = $${paramIndex}`);
        queryParams.push(condition_status);
        paramIndex++;
      }

      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Assets query with LEFT JOIN
      const assetsQuery = `
        SELECT 
          a.id,
          a.asset_type_id,
          at.name as asset_type_name,
          at.category as asset_category,
          a.base_id,
          b.name as base_name,
          b.name as base_code,
          a.serial_number,
          a.model,
          a.manufacturer,
          a.acquisition_date,
          a.acquisition_cost,
          a.current_status,
          a.condition_status,
          a.metadata,
          a.created_at,
          a.updated_at
        FROM assets a
        LEFT JOIN asset_types at ON a.asset_type_id = at.id
        LEFT JOIN bases b ON a.base_id = b.id
        ${whereClause}
        ORDER BY a.created_at DESC
        ${limitClause}
      `;

      let assetsResult = [];
      try {
        assetsResult = await query(assetsQuery, queryParams);
      } catch (err) {
        logger.error('Assets query failed', err);
        return res.status(500).json({ error: 'Failed to fetch assets' });
      }

      // Total count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM assets a
        ${whereClause}
      `;

      let total = 0;
      try {
        const countResult = await query(countQuery, queryParams.slice(0, -2));
        total = parseInt(countResult.rows[0]?.total || 0);
      } catch (err) {
        logger.error('Count query failed', err);
        total = 0;
      }

      res.json({
        assets: assetsResult.rows || [],
        pagination: {
          limit,
          offset,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: { baseId, assetTypeId, current_status, condition_status }
      });

    } catch (error) {
      logger.error('Get assets error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        filters: req.query
      });
      res.status(500).json({ error: 'Failed to fetch assets', message: 'Internal server error' });
    }
  }
);

// GET /api/assets/types
router.get('/types',
  authenticateToken,
  authorize('admin', 'base_commander', 'logistics_officer'),
  async (req, res) => {
    try {
      const { category, isActive } = req.query;

      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramIndex = 1;

      if (category) {
        whereConditions.push(`category = $${paramIndex}`);
        queryParams.push(category);
        paramIndex++;
      }

      if (isActive !== undefined) {
        whereConditions.push(`is_active = $${paramIndex}`);
        queryParams.push(isActive === 'true');
        paramIndex++;
      }

      const whereClause = whereConditions.length > 1 ? `WHERE ${whereConditions.slice(1).join(' AND ')}` : '';

      const assetTypesQuery = `
        SELECT id, name, category, description, unit_of_measure, is_active, created_at
        FROM asset_types
        ${whereClause}
        ORDER BY category, name
      `;

      const assetTypesResult = await query(assetTypesQuery, queryParams);

      res.json({
        assetTypes: assetTypesResult.rows || [],
        filters: { category, isActive }
      });

    } catch (error) {
      logger.error('Get asset types error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        filters: req.query
      });
      res.status(500).json({ error: 'Failed to fetch asset types', message: 'Internal server error' });
    }
  }
);

// GET /api/assets/:id
router.get('/:id',
  authenticateToken,
  authorize('admin', 'base_commander', 'logistics_officer'),
  async (req, res) => {
    try {
      const assetId = req.params.id;

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assetId)) {
        return res.status(400).json({ error: 'Invalid asset ID', message: 'Must be a valid UUID' });
      }

      let assetQuery = `
        SELECT a.*, at.name as asset_type_name, at.category as asset_category,
               at.description as asset_type_description, b.name as base_name, b.name as base_code
        FROM assets a
        LEFT JOIN asset_types at ON a.asset_type_id = at.id
        LEFT JOIN bases b ON a.base_id = b.id
        WHERE a.id = $1
      `;

      const queryParams = [assetId];

      if (req.user.role === 'base_commander') {
        if (!req.user.base_id) {
          return res.status(400).json({ error: 'No base assigned', message: 'Cannot fetch asset' });
        }
        assetQuery += ' AND a.base_id = $2';
        queryParams.push(req.user.base_id);
      }

      const assetResult = await query(assetQuery, queryParams);

      if (!assetResult.rows || assetResult.rows.length === 0) {
        return res.status(404).json({ error: 'Asset not found', message: 'Asset does not exist or access denied' });
      }

      const asset = assetResult.rows[0];

      // Assignment history
      const assignmentHistoryQuery = `
        SELECT a.id, a.assignment_date, a.expected_return_date, a.actual_return_date,
               a.status, a.purpose, u.username as assigned_to_username,
               u.first_name as assigned_to_first_name, u.last_name as assigned_to_last_name,
               abu.username as assigned_by_username
        FROM assignments a
        LEFT JOIN users u ON a.assigned_to_user_id = u.id
        LEFT JOIN users abu ON a.assigned_by = abu.id
        WHERE a.asset_id = $1
        ORDER BY a.assignment_date DESC
        LIMIT 10
      `;

      const assignmentHistoryResult = await query(assignmentHistoryQuery, [assetId]);

      res.json({
        asset,
        assignmentHistory: assignmentHistoryResult.rows || []
      });

    } catch (error) {
      logger.error('Get asset error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        assetId: req.params.id
      });
      res.status(500).json({ error: 'Failed to fetch asset', message: 'Internal server error' });
    }
  }
);

module.exports = router;
