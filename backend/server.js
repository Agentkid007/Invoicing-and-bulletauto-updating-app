'use strict';
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const jwt        = require('jsonwebtoken');

// ─── Models (initialises SQLite + seeds admin) ────────────────────────────────
const { SERVICE_TYPES } = require('./models/db');

// ─── Middleware ───────────────────────────────────────────────────────────────
const { JWT_SECRET }    = require('./middleware/auth');
const { errorHandler }  = require('./middleware/errorHandler');

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const bookingRoutes  = require('./routes/bookings');
const clientRoutes   = require('./routes/clients');
const statsRoutes    = require('./routes/stats');
const invoiceRoutes  = require('./routes/invoices');

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Core middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static uploads ───────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30,  standardHeaders: true, legacyHeaders: false });
const apiLimiter  = rateLimit({ windowMs: 60 * 1000,       max: 120, standardHeaders: true, legacyHeaders: false });

app.use('/api/auth',     authLimiter);
app.use('/api/events',   apiLimiter);
app.use('/api/invoices', apiLimiter);
app.use('/api/bookings', apiLimiter);
app.use('/api/clients',  apiLimiter);
app.use('/api/stats',    apiLimiter);

// ─── SSE live-update broadcast ────────────────────────────────────────────────
const sseClients = new Set();

function broadcastEvent(type, data) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch { sseClients.delete(res); }
  }
}

// Make broadcastEvent available to route handlers via app.locals
app.locals.broadcastEvent = broadcastEvent;

app.get('/api/events', (req, res) => {
  const tokenParam = req.query.token;
  if (tokenParam) {
    try { jwt.verify(tokenParam, JWT_SECRET); } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  res.set({
    'Content-Type':    'text/event-stream',
    'Cache-Control':   'no-cache',
    'Connection':      'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write(': connected\n\n');
  sseClients.add(res);
  const keepAlive = setInterval(() => {
    try { res.write(': ping\n\n'); }
    catch { clearInterval(keepAlive); sseClients.delete(res); }
  }, 25000);
  req.on('close', () => { clearInterval(keepAlive); sseClients.delete(res); });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/bookings',      bookingRoutes);
app.use('/api/clients',       clientRoutes);
app.use('/api/stats',         statsRoutes);
app.use('/api/invoices',      invoiceRoutes);

app.get('/api/service-types', (_req, res) => res.json(SERVICE_TYPES));
app.get('/api/health',        (_req, res) => res.json({ status: 'ok', service: 'BulletAuto API', version: '2.0.0' }));

// ─── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚗 BulletAuto API v2.0  →  http://localhost:${PORT}`);
    console.log(`   Admin: admin@bulletauto.co.za / BulletAdmin2024!\n`);
  });
}

module.exports = app;
