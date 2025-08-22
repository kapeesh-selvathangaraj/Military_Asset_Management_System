const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { authenticateToken, authorize, authorizeBaseAccess } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schema for dashboard filters
const dashboardFiltersSchema = Joi.object({
  baseId: Joi.string().uuid().optional(),
  assetTypeId: Joi.string().uuid().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

// GET /api/dashboard/metrics
router.get('/metrics', 
  authenticateToken,
  authorizeBaseAccess,
  async (req, res) => {
    try {
      // Validate query parameters
      const { error, value } = dashboardFiltersSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.details[0].message
        });
      }

      const { baseId, assetTypeId, startDate, endDate } = value;

      // Build WHERE clause based on user role and filters
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Role-based filtering
      if (req.user.role === 'base_commander') {
        whereConditions.push(`ab.base_id = $${paramIndex}`);
        queryParams.push(req.user.base_id);
        paramIndex++;
      } else if (baseId) {
        whereConditions.push(`ab.base_id = $${paramIndex}`);
        queryParams.push(baseId);
        paramIndex++;
      }

      // Asset type filter
      if (assetTypeId) {
        whereConditions.push(`ab.asset_type_id = $${paramIndex}`);
        queryParams.push(assetTypeId);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get asset balances with base and asset type information
      const balancesQuery = `
        SELECT 
          ab.base_id,
          b.name as base_name,
          b.code as base_code,
          ab.asset_type_id,
          at.name as asset_type_name,
          at.category as asset_category,
          ab.current_balance,
          ab.available_quantity,
          ab.reserved_quantity
        FROM asset_balances ab
        LEFT JOIN bases b ON ab.base_id = b.id
        LEFT JOIN asset_types at ON ab.asset_type_id = at.id
        ${whereClause}
        ORDER BY b.name, at.category, at.name
      `;

      const balancesResult = await query(balancesQuery, queryParams);

      // Calculate summary metrics
      const summaryMetrics = balancesResult.rows.reduce((acc, row) => {
        acc.totalCurrentBalance += row.current_balance || 0;
        return acc;
      }, {
        totalOpeningBalance: 0,
        totalCurrentBalance: 0,
        totalPurchased: 0,
        totalTransferredIn: 0,
        totalTransferredOut: 0,
        totalAssigned: 0,
        totalExpended: 0,
        totalNetMovement: 0
      });

      // Group by base for detailed view
      const baseMetrics = {};
      balancesResult.rows.forEach(row => {
        if (!baseMetrics[row.base_id]) {
          baseMetrics[row.base_id] = {
            baseId: row.base_id,
            baseName: row.base_name,
            baseCode: row.base_code,
            openingBalance: 0,
            currentBalance: 0,
            purchased: 0,
            transferredIn: 0,
            transferredOut: 0,
            assigned: 0,
            expended: 0,
            netMovement: 0,
            assetTypes: []
          };
        }

        const base = baseMetrics[row.base_id];
        base.openingBalance += row.opening_balance || 0;
        base.currentBalance += row.current_balance || 0;
        base.purchased += row.total_purchased || 0;
        base.transferredIn += row.total_transferred_in || 0;
        base.transferredOut += row.total_transferred_out || 0;
        base.assigned += row.total_assigned || 0;
        base.expended += row.total_expended || 0;
        base.netMovement += row.net_movement || 0;

        base.assetTypes.push({
          assetTypeId: row.asset_type_id,
          assetTypeName: row.asset_type_name,
          assetCategory: row.asset_category,
          openingBalance: row.opening_balance,
          currentBalance: row.current_balance,
          purchased: row.total_purchased,
          transferredIn: row.total_transferred_in,
          transferredOut: row.total_transferred_out,
          assigned: row.total_assigned,
          expended: row.total_expended,
          netMovement: row.net_movement
        });
      });

      res.json({
        summary: summaryMetrics,
        bases: Object.values(baseMetrics),
        filters: {
          baseId,
          assetTypeId,
          startDate,
          endDate
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Dashboard metrics error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        filters: req.query
      });

      res.status(500).json({
        error: 'Failed to fetch dashboard metrics',
        message: 'Internal server error while fetching dashboard data'
      });
    }
  }
);

// GET /api/dashboard/recent-activities
router.get('/recent-activities',
  authenticateToken,
  authorizeBaseAccess,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      // Build base filter for user role
      let baseFilter = '';
      let queryParams = [limit, offset];
      let paramIndex = 3;

      if (req.user.role === 'base_commander') {
        baseFilter = `AND base_id = $${paramIndex}`;
        queryParams.push(req.user.base_id);
        paramIndex++;
      } else if (req.query.baseId) {
        baseFilter = `AND base_id = $${paramIndex}`;
        queryParams.push(req.query.baseId);
        paramIndex++;
      }

      // Get recent activities from multiple tables
      const activitiesQuery = `
  SELECT * FROM (
    SELECT 
      'purchase' AS activity_type,
      p.id,
      p.created_at AS timestamp,
      p.base_id,
      b.name AS base_name,
      at.name AS asset_type_name,
      p.quantity,
      p.total_cost AS amount,
      u.username AS created_by_username,
      p.notes AS description
    FROM purchases p
    JOIN bases b ON p.base_id = b.id
    JOIN asset_types at ON p.asset_type_id = at.id
    JOIN users u ON p.created_by = u.id
    WHERE 1=1 ${baseFilter.replace('base_id', 'p.base_id')}

    UNION ALL

    SELECT 
      'transfer' AS activity_type,
      t.id,
      t.created_at AS timestamp,
      t.from_base_id AS base_id,
      fb.name AS base_name,
      at.name AS asset_type_name,
      t.quantity,
      NULL AS amount,
      u.username AS created_by_username,
      CONCAT('Transfer to ', tb.name) AS description
    FROM transfers t
    JOIN bases fb ON t.from_base_id = fb.id
    JOIN bases tb ON t.to_base_id = tb.id
    JOIN asset_types at ON t.asset_type_id = at.id
    JOIN users u ON t.requested_by = u.id
    WHERE 1=1 ${baseFilter.replace('base_id', 't.from_base_id')}

    UNION ALL

    SELECT 
      'assignment' AS activity_type,
      a.id,
      a.created_at AS timestamp,
      ast.base_id,
      b.name AS base_name,
      at.name AS asset_type_name,
      1 AS quantity,
      NULL AS amount,
      u.username AS created_by_username,
      CONCAT('Assigned to ', au.username) AS description
    FROM assignments a
    JOIN assets ast ON a.asset_id = ast.id
    JOIN bases b ON ast.base_id = b.id
    JOIN asset_types at ON ast.asset_type_id = at.id
    JOIN users u ON a.assigned_by = u.id
    JOIN users au ON a.assigned_to_user_id = au.id
    WHERE 1=1 ${baseFilter.replace('base_id', 'ast.base_id')}
  ) activities
  ORDER BY timestamp DESC
  LIMIT $1 OFFSET $2
`;

      const activitiesResult = await query(activitiesQuery, queryParams);

      res.json({
        activities: activitiesResult.rows,
        pagination: {
          limit,
          offset,
          total: activitiesResult.rows.length
        }
      });

    } catch (error) {
      logger.error('Recent activities error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Failed to fetch recent activities',
        message: 'Internal server error while fetching activities'
      });
    }
  }
);

// GET /api/dashboard/net-movement-details
router.get('/net-movement-details',
  authenticateToken,
  authorizeBaseAccess,
  async (req, res) => {
    try {
      const { baseId, assetTypeId } = req.query;

      // Build WHERE clause
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (req.user.role === 'base_commander') {
        whereConditions.push(`base_id = $${paramIndex}`);
        queryParams.push(req.user.base_id);
        paramIndex++;
      } else if (baseId) {
        whereConditions.push(`base_id = $${paramIndex}`);
        queryParams.push(baseId);
        paramIndex++;
      }

      if (assetTypeId) {
        whereConditions.push(`asset_type_id = $${paramIndex}`);
        queryParams.push(assetTypeId);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get detailed breakdown of net movements
      const detailsQuery = `
        SELECT 
          base_id,
          asset_type_id,
          total_purchased as purchases,
          total_transferred_in as transfers_in,
          total_transferred_out as transfers_out,
          (total_purchased + total_transferred_in - total_transferred_out) as net_movement
        FROM asset_balances
        ${whereClause}
      `;

      const detailsResult = await query(detailsQuery, queryParams);

      // Calculate totals
      const totals = detailsResult.rows.reduce((acc, row) => {
        acc.purchases += row.purchases || 0;
        acc.transfersIn += row.transfers_in || 0;
        acc.transfersOut += row.transfers_out || 0;
        acc.netMovement += row.net_movement || 0;
        return acc;
      }, {
        purchases: 0,
        transfersIn: 0,
        transfersOut: 0,
        netMovement: 0
      });

      res.json({
        details: detailsResult.rows,
        totals,
        filters: { baseId, assetTypeId }
      });

    } catch (error) {
      logger.error('Net movement details error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Failed to fetch net movement details',
        message: 'Internal server error while fetching movement details'
      });
    }
  }
);

module.exports = router;
