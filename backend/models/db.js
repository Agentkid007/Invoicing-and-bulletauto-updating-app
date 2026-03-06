'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, '..', 'bulletauto.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema migrations ────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    phone         TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    role          TEXT DEFAULT 'client',
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id                   TEXT PRIMARY KEY,
    client_id            TEXT NOT NULL REFERENCES users(id),
    car_make             TEXT DEFAULT '',
    car_model            TEXT DEFAULT '',
    car_year             TEXT DEFAULT '',
    car_registration     TEXT DEFAULT '',
    service_type         TEXT DEFAULT '',
    description          TEXT DEFAULT '',
    status               TEXT DEFAULT 'pending',
    progress             INTEGER DEFAULT 0,
    estimated_completion TEXT,
    mechanic_notes       TEXT DEFAULT '',
    drop_off_date        TEXT,
    created_at           TEXT DEFAULT (datetime('now')),
    updated_at           TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS service_updates (
    id         TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    message    TEXT DEFAULT '',
    progress   INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notes (
    id          TEXT PRIMARY KEY,
    booking_id  TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    author_id   TEXT,
    author_name TEXT DEFAULT '',
    author_role TEXT DEFAULT 'client',
    message     TEXT DEFAULT '',
    media       TEXT DEFAULT '[]',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id                    TEXT PRIMARY KEY,
    booking_id            TEXT REFERENCES bookings(id),
    quote_no              TEXT UNIQUE,
    date                  TEXT DEFAULT (date('now')),
    in_date               TEXT DEFAULT '',
    out_date              TEXT DEFAULT '',
    customer_name         TEXT DEFAULT '',
    customer_att          TEXT DEFAULT '',
    customer_phone        TEXT DEFAULT '',
    customer_email        TEXT DEFAULT '',
    customer_vat          TEXT DEFAULT '',
    customer_address      TEXT DEFAULT '',
    vehicle_make          TEXT DEFAULT '',
    vehicle_model         TEXT DEFAULT '',
    vehicle_reg           TEXT DEFAULT '',
    vehicle_vin           TEXT DEFAULT '',
    vehicle_engine        TEXT DEFAULT '',
    vehicle_odometer      TEXT DEFAULT '',
    payment_eft           INTEGER DEFAULT 1,
    payment_cash          INTEGER DEFAULT 0,
    payment_card          INTEGER DEFAULT 0,
    payment_rcs           INTEGER DEFAULT 0,
    payment_fleet         INTEGER DEFAULT 0,
    job_description       TEXT DEFAULT 'Service',
    notes                 TEXT DEFAULT '',
    check_brakes          INTEGER DEFAULT 0,
    check_vbelts          INTEGER DEFAULT 0,
    check_wheel_bearings  INTEGER DEFAULT 0,
    check_cooling         INTEGER DEFAULT 0,
    check_oil_levels      INTEGER DEFAULT 0,
    check_lights          INTEGER DEFAULT 0,
    check_hand_brake      INTEGER DEFAULT 0,
    check_tyres           INTEGER DEFAULT 0,
    check_shocks          INTEGER DEFAULT 0,
    check_wipers          INTEGER DEFAULT 0,
    check_water_oil_leaks INTEGER DEFAULT 0,
    subtotal              REAL DEFAULT 0,
    vat_rate              REAL DEFAULT 15,
    vat_amount            REAL DEFAULT 0,
    total                 REAL DEFAULT 0,
    status                TEXT DEFAULT 'draft',
    created_at            TEXT DEFAULT (datetime('now')),
    updated_at            TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id          TEXT PRIMARY KEY,
    invoice_id  TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    qty         REAL DEFAULT 1,
    unit_price  REAL DEFAULT 0,
    nett_price  REAL DEFAULT 0,
    sort_order  INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    unit_price  REAL DEFAULT 0,
    category    TEXT DEFAULT 'part',
    active      INTEGER DEFAULT 1,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id         TEXT PRIMARY KEY,
    user_id    TEXT REFERENCES users(id),
    name       TEXT NOT NULL,
    email      TEXT DEFAULT '',
    phone      TEXT DEFAULT '',
    vat_no     TEXT DEFAULT '',
    address    TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ─── Seed admin user ──────────────────────────────────────────────────────────

const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@bulletauto.co.za');
if (!adminExists) {
  const hash = bcrypt.hashSync('BulletAdmin2024!', 10);
  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), 'BulletAuto Admin', 'admin@bulletauto.co.za', '+27000000000', hash, 'admin');
  console.log('[DB] Admin seeded: admin@bulletauto.co.za / BulletAdmin2024!');
}

// ─── Service types constant ───────────────────────────────────────────────────

const SERVICE_TYPES = [
  'Full Service',
  'Oil & Filter Change',
  'Brake Service',
  'Tyre Rotation & Balance',
  'Engine Diagnostics',
  'Transmission Service',
  'Air Conditioning Service',
  'Battery Replacement',
  'Suspension & Steering',
  'Electrical Diagnostics',
  'Car Wash & Valet',
  'Other',
];

module.exports = { db, uuidv4, SERVICE_TYPES };
