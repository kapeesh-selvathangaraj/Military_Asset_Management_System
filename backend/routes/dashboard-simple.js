const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, authorize, auditMiddleware } = require('../middleware/auth');

// Get dashboard metrics
router.get('/metrics', 
  authenticateToken,
  auditMiddleware('dashboard_metrics'),
  async (req, res) => {
    try {
      // Build aggregated metrics using subqueries (PostgreSQL-compatible)
      const isBaseScoped = req.user.role === 'base_commander';
      const whereAB = isBaseScoped ? 'WHERE base_id = $1' : '';
      const wherePur = isBaseScoped ? 'WHERE base_id = $2' : '';
      const whereAss = isBaseScoped ? "WHERE base_id = $3 AND status = 'active'" : "WHERE status = 'active'";


      const metricsQuery = `
        SELECT
          (SELECT COALESCE(SUM(current_balance), 0) FROM asset_balances ${whereAB}) AS total_current_balance,
          (SELECT COALESCE(SUM(quantity), 0) FROM purchases ${wherePur}) AS total_purchased,
          (SELECT COALESCE(COUNT(*), 0) FROM assignments ${whereAss}) AS total_assigned,
          0 AS total_expended,
          (SELECT COALESCE(COUNT(DISTINCT base_id), 0) FROM asset_balances ${whereAB}) AS total_bases,
          (SELECT COALESCE(COUNT(DISTINCT asset_type_id), 0) FROM asset_balances ${whereAB}) AS total_asset_types
      `;

      const params = isBaseScoped 
        ? [
            req.user.base_id, // asset_balances
            req.user.base_id, // purchases
            req.user.base_id, // assignments
            req.user.base_id, // total_bases
            req.user.base_id  // total_asset_types
          ] 
        : [];

      const result = await query(metricsQuery, params);
      
      const metrics = result.rows[0] || {
        total_opening_balance: 0,
        total_current_balance: 0,
        total_purchased: 0,
        total_assigned: 0,
        total_expended: 0,
        total_bases: 0,
        total_asset_types: 0
      };

      // Calculate net movement
      metrics.net_movement = (metrics.total_purchased || 0) - (metrics.total_expended || 0);

      res.json({
        success: true,
        data: {
          closingBalance: metrics.total_current_balance || 0,
          netMovement: metrics.net_movement || 0,
          totalAssigned: metrics.total_assigned || 0,
          totalExpended: metrics.total_expended || 0,
          totalBases: metrics.total_bases || 0,
          totalAssetTypes: metrics.total_asset_types || 0
        }
      });

    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({
        error: 'Failed to fetch dashboard metrics',
        message: error.message
      });
    }
  }
);

// Get recent activities
router.get('/recent-activities',
  authenticateToken,
  auditMiddleware('dashboard_activities'),
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      // Get recent purchases count (last 30 days)
      const purchasesQuery = `
        SELECT COUNT(*) as count
        FROM purchases p
        ${req.user.role === 'base_commander' ? 'WHERE p.base_id = ? AND p.purchase_date >= CURRENT_DATE - INTERVAL \'30 days\'' : 'WHERE p.purchase_date >= CURRENT_DATE - INTERVAL \'30 days\' '}
      `;

      const params = req.user.role === 'base_commander' ? [req.user.base_id] : [];
      const result = await query(purchasesQuery, params);

      res.json({
        success: true,
        data: {
          activities: result.rows || []
        }
      });

    } catch (error) {
      console.error('Recent activities error:', error);
      res.status(500).json({
        error: 'Failed to fetch recent activities',
        message: error.message
      });
    }
  }
);

// Get asset distribution by category
router.get('/asset-distribution',
  authenticateToken,
  auditMiddleware('dashboard_distribution'),
  async (req, res) => {
    try {
      const distributionQuery = `
        SELECT 
          at.category,
          SUM(ab.current_balance) as total_assets
        FROM asset_balances ab
        JOIN asset_types at ON ab.asset_type_id = at.id
        ${req.user.role === 'base_commander' ? 'WHERE ab.base_id = ?' : ''}
        GROUP BY at.category
        ORDER BY total_assets DESC
      `;

      const params = req.user.role === 'base_commander' ? [req.user.base_id] : [];
      const result = await query(distributionQuery, params);

      res.json({
        success: true,
        data: {
          distribution: result.rows || []
        }
      });

    } catch (error) {
      console.error('Asset distribution error:', error);
      res.status(500).json({
        error: 'Failed to fetch asset distribution',
        message: error.message
      });
    }
  }
);

// Get base details
router.get('/bases/:baseId',
  authenticateToken,
  auditMiddleware('dashboard_base_details'),
  async (req, res) => {
    try {
      // Get total assets per base
      const assetsQuery = `
        SELECT 
          b.id,
          b.name,
          COALESCE(SUM(ab.current_balance), 0) as total_assets
        FROM bases b
        LEFT JOIN asset_balances ab ON b.id = ab.base_id
        ${req.user.role === 'base_commander' ? 'WHERE b.id = ?' : ''}
        GROUP BY b.id, b.name
      `;

      const params = req.user.role === 'base_commander' ? [req.user.base_id] : [];
      const result = await query(assetsQuery, params);

      res.json({
        success: true,
        data: {
          bases: result.rows || []
        }
      });

    } catch (error) {
      console.error('Base details error:', error);
      res.status(500).json({
        error: 'Failed to fetch base details',
        message: error.message
      });
    }
  }
);

module.exports = router;
