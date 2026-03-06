import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api.js';

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return str;
  }
}

function formatDateTime(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return str;
  }
}

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/bookings/${id}`);
      if (data && data.id) {
        setBooking(data);
      } else {
        setError(data.message || 'Booking not found.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  if (loading) {
    return (
      <div className="app-container">
        <div className="app-bar">
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '6px 4px', fontSize: 20 }} onClick={() => navigate('/')}>←</button>
          <div className="app-bar-title">BOOKING</div>
          <div style={{ width: 40 }} />
        </div>
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="app-container">
        <div className="app-bar">
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '6px 4px', fontSize: 20 }} onClick={() => navigate('/')}>←</button>
          <div className="app-bar-title">BOOKING</div>
          <div style={{ width: 40 }} />
        </div>
        <div className="page-content">
          <div className="alert alert-error">{error || 'Booking not found.'}</div>
          <button className="btn btn-outline" onClick={() => navigate('/')}>← Back to Home</button>
        </div>
      </div>
    );
  }

  const updates = booking.updates || [];

  return (
    <div className="app-container">
      {/* App Bar */}
      <div className="app-bar">
        <button
          className="btn btn-ghost"
          style={{ width: 'auto', padding: '6px 4px', fontSize: 20 }}
          onClick={() => navigate('/')}
        >
          ←
        </button>
        <div className="app-bar-title">BOOKING</div>
        <div style={{ width: 40 }} />
      </div>

      <div className="page-content">
        {/* Car Header */}
        <div className="car-header">
          <div className="car-make-model">
            {booking.car_make} {booking.car_model}
          </div>
          <div className="car-reg">
            {booking.car_year} · {booking.car_registration}
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge badge-${booking.status}`}>
              {STATUS_LABEL[booking.status] || booking.status}
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              🔧 {booking.service_type}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Progress</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#25d366' }}>{booking.progress || 0}%</span>
          </div>
          <div className="progress-track" style={{ height: 10 }}>
            <div className="progress-fill" style={{ width: `${booking.progress || 0}%` }} />
          </div>
        </div>

        {/* Booking Details */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Booking Details</div>

          <div className="info-row">
            <span className="info-label">Status</span>
            <span className={`badge badge-${booking.status}`}>{STATUS_LABEL[booking.status] || booking.status}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Drop-off Date</span>
            <span className="info-value">{formatDate(booking.drop_off_date)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Est. Completion</span>
            <span className="info-value">{formatDate(booking.estimated_completion)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Booked On</span>
            <span className="info-value">{formatDate(booking.created_at)}</span>
          </div>
          {booking.description ? (
            <div className="info-row">
              <span className="info-label">Description</span>
              <span className="info-value" style={{ maxWidth: '60%' }}>{booking.description}</span>
            </div>
          ) : null}
          {booking.mechanic_notes ? (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(57,73,171,0.1)', borderRadius: 10, border: '1px solid rgba(57,73,171,0.3)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                Mechanic Notes
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                {booking.mechanic_notes}
              </div>
            </div>
          ) : null}
        </div>

        {/* Updates Timeline */}
        <div className="section-header">
          <span className="section-title">Updates</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{updates.length} entries</span>
        </div>

        {updates.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 20px' }}>
            <div className="empty-state-icon" style={{ fontSize: 36 }}>📋</div>
            <div className="empty-state-title" style={{ fontSize: 15 }}>No updates yet</div>
            <div className="empty-state-text">Check back later for service updates.</div>
          </div>
        ) : (
          <div className="timeline">
            {updates.map((upd, idx) => (
              <div className="timeline-item" key={upd.id || idx}>
                <div className="timeline-dot" />
                <div className="timeline-time">{formatDateTime(upd.created_at)}</div>
                <div className="timeline-message">{upd.message}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                  {upd.created_by_name && (
                    <div className="timeline-author">by {upd.created_by_name}</div>
                  )}
                  {upd.progress != null && (
                    <div style={{ fontSize: 11, color: '#25d366' }}>↑ {upd.progress}%</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 16 }} />
        <button className="btn btn-outline" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
