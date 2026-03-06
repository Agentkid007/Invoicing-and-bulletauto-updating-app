'use strict';
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { body, validationResult } = require('express-validator');
const { db, uuidv4 } = require('../models/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ─── File upload setup ────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const ALLOWED_MIME = /^(image\/(jpeg|png|gif|webp)|video\/(mp4|quicktime|webm))$/;

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only images (jpg/png/gif/webp) and videos (mp4/mov/webm) are allowed'));
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Broadcast SSE helper — injected via app.locals
function broadcast(req, type, data) {
  if (req.app.locals.broadcastEvent) req.app.locals.broadcastEvent(type, data);
}

// ─── GET /api/bookings ────────────────────────────────────────────────────────
router.get('/', authMiddleware, (req, res, next) => {
  try {
    let bookings;
    if (req.user.role === 'admin') {
      bookings = db.prepare(`
        SELECT b.*, u.name AS client_name, u.email AS client_email, u.phone AS client_phone
        FROM bookings b
        LEFT JOIN users u ON u.id = b.client_id
        ORDER BY b.created_at DESC
      `).all();
    } else {
      bookings = db.prepare(`
        SELECT b.*, u.name AS client_name, u.email AS client_email, u.phone AS client_phone
        FROM bookings b
        LEFT JOIN users u ON u.id = b.client_id
        WHERE b.client_id = ?
        ORDER BY b.created_at DESC
      `).all(req.user.id);
    }
    res.json(bookings);
  } catch (err) { next(err); }
});

// ─── GET /api/bookings/:id ────────────────────────────────────────────────────
router.get('/:id', authMiddleware, (req, res, next) => {
  try {
    const booking = db.prepare(`
      SELECT b.*, u.name AS client_name, u.email AS client_email, u.phone AS client_phone
      FROM bookings b
      LEFT JOIN users u ON u.id = b.client_id
      WHERE b.id = ?
    `).get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (req.user.role !== 'admin' && booking.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const updates = db.prepare(`
      SELECT su.*, u.name AS created_by_name
      FROM service_updates su
      LEFT JOIN users u ON u.id = su.created_by
      WHERE su.booking_id = ?
      ORDER BY su.created_at DESC
    `).all(req.params.id);
    res.json({ ...booking, updates });
  } catch (err) { next(err); }
});

// ─── POST /api/bookings ───────────────────────────────────────────────────────
router.post('/', authMiddleware, [
  body('car_make').trim().notEmpty().withMessage('Car make is required'),
  body('car_model').trim().notEmpty().withMessage('Car model is required'),
  body('car_year').trim().notEmpty().withMessage('Car year is required'),
  body('car_registration').trim().notEmpty().withMessage('Car registration is required'),
  body('service_type').trim().notEmpty().withMessage('Service type is required'),
], (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { car_make, car_model, car_year, car_registration, service_type, description, drop_off_date } = req.body;
    const booking = {
      id: uuidv4(),
      client_id: req.user.id,
      car_make, car_model, car_year,
      car_registration: car_registration.toUpperCase(),
      service_type,
      description: description || '',
      status: 'pending', progress: 0,
      estimated_completion: null, mechanic_notes: '',
      drop_off_date: drop_off_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.prepare(`
      INSERT INTO bookings
        (id, client_id, car_make, car_model, car_year, car_registration, service_type, description,
         status, progress, estimated_completion, mechanic_notes, drop_off_date, created_at, updated_at)
      VALUES
        (@id, @client_id, @car_make, @car_model, @car_year, @car_registration, @service_type, @description,
         @status, @progress, @estimated_completion, @mechanic_notes, @drop_off_date, @created_at, @updated_at)
    `).run(booking);
    broadcast(req, 'booking_created', { id: booking.id });
    res.status(201).json(booking);
  } catch (err) { next(err); }
});

// ─── PATCH /api/bookings/:id ──────────────────────────────────────────────────
router.patch('/:id', authMiddleware, adminOnly, (req, res, next) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const { status, progress, estimated_completion, mechanic_notes, update_message } = req.body;
    const fields = { updated_at: new Date().toISOString() };
    if (status !== undefined) fields.status = status;
    if (progress !== undefined) fields.progress = Math.min(100, Math.max(0, Number(progress)));
    if (estimated_completion !== undefined) fields.estimated_completion = estimated_completion;
    if (mechanic_notes !== undefined) fields.mechanic_notes = mechanic_notes;

    const setClause = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE bookings SET ${setClause} WHERE id = @id`).run({ ...fields, id: req.params.id });

    if (update_message) {
      db.prepare(`
        INSERT INTO service_updates (id, booking_id, message, progress, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), booking.id, update_message,
        fields.progress !== undefined ? fields.progress : booking.progress,
        req.user.id, new Date().toISOString()
      );
    }

    const updated = db.prepare(`
      SELECT b.*, u.name AS client_name, u.email AS client_email, u.phone AS client_phone
      FROM bookings b LEFT JOIN users u ON u.id = b.client_id
      WHERE b.id = ?
    `).get(req.params.id);
    broadcast(req, 'booking_updated', { id: updated.id, client_id: updated.client_id });
    res.json(updated);
  } catch (err) { next(err); }
});

// ─── DELETE /api/bookings/:id ─────────────────────────────────────────────────
router.delete('/:id', authMiddleware, adminOnly, (req, res, next) => {
  try {
    if (!db.prepare('SELECT id FROM bookings WHERE id = ?').get(req.params.id)) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
    broadcast(req, 'booking_deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── GET /api/bookings/:id/notes ──────────────────────────────────────────────
router.get('/:id/notes', authMiddleware, (req, res, next) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (req.user.role !== 'admin' && booking.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const notes = db.prepare(
      'SELECT * FROM notes WHERE booking_id = ? ORDER BY created_at ASC'
    ).all(req.params.id);
    // Parse media JSON stored as text
    res.json(notes.map(n => ({ ...n, media: JSON.parse(n.media || '[]') })));
  } catch (err) { next(err); }
});

// ─── POST /api/bookings/:id/notes ─────────────────────────────────────────────
router.post('/:id/notes', authMiddleware, (req, res, next) => {
  upload.array('media', 10)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, (req, res, next) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (req.user.role !== 'admin' && booking.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const message = (req.body.message || '').trim();
    const files = (req.files || []).map(f => ({
      filename: f.filename,
      originalname: f.originalname,
      mimetype: f.mimetype,
      url: `/uploads/${f.filename}`,
    }));
    if (!message && files.length === 0) {
      return res.status(400).json({ error: 'A message or at least one file is required' });
    }
    const note = {
      id: uuidv4(),
      booking_id: req.params.id,
      author_id: req.user.id,
      author_name: req.user.name,
      author_role: req.user.role,
      message,
      media: JSON.stringify(files),
      created_at: new Date().toISOString(),
    };
    db.prepare(`
      INSERT INTO notes (id, booking_id, author_id, author_name, author_role, message, media, created_at)
      VALUES (@id, @booking_id, @author_id, @author_name, @author_role, @message, @media, @created_at)
    `).run(note);
    broadcast(req, 'note_added', { booking_id: req.params.id, client_id: booking.client_id });
    res.status(201).json({ ...note, media: files });
  } catch (err) { next(err); }
});

module.exports = router;
