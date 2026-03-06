'use strict';
/**
 * routes/invoices.js
 * Handles CRUD for Cost Estimate / Invoices and Excel export.
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const { db, uuidv4 } = require('../models/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { generateInvoiceExcel } = require('../services/excelService');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
router.use(apiLimiter);

// ─── Helper: build full invoice object from DB ────────────────────────────────
function buildInvoice(row) {
  if (!row) return null;
  const items = db.prepare(
    'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order, rowid'
  ).all(row.id);
  return {
    ...row,
    payment: {
      eft:   !!row.payment_eft,
      cash:  !!row.payment_cash,
      card:  !!row.payment_card,
      rcs:   !!row.payment_rcs,
      fleet: !!row.payment_fleet,
    },
    customer: {
      name:    row.customer_name,
      att:     row.customer_att,
      phone:   row.customer_phone,
      email:   row.customer_email,
      vat_no:  row.customer_vat,
      address: row.customer_address,
    },
    vehicle: {
      make:      row.vehicle_make,
      model:     row.vehicle_model,
      reg_no:    row.vehicle_reg,
      vin_no:    row.vehicle_vin,
      engine_no: row.vehicle_engine,
      odometer:  row.vehicle_odometer,
    },
    checks: {
      brakes:          !!row.check_brakes,
      vbelts:          !!row.check_vbelts,
      wheel_bearings:  !!row.check_wheel_bearings,
      cooling:         !!row.check_cooling,
      oil_levels:      !!row.check_oil_levels,
      lights:          !!row.check_lights,
      hand_brake:      !!row.check_hand_brake,
      tyres:           !!row.check_tyres,
      shocks:          !!row.check_shocks,
      wipers:          !!row.check_wipers,
      water_oil_leaks: !!row.check_water_oil_leaks,
    },
    totals: {
      subtotal:   row.subtotal,
      vat_rate:   row.vat_rate,
      vat_amount: row.vat_amount,
      total:      row.total,
    },
    items,
  };
}

// ─── Generate next quote number ───────────────────────────────────────────────
function nextQuoteNo() {
  const last = db.prepare(
    "SELECT quote_no FROM invoices ORDER BY rowid DESC LIMIT 1"
  ).get();
  if (!last) return 'Q001';
  const match = last.quote_no.match(/Q(\d+)/);
  if (!match) return 'Q001';
  return 'Q' + String(Number(match[1]) + 1).padStart(3, '0');
}

// ─── GET /api/invoices ────────────────────────────────────────────────────────
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const rows = req.user.role === 'admin'
      ? db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all()
      : db.prepare(`
          SELECT i.* FROM invoices i
          JOIN bookings b ON b.id = i.booking_id
          WHERE b.client_id = ?
          ORDER BY i.created_at DESC
        `).all(req.user.id);
    res.json(rows.map(buildInvoice));
  } catch (err) { next(err); }
});

// ─── GET /api/invoices/:id ────────────────────────────────────────────────────
router.get('/:id', authMiddleware, (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    res.json(buildInvoice(row));
  } catch (err) { next(err); }
});

// ─── POST /api/invoices ───────────────────────────────────────────────────────
router.post('/', authMiddleware, adminOnly, [
  body('customer_name').optional().trim(),
  body('items').optional().isArray(),
], (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const b = req.body;
    // Auto-calculate totals
    const items = Array.isArray(b.items) ? b.items : [];
    const subtotal = items.reduce((s, it) => s + (Number(it.nett_price) || Number(it.qty || 1) * Number(it.unit_price || 0)), 0);
    const vat_rate = Number(b.vat_rate ?? 15);
    const vat_amount = Math.round(subtotal * vat_rate / 100 * 100) / 100;
    const total = subtotal + vat_amount;

    const id = uuidv4();
    const quote_no = b.quote_no || nextQuoteNo();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO invoices (
        id, booking_id, quote_no, date, in_date, out_date,
        customer_name, customer_att, customer_phone, customer_email, customer_vat, customer_address,
        vehicle_make, vehicle_model, vehicle_reg, vehicle_vin, vehicle_engine, vehicle_odometer,
        payment_eft, payment_cash, payment_card, payment_rcs, payment_fleet,
        job_description, notes,
        check_brakes, check_vbelts, check_wheel_bearings, check_cooling,
        check_oil_levels, check_lights, check_hand_brake, check_tyres,
        check_shocks, check_wipers, check_water_oil_leaks,
        subtotal, vat_rate, vat_amount, total, status, created_at, updated_at
      ) VALUES (
        @id, @booking_id, @quote_no, @date, @in_date, @out_date,
        @customer_name, @customer_att, @customer_phone, @customer_email, @customer_vat, @customer_address,
        @vehicle_make, @vehicle_model, @vehicle_reg, @vehicle_vin, @vehicle_engine, @vehicle_odometer,
        @payment_eft, @payment_cash, @payment_card, @payment_rcs, @payment_fleet,
        @job_description, @notes,
        @check_brakes, @check_vbelts, @check_wheel_bearings, @check_cooling,
        @check_oil_levels, @check_lights, @check_hand_brake, @check_tyres,
        @check_shocks, @check_wipers, @check_water_oil_leaks,
        @subtotal, @vat_rate, @vat_amount, @total, @status, @created_at, @updated_at
      )
    `).run({
      id,
      booking_id:       b.booking_id         || null,
      quote_no,
      date:             b.date               || now.slice(0, 10),
      in_date:          b.in_date            || '',
      out_date:         b.out_date           || '',
      customer_name:    b.customer_name      || '',
      customer_att:     b.customer_att       || '',
      customer_phone:   b.customer_phone     || '',
      customer_email:   b.customer_email     || '',
      customer_vat:     b.customer_vat       || '',
      customer_address: b.customer_address   || '',
      vehicle_make:     b.vehicle_make       || '',
      vehicle_model:    b.vehicle_model      || '',
      vehicle_reg:      b.vehicle_reg        || '',
      vehicle_vin:      b.vehicle_vin        || '',
      vehicle_engine:   b.vehicle_engine     || '',
      vehicle_odometer: b.vehicle_odometer   || '',
      payment_eft:      b.payment_eft  ? 1 : 1,
      payment_cash:     b.payment_cash ? 1 : 0,
      payment_card:     b.payment_card ? 1 : 0,
      payment_rcs:      b.payment_rcs  ? 1 : 0,
      payment_fleet:    b.payment_fleet? 1 : 0,
      job_description:  b.job_description    || 'Service',
      notes:            b.notes             || '',
      check_brakes:           b.check_brakes           ? 1 : 0,
      check_vbelts:           b.check_vbelts           ? 1 : 0,
      check_wheel_bearings:   b.check_wheel_bearings   ? 1 : 0,
      check_cooling:          b.check_cooling          ? 1 : 0,
      check_oil_levels:       b.check_oil_levels       ? 1 : 0,
      check_lights:           b.check_lights           ? 1 : 0,
      check_hand_brake:       b.check_hand_brake       ? 1 : 0,
      check_tyres:            b.check_tyres            ? 1 : 0,
      check_shocks:           b.check_shocks           ? 1 : 0,
      check_wipers:           b.check_wipers           ? 1 : 0,
      check_water_oil_leaks:  b.check_water_oil_leaks  ? 1 : 0,
      subtotal, vat_rate, vat_amount, total,
      status:     b.status    || 'draft',
      created_at: now,
      updated_at: now,
    });

    // Insert line items
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (id, invoice_id, description, qty, unit_price, nett_price, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    items.forEach((it, idx) => {
      const np = Number(it.nett_price) || (Number(it.qty || 1) * Number(it.unit_price || 0));
      insertItem.run(uuidv4(), id, it.description || '', Number(it.qty || 1), Number(it.unit_price || 0), np, idx);
    });

    const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    res.status(201).json(buildInvoice(row));
  } catch (err) { next(err); }
});

// ─── PATCH /api/invoices/:id ──────────────────────────────────────────────────
router.patch('/:id', authMiddleware, adminOnly, (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });

    const b = req.body;
    const now = new Date().toISOString();

    // Recalculate totals if items provided
    let subtotal = existing.subtotal;
    let vat_rate  = existing.vat_rate;
    let vat_amount = existing.vat_amount;
    let total = existing.total;

    if (Array.isArray(b.items)) {
      subtotal   = b.items.reduce((s, it) => s + (Number(it.nett_price) || Number(it.qty || 1) * Number(it.unit_price || 0)), 0);
      vat_rate   = Number(b.vat_rate ?? existing.vat_rate ?? 15);
      vat_amount = Math.round(subtotal * vat_rate / 100 * 100) / 100;
      total      = subtotal + vat_amount;
    }

    db.prepare(`
      UPDATE invoices SET
        booking_id=@booking_id, quote_no=@quote_no, date=@date, in_date=@in_date, out_date=@out_date,
        customer_name=@customer_name, customer_att=@customer_att, customer_phone=@customer_phone,
        customer_email=@customer_email, customer_vat=@customer_vat, customer_address=@customer_address,
        vehicle_make=@vehicle_make, vehicle_model=@vehicle_model, vehicle_reg=@vehicle_reg,
        vehicle_vin=@vehicle_vin, vehicle_engine=@vehicle_engine, vehicle_odometer=@vehicle_odometer,
        payment_eft=@payment_eft, payment_cash=@payment_cash, payment_card=@payment_card,
        payment_rcs=@payment_rcs, payment_fleet=@payment_fleet,
        job_description=@job_description, notes=@notes,
        check_brakes=@check_brakes, check_vbelts=@check_vbelts, check_wheel_bearings=@check_wheel_bearings,
        check_cooling=@check_cooling, check_oil_levels=@check_oil_levels, check_lights=@check_lights,
        check_hand_brake=@check_hand_brake, check_tyres=@check_tyres, check_shocks=@check_shocks,
        check_wipers=@check_wipers, check_water_oil_leaks=@check_water_oil_leaks,
        subtotal=@subtotal, vat_rate=@vat_rate, vat_amount=@vat_amount, total=@total,
        status=@status, updated_at=@updated_at
      WHERE id = @id
    `).run({
      id: req.params.id,
      booking_id:       b.booking_id         ?? existing.booking_id,
      quote_no:         b.quote_no           ?? existing.quote_no,
      date:             b.date               ?? existing.date,
      in_date:          b.in_date            ?? existing.in_date,
      out_date:         b.out_date           ?? existing.out_date,
      customer_name:    b.customer_name      ?? existing.customer_name,
      customer_att:     b.customer_att       ?? existing.customer_att,
      customer_phone:   b.customer_phone     ?? existing.customer_phone,
      customer_email:   b.customer_email     ?? existing.customer_email,
      customer_vat:     b.customer_vat       ?? existing.customer_vat,
      customer_address: b.customer_address   ?? existing.customer_address,
      vehicle_make:     b.vehicle_make       ?? existing.vehicle_make,
      vehicle_model:    b.vehicle_model      ?? existing.vehicle_model,
      vehicle_reg:      b.vehicle_reg        ?? existing.vehicle_reg,
      vehicle_vin:      b.vehicle_vin        ?? existing.vehicle_vin,
      vehicle_engine:   b.vehicle_engine     ?? existing.vehicle_engine,
      vehicle_odometer: b.vehicle_odometer   ?? existing.vehicle_odometer,
      payment_eft:      b.payment_eft  !== undefined ? (b.payment_eft  ? 1 : 0) : existing.payment_eft,
      payment_cash:     b.payment_cash !== undefined ? (b.payment_cash ? 1 : 0) : existing.payment_cash,
      payment_card:     b.payment_card !== undefined ? (b.payment_card ? 1 : 0) : existing.payment_card,
      payment_rcs:      b.payment_rcs  !== undefined ? (b.payment_rcs  ? 1 : 0) : existing.payment_rcs,
      payment_fleet:    b.payment_fleet!== undefined ? (b.payment_fleet? 1 : 0) : existing.payment_fleet,
      job_description:  b.job_description    ?? existing.job_description,
      notes:            b.notes             ?? existing.notes,
      check_brakes:          b.check_brakes          !== undefined ? (b.check_brakes          ? 1:0) : existing.check_brakes,
      check_vbelts:          b.check_vbelts          !== undefined ? (b.check_vbelts          ? 1:0) : existing.check_vbelts,
      check_wheel_bearings:  b.check_wheel_bearings  !== undefined ? (b.check_wheel_bearings  ? 1:0) : existing.check_wheel_bearings,
      check_cooling:         b.check_cooling         !== undefined ? (b.check_cooling         ? 1:0) : existing.check_cooling,
      check_oil_levels:      b.check_oil_levels      !== undefined ? (b.check_oil_levels      ? 1:0) : existing.check_oil_levels,
      check_lights:          b.check_lights          !== undefined ? (b.check_lights          ? 1:0) : existing.check_lights,
      check_hand_brake:      b.check_hand_brake      !== undefined ? (b.check_hand_brake      ? 1:0) : existing.check_hand_brake,
      check_tyres:           b.check_tyres           !== undefined ? (b.check_tyres           ? 1:0) : existing.check_tyres,
      check_shocks:          b.check_shocks          !== undefined ? (b.check_shocks          ? 1:0) : existing.check_shocks,
      check_wipers:          b.check_wipers          !== undefined ? (b.check_wipers          ? 1:0) : existing.check_wipers,
      check_water_oil_leaks: b.check_water_oil_leaks !== undefined ? (b.check_water_oil_leaks ? 1:0) : existing.check_water_oil_leaks,
      subtotal, vat_rate, vat_amount, total,
      status:     b.status ?? existing.status,
      updated_at: now,
    });

    // Replace items if provided
    if (Array.isArray(b.items)) {
      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);
      const insertItem = db.prepare(`
        INSERT INTO invoice_items (id, invoice_id, description, qty, unit_price, nett_price, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      b.items.forEach((it, idx) => {
        const np = Number(it.nett_price) || (Number(it.qty || 1) * Number(it.unit_price || 0));
        insertItem.run(uuidv4(), req.params.id, it.description || '', Number(it.qty || 1), Number(it.unit_price || 0), np, idx);
      });
    }

    const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    res.json(buildInvoice(updated));
  } catch (err) { next(err); }
});

// ─── DELETE /api/invoices/:id ─────────────────────────────────────────────────
router.delete('/:id', authMiddleware, adminOnly, (req, res, next) => {
  try {
    if (!db.prepare('SELECT id FROM invoices WHERE id = ?').get(req.params.id)) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── GET /api/invoices/:id/excel  — download as Excel spreadsheet ─────────────
router.get('/:id/excel', authMiddleware, async (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });

    const invoice = buildInvoice(row);
    const wb = await generateInvoiceExcel(invoice);
    const filename = `CostEstimate_${invoice.quote_no || invoice.id}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

// ─── POST /api/invoices/preview-excel  — generate from raw body (no DB save) ──
router.post('/preview-excel', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const wb = await generateInvoiceExcel(req.body);
    const quoteNo = req.body.quote_no || 'preview';
    const filename = `CostEstimate_${quoteNo}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

module.exports = router;
