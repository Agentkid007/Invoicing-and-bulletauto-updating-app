import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api.js';

export default function NewBooking() {
  const navigate = useNavigate();
  const [serviceTypes, setServiceTypes] = useState([]);
  const [form, setForm] = useState({
    car_make: '',
    car_model: '',
    car_year: '',
    car_registration: '',
    service_type: '',
    description: '',
    drop_off_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/service-types').then(data => {
      if (Array.isArray(data)) {
        setServiceTypes(data);
        setForm(f => ({ ...f, service_type: data[0] || '' }));
      }
    }).catch(() => {});
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: name === 'car_registration' ? value.toUpperCase() : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      car_make: form.car_make.trim(),
      car_model: form.car_model.trim(),
      car_year: parseInt(form.car_year, 10),
      car_registration: form.car_registration.trim(),
      service_type: form.service_type,
    };
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.drop_off_date) payload.drop_off_date = form.drop_off_date;

    try {
      const data = await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data.id) {
        navigate(`/bookings/${data.id}`);
      } else {
        setError(data.message || data.error || 'Could not create booking.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const currentYear = new Date().getFullYear();

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
        <div className="app-bar-title">NEW BOOKING</div>
        <div style={{ width: 40 }} />
      </div>

      <div className="page-content" style={{ paddingBottom: 24 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Car Details */}
          <div style={{ marginBottom: 8, fontFamily: 'Orbitron, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Vehicle Details
          </div>
          <div className="divider" style={{ marginTop: 0 }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Make</label>
              <input
                className="form-input"
                name="car_make"
                value={form.car_make}
                onChange={handleChange}
                placeholder="Toyota"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input
                className="form-input"
                name="car_model"
                value={form.car_model}
                onChange={handleChange}
                placeholder="Corolla"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Year</label>
              <input
                className="form-input"
                type="number"
                name="car_year"
                value={form.car_year}
                onChange={handleChange}
                placeholder={String(currentYear)}
                min="1900"
                max={currentYear + 2}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Registration</label>
              <input
                className="form-input"
                name="car_registration"
                value={form.car_registration}
                onChange={handleChange}
                placeholder="CA 123 456"
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Service Details */}
          <div style={{ marginBottom: 8, marginTop: 8, fontFamily: 'Orbitron, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Service Details
          </div>
          <div className="divider" style={{ marginTop: 0 }} />

          <div className="form-group">
            <label className="form-label">Service Type</label>
            <select
              className="form-select"
              name="service_type"
              value={form.service_type}
              onChange={handleChange}
              required
            >
              {serviceTypes.length === 0 && (
                <option value="">Loading…</option>
              )}
              {serviceTypes.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Drop-off Date (optional)</label>
            <input
              className="form-input"
              type="date"
              name="drop_off_date"
              value={form.drop_off_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Any additional details about the issue…"
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading || serviceTypes.length === 0}>
            {loading ? 'Submitting…' : '🚀 Submit Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
