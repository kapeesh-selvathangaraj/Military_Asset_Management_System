const express = require('express');
const Joi = require('joi');
const { query, transaction } = require('../config/database');
const { authenticateToken, authorize, authorizeBaseAccess, auditMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const createTransferSchema = Joi.object({
  fromBaseId: Joi.string().uuid().required(),
  toBaseId: Joi.string().uuid().required(),
  assetTypeId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).required(),
  transferDate: Joi.date().required(),
  reason: Joi.string().max(500).optional(),
  trackingNumber: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional()
});

const updateTransferSchema = Joi.object({
  status: Joi.string().valid('pending', 'in_transit', 'completed', 'cancelled').required(),
  approvedBy: Joi.string().uuid().optional(),
  receivedBy: Joi.string().uuid().optional(),
  trackingNumber: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional()
});

const transferFiltersSchema = Joi.object({
  fromBaseId: Joi.string().uuid().optional(),
  toBaseId: Joi.string().uuid().optional(),
  assetTypeId: Joi.string().uuid().optional(),
  status: Joi.string().valid('pending', 'in_transit', 'completed', 'cancelled').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

// GET /api/transfers
router.get('/',
  authenticateToken,
  authorize('admin', 'base_commander', 'logistics_officer'),
  async (req, res) => {
    try {
      // Validate query parameters
      const { error, value } = transferFiltersSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.details[0].message
        });
      }

      const { fromBaseId, toBaseId, assetTypeId, status, startDate, endDate, limit, offset } = value;

      // Build WHERE clause based on user role and filters
      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramIndex = 1;

      // Role-based filtering
      if (req.user.role === 'base_commander') {
        whereConditions.push(`(t.from_base_id = $${paramIndex} OR t.to_base_id = $${paramIndex})`);
        queryParams.push(req.user.base_id);
        paramIndex++;
      } else {
        if (fromBaseId) {
          whereConditions.push(`t.from_base_id = $${paramIndex}`);
          queryParams.push(fromBaseId);
          paramIndex++;
        }
        if (toBaseId) {
          whereConditions.push(`t.to_base_id = $${paramIndex}`);
          queryParams.push(toBaseId);
          paramIndex++;
        }
      }

      // Additional filters
      if (assetTypeId) {
        whereConditions.push(`t.asset_type_id = $${paramIndex}`);
        queryParams.push(assetTypeId);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`t.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`t.transfer_date >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`t.transfer_date <= $${paramIndex}`);
        queryParams.push(endDate);
        paramIndex++;
      }

      // Add limit and offset
      queryParams.push(limit, offset);
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get transfers with related data
      const transfersQuery = `
        SELECT 
          t.id,
          t.from_base_id,
          fb.name as from_base_name,
          t.to_base_id,
          tb.name as to_base_name,
          t.asset_type_id,
          at.name as asset_type_name,
          at.category as asset_category,
          t.quantity,
          t.transfer_date,
          t.reason,
          t.status,
          t.tracking_number,
          t.notes,
          t.created_at,
          t.updated_at,
          ru.username as requested_by_username,
          ru.first_name as requested_by_first_name,
          ru.last_name as requested_by_last_name,
          au.username as approved_by_username,
          rcu.username as completed_by_username
        FROM transfers t
        JOIN bases fb ON t.from_base_id = fb.id
        JOIN bases tb ON t.to_base_id = tb.id
        JOIN asset_types at ON t.asset_type_id = at.id
        JOIN users ru ON t.requested_by = ru.id
        LEFT JOIN users au ON t.approved_by = au.id
        LEFT JOIN users rcu ON t.completed_by = rcu.id
        ${whereClause}
        ORDER BY t.created_at DESC
        ${limitClause}
      `;

      const transfersResult = await query(transfersQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM transfers t
        ${whereClause.replace(/LIMIT.*$/, '')}
      `;

      const countResult = await query(countQuery, queryParams.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        transfers: transfersResult.rows,
        pagination: {
          limit,
          offset,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: { fromBaseId, toBaseId, assetTypeId, status, startDate, endDate }
      });

    } catch (error) {
      logger.error('Get transfers error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        filters: req.query
      });

      res.status(500).json({
        error: 'Failed to fetch transfers',
        message: 'Internal server error while fetching transfers'
      });
    }
  }
);

// POST /api/transfers
router.post('/',
  authenticateToken,
  authorize('admin', 'base_commander', 'logistics_officer'),
  auditMiddleware('CREATE_TRANSFER'),
  async (req, res) => {
    try {
      // Validate input
      const { error, value } = createTransferSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.details[0].message
        });
      }

      const {
        fromBaseId,
        toBaseId,
        assetTypeId,
        quantity,
        transferDate,
        reason,
        trackingNumber,
        notes
      } = value;

      // Validate that from and to bases are different
      if (fromBaseId === toBaseId) {
        return res.status(400).json({
          error: 'Invalid transfer',
          message: 'Source and destination bases must be different'
        });
      }

      // Check if user has access to the source base
      if (req.user.role === 'base_commander' && fromBaseId !== req.user.base_id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only create transfers from your assigned base'
        });
      }

      // Verify bases and asset type exist
      const basesCheck = await query(
        'SELECT id, name FROM bases WHERE id IN ($1, $2) AND is_active = true',
        [fromBaseId, toBaseId]
      );
      if (basesCheck.rows.length !== 2) {
        return res.status(404).json({
          error: 'Base not found',
          message: 'One or both specified bases do not exist or are inactive'
        });
      }

      const assetTypeCheck = await query(
        'SELECT id, name FROM asset_types WHERE id = $1 AND is_active = true',
        [assetTypeId]
      );
      if (assetTypeCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Asset type not found',
          message: 'The specified asset type does not exist or is inactive'
        });
      }

      // Check if source base has sufficient balance
      const balanceCheck = await query(
        'SELECT current_balance FROM asset_balances WHERE base_id = $1 AND asset_type_id = $2',
        [fromBaseId, assetTypeId]
      );

      const currentBalance = balanceCheck.rows.length > 0 ? balanceCheck.rows[0].current_balance : 0;
      if (currentBalance < quantity) {
        return res.status(400).json({
          error: 'Insufficient balance',
          message: `Insufficient assets available. Current balance: ${currentBalance}, Requested: ${quantity}`
        });
      }

      // Create transfer and update balances in a transaction
      const result = await transaction(async (client) => {
        // Insert transfer record
        const transferResult = await client.query(
          `INSERT INTO transfers (
            from_base_id, to_base_id, asset_type_id, quantity, transfer_date,
            reason, tracking_number, requested_by, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *`,
          [
            fromBaseId, toBaseId, assetTypeId, quantity, transferDate,
            reason, trackingNumber, req.user.id, notes
          ]
        );

        const transfer = transferResult.rows[0];

        // Update source base balance (decrease)
        await client.query(
          `UPDATE asset_balances 
           SET current_balance = current_balance - $3,
               last_updated = CURRENT_TIMESTAMP
           WHERE base_id = $1 AND asset_type_id = $2`,
          [fromBaseId, assetTypeId, quantity]
        );

        // Update or create destination base balance (increase when completed)
        // For now, just ensure the record exists
        await client.query(
          `INSERT INTO asset_balances (base_id, asset_type_id, current_balance, available_quantity)
           VALUES ($1, $2, 0, 0)
           ON CONFLICT (base_id, asset_type_id) DO NOTHING`,
          [toBaseId, assetTypeId]
        );

        return transfer;
      });

      logger.info('Transfer created successfully', {
        transferId: result.id,
        fromBaseId,
        toBaseId,
        assetTypeId,
        quantity,
        requestedBy: req.user.id,
        requestedByUsername: req.user.username
      });

      // Get the complete transfer data for response
      const completeTransferResult = await query(
        `SELECT 
          t.*,
          fb.name as from_base_name,
          tb.name as to_base_name,
          at.name as asset_type_name,
          u.username as requested_by_username
         FROM transfers t
         JOIN bases fb ON t.from_base_id = fb.id
         JOIN bases tb ON t.to_base_id = tb.id
         JOIN asset_types at ON t.asset_type_id = at.id
         JOIN users u ON t.requested_by = u.id
         WHERE t.id = $1`,
        [result.id]
      );

      res.status(201).json({
        message: 'Transfer created successfully',
        transfer: completeTransferResult.rows[0]
      });

    } catch (error) {
      logger.error('Create transfer error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        requestBody: req.body
      });

      res.status(500).json({
        error: 'Failed to create transfer',
        message: 'Internal server error while creating transfer'
      });
    }
  }
);

// PUT /api/transfers/:id
router.put('/:id',
  authenticateToken,
  authorize('admin', 'base_commander'),
  auditMiddleware('UPDATE_TRANSFER'),
  async (req, res) => {
    try {
      const transferId = req.params.id;

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transferId)) {
        return res.status(400).json({
          error: 'Invalid transfer ID',
          message: 'Transfer ID must be a valid UUID'
        });
      }

      // Validate input
      const { error, value } = updateTransferSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.details[0].message
        });
      }

      const { status, approvedBy, receivedBy, trackingNumber, notes } = value;

      // Get current transfer
      const currentTransferResult = await query(
        'SELECT * FROM transfers WHERE id = $1',
        [transferId]
      );

      if (currentTransferResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Transfer not found',
          message: 'The specified transfer does not exist'
        });
      }

      const currentTransfer = currentTransferResult.rows[0];

      // Check access for base commanders
      if (req.user.role === 'base_commander') {
        if (currentTransfer.from_base_id !== req.user.base_id && 
            currentTransfer.to_base_id !== req.user.base_id) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You can only update transfers involving your assigned base'
          });
        }
      }

      // Update transfer and handle balance changes in a transaction
      const result = await transaction(async (client) => {
        // Update transfer record
        const updateResult = await client.query(
          `UPDATE transfers 
           SET status = $2, approved_by = $3, completed_by = $4, 
               tracking_number = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING *`,
          [transferId, status, approvedBy, receivedBy, trackingNumber, notes]
        );

        const updatedTransfer = updateResult.rows[0];

        // If status changed to completed, update destination base balance
        if (status === 'completed' && currentTransfer.status !== 'completed') {
          await client.query(
            `UPDATE asset_balances 
             SET current_balance = current_balance + $3,
                 last_updated = CURRENT_TIMESTAMP
             WHERE base_id = $1 AND asset_type_id = $2`,
            [currentTransfer.to_base_id, currentTransfer.asset_type_id, currentTransfer.quantity]
          );
        }

        // If status changed from completed to something else, reverse the destination balance
        if (currentTransfer.status === 'completed' && status !== 'completed') {
          await client.query(
            `UPDATE asset_balances 
             SET current_balance = current_balance - $3,
                 last_updated = CURRENT_TIMESTAMP
             WHERE base_id = $1 AND asset_type_id = $2`,
            [currentTransfer.to_base_id, currentTransfer.asset_type_id, currentTransfer.quantity]
          );
        }

        return updatedTransfer;
      });

      logger.info('Transfer updated successfully', {
        transferId,
        oldStatus: currentTransfer.status,
        newStatus: status,
        updatedBy: req.user.id,
        updatedByUsername: req.user.username
      });

      // Get the complete updated transfer data for response
      const completeTransferResult = await query(
        `SELECT 
          t.*, 
          fb.name as from_base_name,
          tb.name as to_base_name,
          at.name as asset_type_name,
          ru.username as requested_by_username,
          au.username as approved_by_username
         FROM transfers t
         JOIN bases fb ON t.from_base_id = fb.id
         JOIN bases tb ON t.to_base_id = tb.id
         JOIN asset_types at ON t.asset_type_id = at.id
         JOIN users ru ON t.requested_by = ru.id
         LEFT JOIN users au ON t.approved_by = au.id
         WHERE t.id = $1`,
        [transferId]
      );

      res.json({
        message: 'Transfer updated successfully',
        transfer: completeTransferResult.rows[0]
      });

    } catch (error) {
      logger.error('Update transfer error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        transferId: req.params.id,
        requestBody: req.body
      });

      res.status(500).json({
        error: 'Failed to update transfer',
        message: 'Internal server error while updating transfer'
      });
    }
  }
);

// GET /api/transfers/:id
router.get('/:id',
  authenticateToken,
  authorize('admin', 'base_commander', 'logistics_officer'),
  async (req, res) => {
    try {
      const transferId = req.params.id;

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transferId)) {
        return res.status(400).json({
          error: 'Invalid transfer ID',
          message: 'Transfer ID must be a valid UUID'
        });
      }

      // Get transfer with related data
      let transferQuery = `
        SELECT 
          t.*,
          fb.name as from_base_name,
          fb.name as from_base_code,
          tb.name as to_base_name,
          tb.name as to_base_code,
          at.name as asset_type_name,
          at.category as asset_category,
          ru.username as requested_by_username,
          ru.first_name as requested_by_first_name,
          ru.last_name as requested_by_last_name,
          au.username as approved_by_username,
          rcu.username as completed_by_username
        FROM transfers t
        JOIN bases fb ON t.from_base_id = fb.id
        JOIN bases tb ON t.to_base_id = tb.id
        JOIN asset_types at ON t.asset_type_id = at.id
        JOIN users ru ON t.requested_by = ru.id
        LEFT JOIN users au ON t.approved_by = au.id
        LEFT JOIN users rcu ON t.completed_by = rcu.id
        WHERE t.id = $1
      `;

      let queryParams = [transferId];

      // Add base restriction for base commanders
      if (req.user.role === 'base_commander') {
        transferQuery += ' AND (t.from_base_id = $2 OR t.to_base_id = $2)';
        queryParams.push(req.user.base_id);
      }

      const transferResult = await query(transferQuery, queryParams);

      if (transferResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Transfer not found',
          message: 'The specified transfer does not exist or you do not have access to it'
        });
      }

      res.json({
        transfer: transferResult.rows[0]
      });

    } catch (error) {
      logger.error('Get transfer error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        transferId: req.params.id
      });

      res.status(500).json({
        error: 'Failed to fetch transfer',
        message: 'Internal server error while fetching transfer'
      });
    }
  }
);

module.exports = router;
