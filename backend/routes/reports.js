const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');
const { authenticateToken, authorize, authorizeBaseAccess } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/reports - Asset summary report
router.get('/',
  authenticateToken,
  authorize('admin', 'base_commander', 'logistics_officer'),
  async (req, res) => {
    try {
      const { type, startDate, endDate, baseId } = req.query;

      // Validate query parameters
      const schema = Joi.object({
        type: Joi.string().valid('asset-summary', 'purchase-report', 'transfer-report').default('asset-summary'),
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')),
        baseId: Joi.string().uuid()
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.details.map(d => d.message)
        });
      }

      const { type: reportType, startDate: start, endDate: end, baseId: base } = value;

      let reportData = {};

      switch (reportType) {
        case 'asset-summary':
          reportData = await generateAssetSummaryReport(base, start, end);
          break;
        case 'purchase-report':
          reportData = await generatePurchaseReport(base, start, end);
          break;
        case 'transfer-report':
          reportData = await generateTransferReport(base, start, end);
          break;
        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }

      res.json({
        type: reportType,
        data: reportData,
        filters: { baseId: base, startDate: start, endDate: end },
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Reports error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        query: req.query
      });

      res.status(500).json({
        error: 'Failed to generate report',
        message: 'Internal server error while generating report'
      });
    }
  }
);

// Asset Summary Report
async function generateAssetSummaryReport(baseId, startDate, endDate) {
  const whereConditions = ['1=1'];
  const queryParams = [];
  let paramIndex = 1;

  if (baseId) {
    whereConditions.push(`ab.base_id = $${paramIndex}`);
    queryParams.push(baseId);
    paramIndex++;
  }

  const summaryQuery = `
    SELECT 
      b.name as base_name,
      b.code as base_code,
      at.name as asset_type_name,
      at.category as asset_category,
      ab.current_balance,
      ab.available_quantity,
      ab.reserved_quantity
    FROM asset_balances ab
    JOIN bases b ON ab.base_id = b.id
    JOIN asset_types at ON ab.asset_type_id = at.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY b.name, at.category, at.name
  `;

  const result = await query(summaryQuery, queryParams);
  
  return {
    summary: result.rows,
    totalAssets: result.rows.reduce((sum, row) => sum + (row.current_balance || 0), 0),
    totalAvailable: result.rows.reduce((sum, row) => sum + (row.available_quantity || 0), 0),
    totalReserved: result.rows.reduce((sum, row) => sum + (row.reserved_quantity || 0), 0)
  };
}

// Purchase Report
async function generatePurchaseReport(baseId, startDate, endDate) {
  const whereConditions = ['1=1'];
  const queryParams = [];
  let paramIndex = 1;

  if (baseId) {
    whereConditions.push(`p.base_id = $${paramIndex}`);
    queryParams.push(baseId);
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

  const purchaseQuery = `
    SELECT 
      p.id,
      b.name as base_name,
      at.name as asset_type_name,
      p.quantity,
      p.unit_cost,
      p.total_cost,
      p.vendor,
      p.purchase_date,
      p.delivery_date
    FROM purchases p
    JOIN bases b ON p.base_id = b.id
    JOIN asset_types at ON p.asset_type_id = at.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY p.purchase_date DESC
  `;

  const result = await query(purchaseQuery, queryParams);
  
  return {
    purchases: result.rows,
    totalPurchases: result.rows.length,
    totalCost: result.rows.reduce((sum, row) => sum + (parseFloat(row.total_cost) || 0), 0),
    totalQuantity: result.rows.reduce((sum, row) => sum + (row.quantity || 0), 0)
  };
}

// Transfer Report
async function generateTransferReport(baseId, startDate, endDate) {
  const whereConditions = ['1=1'];
  const queryParams = [];
  let paramIndex = 1;

  if (baseId) {
    whereConditions.push(`(t.from_base_id = $${paramIndex} OR t.to_base_id = $${paramIndex})`);
    queryParams.push(baseId);
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

  const transferQuery = `
    SELECT 
      t.id,
      fb.name as from_base_name,
      tb.name as to_base_name,
      at.name as asset_type_name,
      t.quantity,
      t.transfer_date,
      t.status,
      t.reason
    FROM transfers t
    JOIN bases fb ON t.from_base_id = fb.id
    JOIN bases tb ON t.to_base_id = tb.id
    JOIN asset_types at ON t.asset_type_id = at.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY t.transfer_date DESC
  `;

  const result = await query(transferQuery, queryParams);
  
  return {
    transfers: result.rows,
    totalTransfers: result.rows.length,
    totalQuantity: result.rows.reduce((sum, row) => sum + (row.quantity || 0), 0)
  };
}

module.exports = router;
