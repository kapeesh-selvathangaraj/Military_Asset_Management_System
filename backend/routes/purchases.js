const express = require('express');
const Joi = require('joi');
const { query, transaction } = require('../config/database');
const { authenticateToken, authorize, authorizeBaseAccess, auditMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const createPurchaseSchema = Joi.object({
  baseId: Joi.string().uuid().required(),
  assetTypeId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).required(),
  unitCost: Joi.number().precision(2).min(0).optional(),
  totalCost: Joi.number().precision(2).min(0).optional(),
  vendor: Joi.string().max(200).optional(),
  purchase_date: Joi.date().required(),
  delivery_date: Joi.date().optional(),
  notes: Joi.string().max(1000).optional()
});

const purchaseFiltersSchema = Joi.object({
  baseId: Joi.string().uuid().optional(),
  assetTypeId: Joi.string().uuid().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  vendor: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

// GET /api/purchases
router.get('/',
  authenticateToken,
  authorize('admin', 'base_commander', 'logistics_officer'),
  authorizeBaseAccess,
  async (req, res) => {
    try {
      // Validate query parameters
      const { error, value } = purchaseFiltersSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.details[0].message
        });
      }

      const { baseId, assetTypeId, startDate, endDate, vendor, limit, offset } = value;

      // Build WHERE clause based on user role and filters
      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramIndex = 1;

      // Role-based filtering
      if (req.user.role === 'base_commander') {
        whereConditions.push(`p.base_id = $${paramIndex}`);
        queryParams.push(req.user.base_id);
        paramIndex++;
      } else if (baseId) {
        whereConditions.push(`p.base_id = $${paramIndex}`);
        queryParams.push(baseId);
        paramIndex++;
      }

      // Additional filters
      if (assetTypeId) {
        whereConditions.push(`p.asset_type_id = $${paramIndex}`);
        queryParams.push(assetTypeId);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`p.purchase_date >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`p.purchase_date <= $${paramIndex}`);
        queryParams.push(endDate);
        paramIndex++;
      }

      if (vendor) {
        whereConditions.push(`p.vendor ILIKE $${paramIndex}`);
        queryParams.push(`%${vendor}%`);
        paramIndex++;
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Add limit and offset using DB helper's $-style placeholders
      queryParams.push(limit, offset);
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

      // Get purchases with related data
      const purchasesQuery = `
        SELECT 
          p.id,
          p.base_id,
          b.name as base_name,
          b.name as base_code,
          p.asset_type_id,
          at.name as asset_type_name,
          at.category as asset_category,
          p.quantity,
          p.unit_cost,
          p.total_cost,
          p.vendor,
          p.purchase_date,
          p.delivery_date,
          p.notes,
          p.created_at,
          u.username as created_by_username,
          u.first_name as created_by_first_name,
          u.last_name as created_by_last_name
        FROM purchases p
        JOIN bases b ON p.base_id = b.id
        JOIN asset_types at ON p.asset_type_id = at.id
        JOIN users u ON p.created_by = u.id
        ${whereClause}
        ORDER BY p.created_at DESC
        ${limitClause}
      `;

      const purchasesResult = await query(purchasesQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM purchases p
        ${whereClause.replace(/LIMIT.*$/, '')}
      `;

      const countResult = await query(countQuery, queryParams.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        purchases: purchasesResult.rows,
        pagination: {
          limit,
          offset,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: { baseId, assetTypeId, startDate, endDate, vendor }
      });

    } catch (error) {
      logger.error('Get purchases error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        filters: req.query
      });

      res.status(500).json({
        error: 'Failed to fetch purchases',
        message: 'Internal server error while fetching purchases'
      });
    }
  }
);

// POST /api/purchases
router.post('/',
  authenticateToken,
  authorize('admin', 'base_commander', 'logistics_officer'),
  authorizeBaseAccess,
  auditMiddleware('CREATE_PURCHASE'),
  async (req, res) => {
    try {
      // Validate input
      const { error, value } = createPurchaseSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.details[0].message
        });
      }

      const {
        baseId,
        assetTypeId,
        quantity,
        unitCost,
        totalCost,
        vendor,
        purchase_date,
        delivery_date,
        notes
      } = value;

      // Check if user has access to the specified base
      if (req.user.role === 'base_commander' && baseId !== req.user.base_id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only create purchases for your assigned base'
        });
      }

      // Verify base and asset type exist
      const baseCheck = await query('SELECT id, name FROM bases WHERE id = $1 AND is_active = true', [baseId]);
      if (baseCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Base not found',
          message: 'The specified base does not exist or is inactive'
        });
      }

      const assetTypeCheck = await query('SELECT id, name FROM asset_types WHERE id = $1 AND is_active = true', [assetTypeId]);
      if (assetTypeCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Asset type not found',
          message: 'The specified asset type does not exist or is inactive'
        });
      }

      // Calculate total cost if not provided
      const finalTotalCost = totalCost || (unitCost ? unitCost * quantity : null);

      // Create purchase and update balances in a transaction
      const result = await transaction(async (client) => {
        // Insert purchase record with RETURNING for PostgreSQL
        const purchaseInsertResult = await client.query(
          `INSERT INTO purchases (
            base_id, asset_type_id, quantity, unit_cost, total_cost,
            vendor, purchase_date, delivery_date,
            created_by, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id`, 
          [
            baseId, assetTypeId, quantity, unitCost, finalTotalCost,
            vendor, purchase_date, delivery_date,
            req.user.id, notes
          ]
        );

        const purchaseId = purchaseInsertResult.rows[0].id;

        // Update or create asset balance (PostgreSQL upsert)
        await client.query(
          `INSERT INTO asset_balances (base_id, asset_type_id, current_balance, available_quantity)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (base_id, asset_type_id)
           DO UPDATE SET
             current_balance = asset_balances.current_balance + EXCLUDED.current_balance,
             available_quantity = asset_balances.available_quantity + EXCLUDED.available_quantity,
             last_updated = CURRENT_TIMESTAMP`,
          [baseId, assetTypeId, quantity, quantity]
        );

        return { id: purchaseId };
      });

      logger.info('Purchase created successfully', {
        purchaseId: result.id,
        baseId,
        assetTypeId,
        quantity,
        totalCost: finalTotalCost,
        createdBy: req.user.id,
        createdByUsername: req.user.username
      });

      // Get the complete purchase data for response
      const completePurchaseResult = await query(
        `SELECT 
          p.*,
          b.name as base_name,
          at.name as asset_type_name,
          u.username as created_by_username
         FROM purchases p
         JOIN bases b ON p.base_id = b.id
         JOIN asset_types at ON p.asset_type_id = at.id
         JOIN users u ON p.created_by = u.id
         WHERE p.id = $1`,
        [result.id]
      );

      res.status(201).json({
        message: 'Purchase created successfully',
        purchase: completePurchaseResult.rows[0]
      });

    } catch (error) {
      logger.error('Create purchase error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        requestBody: req.body
      });

      res.status(500).json({
        error: 'Failed to create purchase',
        message: 'Internal server error while creating purchase'
      });
    }
  }
);

// GET /api/purchases/:id
router.get('/:id',
  authenticateToken,
  authorize('admin', 'base_commander', 'logistics_officer'),
  async (req, res) => {
    try {
      const purchaseId = req.params.id;

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(purchaseId)) {
        return res.status(400).json({
          error: 'Invalid purchase ID',
          message: 'Purchase ID must be a valid UUID'
        });
      }

      // Get purchase with related data
      let purchaseQuery = `
        SELECT 
          p.*,
          b.name as base_name,
          b.name as base_code,
          at.name as asset_type_name,
          at.category as asset_category,
          u.username as created_by_username,
          u.first_name as created_by_first_name,
          u.last_name as created_by_last_name
        FROM purchases p
        JOIN bases b ON p.base_id = b.id
        JOIN asset_types at ON p.asset_type_id = at.id
        JOIN users u ON p.created_by = u.id
        WHERE p.id = $1
      `;

      let queryParams = [purchaseId];

      // Add base restriction for base commanders
      if (req.user.role === 'base_commander') {
        purchaseQuery += ' AND p.base_id = $2';
        queryParams.push(req.user.base_id);
      }

      const purchaseResult = await query(purchaseQuery, queryParams);

      if (purchaseResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Purchase not found',
          message: 'The specified purchase does not exist or you do not have access to it'
        });
      }

      res.json({
        purchase: purchaseResult.rows[0]
      });

    } catch (error) {
      logger.error('Get purchase error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        purchaseId: req.params.id
      });

      res.status(500).json({
        error: 'Failed to fetch purchase',
        message: 'Internal server error while fetching purchase'
      });
    }
  }
);

module.exports = router;
