'use strict';
const express = require('express');
const { db } = require('../models/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/clients  (admin only)
router.get('/', authMiddleware, adminOnly, (req, res, next) => {
  try {
    const clients = db.prepare(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE role = 'client' ORDER BY created_at DESC"
    ).all();
    res.json(clients);
  } catch (err) { next(err); }
});

module.exports = router;
