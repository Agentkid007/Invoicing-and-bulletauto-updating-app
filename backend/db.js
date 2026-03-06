const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'bulletauto.db.json');
const adapter = new FileSync(DB_PATH);
const db = low(adapter);

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

const STATUS_TYPES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

// Set defaults
db.defaults({
  users: [],
  bookings: [],
  service_updates: [],
  notes: [],
}).write();

// Seed admin account if not exists
const adminExists = db.get('users').find({ email: 'admin@bulletauto.co.za' }).value();
if (!adminExists) {
  const hash = bcrypt.hashSync('BulletAdmin2024!', 10);
  db.get('users').push({
    id: uuidv4(),
    name: 'BulletAuto Admin',
    email: 'admin@bulletauto.co.za',
    phone: '+27000000000',
    password_hash: hash,
    role: 'admin',
    created_at: new Date().toISOString(),
  }).write();
  console.log('[DB] Admin seeded: admin@bulletauto.co.za / BulletAdmin2024!');
}

module.exports = { db, uuidv4, SERVICE_TYPES, STATUS_TYPES };

