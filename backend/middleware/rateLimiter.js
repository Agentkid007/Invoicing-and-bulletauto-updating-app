'use strict';
const rateLimit = require('express-rate-limit');

/** Standard API rate limiter — 120 requests per minute per IP */
const apiLimiter = rateLimit({
  windowMs:       60 * 1000,
  max:            120,
  standardHeaders: true,
  legacyHeaders:  false,
});

/** Stricter limiter for auth routes — 30 requests per 15 minutes per IP */
const authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            30,
  standardHeaders: true,
  legacyHeaders:  false,
});

module.exports = { apiLimiter, authLimiter };
