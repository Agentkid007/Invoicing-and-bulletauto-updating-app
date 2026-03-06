const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, uuidv4, SERVICE_TYPES } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'bulletauto-secret-key-2024-xK9mP';

app.use(cors());
app.use(express.json());

// ─── SSE Live Updates ─────────────────────────────────────────────────────────

const sseClients = new Set();

function broadcastEvent(type, data) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch { sseClients.delete(res); }
  }
}

app.get('/api/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write(': connected\n\n');
  sseClients.add(res);
  const keepAlive = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* ignore */ }
  }, 25000);
  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

// ─── Auth Middleware ─────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  const exists = db.get('users').find({ email }).value();
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const user = {
    id: uuidv4(),
    name,
    email,
    phone: phone || '',
    password_hash: bcrypt.hashSync(password, 10),
    role: 'client',
    created_at: new Date().toISOString(),
  };
  db.get('users').push(user).write();

  const { password_hash, ...safeUser } = user;
  const token = jwt.sign({ id: user.id, email, role: 'client', name }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: safeUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = db.get('users').find({ email }).value();
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const { password_hash, ...safeUser } = user;
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: safeUser });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.get('users').find({ id: req.user.id }).value();
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password_hash, ...safeUser } = user;
  res.json(safeUser);
});

// ─── Service Types ────────────────────────────────────────────────────────────

app.get('/api/service-types', (_req, res) => res.json(SERVICE_TYPES));

// ─── Bookings ─────────────────────────────────────────────────────────────────

app.get('/api/bookings', authMiddleware, (req, res) => {
  const users = db.get('users').value();
  let bookings = db.get('bookings').value();
  if (req.user.role !== 'admin') {
    bookings = bookings.filter(b => b.client_id === req.user.id);
  }
  bookings = bookings.map(b => {
    const client = users.find(u => u.id === b.client_id);
    return { ...b, client_name: client?.name || 'Unknown', client_email: client?.email || '', client_phone: client?.phone || '' };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(bookings);
});

app.get('/api/bookings/:id', authMiddleware, (req, res) => {
  const booking = db.get('bookings').find({ id: req.params.id }).value();
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (req.user.role !== 'admin' && booking.client_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const client = db.get('users').find({ id: booking.client_id }).value();
  const updates = db.get('service_updates')
    .filter({ booking_id: booking.id })
    .value()
    .map(u => {
      const creator = db.get('users').find({ id: u.created_by }).value();
      return { ...u, created_by_name: creator?.name || 'Admin' };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ ...booking, client_name: client?.name || 'Unknown', client_email: client?.email || '', client_phone: client?.phone || '', updates });
});

app.post('/api/bookings', authMiddleware, (req, res) => {
  const { car_make, car_model, car_year, car_registration, service_type, description, drop_off_date } = req.body;
  if (!car_make || !car_model || !car_year || !car_registration || !service_type) {
    return res.status(400).json({ error: 'Car details and service type are required' });
  }
  const booking = {
    id: uuidv4(),
    client_id: req.user.id,
    car_make, car_model, car_year,
    car_registration: car_registration.toUpperCase(),
    service_type, description: description || '',
    status: 'pending', progress: 0,
    estimated_completion: null, mechanic_notes: '',
    drop_off_date: drop_off_date || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.get('bookings').push(booking).write();
  broadcastEvent('booking_created', { id: booking.id });
  res.status(201).json(booking);
});

app.patch('/api/bookings/:id', authMiddleware, adminOnly, (req, res) => {
  const booking = db.get('bookings').find({ id: req.params.id }).value();
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const { status, progress, estimated_completion, mechanic_notes, update_message } = req.body;
  const patch = { updated_at: new Date().toISOString() };
  if (status !== undefined) patch.status = status;
  if (progress !== undefined) patch.progress = Math.min(100, Math.max(0, Number(progress)));
  if (estimated_completion !== undefined) patch.estimated_completion = estimated_completion;
  if (mechanic_notes !== undefined) patch.mechanic_notes = mechanic_notes;
  db.get('bookings').find({ id: req.params.id }).assign(patch).write();
  if (update_message) {
    db.get('service_updates').push({
      id: uuidv4(), booking_id: booking.id, message: update_message,
      progress: patch.progress !== undefined ? patch.progress : booking.progress,
      created_by: req.user.id, created_at: new Date().toISOString(),
    }).write();
  }
  const updated = db.get('bookings').find({ id: req.params.id }).value();
  const client = db.get('users').find({ id: updated.client_id }).value();
  broadcastEvent('booking_updated', { id: updated.id, client_id: updated.client_id });
  res.json({ ...updated, client_name: client?.name || 'Unknown', client_email: client?.email || '', client_phone: client?.phone || '' });
});

app.delete('/api/bookings/:id', authMiddleware, adminOnly, (req, res) => {
  if (!db.get('bookings').find({ id: req.params.id }).value()) return res.status(404).json({ error: 'Booking not found' });
  db.get('service_updates').remove({ booking_id: req.params.id }).write();
  db.get('bookings').remove({ id: req.params.id }).write();
  broadcastEvent('booking_deleted', { id: req.params.id });
  res.json({ success: true });
});

// ─── Clients (admin only) ─────────────────────────────────────────────────────

app.get('/api/clients', authMiddleware, adminOnly, (req, res) => {
  const clients = db.get('users').filter({ role: 'client' }).value()
    .map(({ password_hash, ...u }) => u)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(clients);
});

// ─── Stats (admin only) ───────────────────────────────────────────────────────

app.get('/api/stats', authMiddleware, adminOnly, (req, res) => {
  const bookings = db.get('bookings').value();
  res.json({
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    inProgress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    clients: db.get('users').filter({ role: 'client' }).value().length,
  });
});

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'BulletAuto API', version: '1.0.0' }));

app.listen(PORT, () => {
  console.log(`\n🚗 BulletAuto API running on http://localhost:${PORT}`);
  console.log(`   Admin: admin@bulletauto.co.za / BulletAdmin2024!\n`);
});

module.exports = app;
