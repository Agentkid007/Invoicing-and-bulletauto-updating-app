import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, clearToken, getToken } from '../api.js';
import useBookingEvents from '../useBookingEvents.js';

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function BookingCard({ booking, onClick }) {
  const { car_make, car_model, car_year, service_type, status, progress, car_registration } = booking;
  return (
    <div className="card card-clickable" onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}>
            {car_make} {car_model}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            {car_year} · {car_registration}
          </div>
        </div>
        <span className={`badge badge-${status}`}>{STATUS_LABEL[status] || status}</span>
      </div>

      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
        🔧 {service_type}
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress || 0}%` }} />
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, textAlign: 'right' }}>
        {progress || 0}% complete
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bookingsData, meData] = await Promise.all([
        apiFetch('/bookings'),
        apiFetch('/auth/me'),
      ]);
      if (Array.isArray(bookingsData)) {
        setBookings(bookingsData);
      } else {
        setError('Failed to load bookings.');
      }
      if (meData && meData.id) setUser(meData);
    } catch {
      setError('Network error. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Live updates via SSE
  useBookingEvents(useCallback((type) => {
    if (['booking_created', 'booking_updated', 'booking_deleted'].includes(type)) {
      fetchData();
    }
  }, [fetchData]));

  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  return (
    <div className="app-container">
      {/* App Bar */}
      <div className="app-bar">
        <div>
          <div className="app-bar-title">BULLETAUTO</div>
          {user && <div className="app-bar-subtitle">Welcome, {user.name}</div>}
        </div>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '6px 10px' }} onClick={handleLogout}>
          ⏻
        </button>
      </div>

      {/* Content */}
      <div className="page-content">
        <div className="section-header">
          <span className="section-title">My Vehicles</span>
          <button
            className="btn btn-ghost"
            style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }}
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? '↻ Loading…' : '↻ Refresh'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <div className="empty-state-title">No bookings yet</div>
            <div className="empty-state-text">
              Tap the + button below to book your first service
            </div>
          </div>
        ) : (
          bookings.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              onClick={() => navigate(`/bookings/${b.id}`)}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => navigate('/bookings/new')} title="New booking">
        +
      </button>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="bottom-nav-item active">
          <span className="bottom-nav-icon">🏠</span>
          Home
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/invoices')}>
          <span className="bottom-nav-icon">🧾</span>
          Invoices
        </button>
        <button className="bottom-nav-item" onClick={handleLogout}>
          <span className="bottom-nav-icon">👤</span>
          Logout
        </button>
      </nav>
    </div>
  );
}
