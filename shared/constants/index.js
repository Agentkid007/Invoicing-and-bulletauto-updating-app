/**
 * shared/constants/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * App-wide constants shared between web, mobile and backend.
 */

'use strict';

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

const COMPANY = {
  name:      'Bullet Auto Performance',
  phone:     '072 345 3221',
  email:     'admin@bulletauto.co.za',
  website:   'www.bulletauto.co.za',
  address:   '7 Strand Road, Labiance Bellville, Cape Town, 7530',
  vat_no:    '4350295624',
  reg_no:    '2019/423180/07',
};

module.exports = { SERVICE_TYPES, STATUS_TYPES, COMPANY };
