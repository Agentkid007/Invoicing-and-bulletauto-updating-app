'use strict';
const express = require('express');
const { db } = require('../models/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/stats  (admin only)
router.get('/', authMiddleware, adminOnly, (req, res, next) => {
  try {
    const row = db.prepare(`
      SELECT
        COUNT(*)                                          AS total,
        SUM(status = 'pending')                          AS pending,
        SUM(status = 'confirmed')                        AS confirmed,
        SUM(status = 'in_progress')                      AS inProgress,
        SUM(status = 'completed')                        AS completed,
        SUM(status = 'cancelled')                        AS cancelled
      FROM bookings
    `).get();

    const clients = db.prepare(
      "SELECT COUNT(*) AS cnt FROM users WHERE role = 'client'"
    ).get();

    const invoiceRow = db.prepare(`
      SELECT COUNT(*) AS total, COALESCE(SUM(total), 0) AS revenue FROM invoices
    `).get();

    res.json({
      total:       row.total       || 0,
      pending:     row.pending     || 0,
      confirmed:   row.confirmed   || 0,
      inProgress:  row.inProgress  || 0,
      completed:   row.completed   || 0,
      cancelled:   row.cancelled   || 0,
      clients:     clients.cnt     || 0,
      invoices:    invoiceRow.total   || 0,
      revenue:     invoiceRow.revenue || 0,
    });
  } catch (err) { next(err); }
});

module.exports = router;
