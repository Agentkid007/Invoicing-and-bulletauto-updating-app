/**
 * client/src/pages/ClientInvoices.jsx
 *
 * Client Invoice Viewer — shows all invoices for the logged-in client.
 *
 * Features
 *  • Fetches invoices from GET /api/invoices (backend filters by client_id for
 *    non-admin users automatically).
 *  • Shows invoice number, job/vehicle details, amount, status badge.
 *  • Download button opens GET /api/invoices/:id/excel (Excel file).
 *  • Print button triggers browser window.print() with an invoice-detail modal.
 *  • Fully responsive — works on mobile (max-width 480px) and wider screens.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, getToken, API_BASE } from '../api.js';

// ─── Status colours ───────────────────────────────────────────────────────────
const STATUS_STYLE = {
  draft:    { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', label: 'Draft'    },
  sent:     { background: 'rgba(33,150,243,0.15)', color: '#64b5f6',                label: 'Sent'     },
  paid:     { background: 'rgba(46,125,50,0.18)',  color: '#66bb6a',                label: 'Paid'     },
  unpaid:   { background: 'rgba(198,40,40,0.18)',  color: '#ef5350',                label: 'Unpaid'   },
  approved: { background: 'rgba(0,150,136,0.18)',  color: '#4db6ac',                label: 'Approved' },
};

function statusStyle(status) {
  return STATUS_STYLE[status] || { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', label: status || '—' };
}

function fmt(amount) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(amount) || 0);
}

// ─── Invoice Card ─────────────────────────────────────────────────────────────
function InvoiceCard({ invoice, onView }) {
  const { quote_no, status, vehicle, job_description, totals, date } = invoice;
  const s = statusStyle(status);
  const vehicleStr = [vehicle?.make, vehicle?.model, vehicle?.reg_no].filter(Boolean).join(' · ');

  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={() => onView(invoice)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 0.5 }}>
            {quote_no || 'Invoice'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {date ? new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </div>
        </div>
        <span
          style={{
            background: s.background,
            color: s.color,
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.3,
            whiteSpace: 'nowrap',
          }}
        >
          {s.label}
        </span>
      </div>

      {vehicleStr && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4 }}>
          🚗 {vehicleStr}
        </div>
      )}

      {job_description && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
          🔧 {job_description}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#64b5f6' }}>
          {fmt(totals?.total)}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          incl. {totals?.vat_rate ?? 15}% VAT
        </div>
      </div>
    </div>
  );
}

// ─── Invoice Detail Modal ─────────────────────────────────────────────────────
function InvoiceModal({ invoice, onClose }) {
  const { quote_no, status, vehicle, customer, job_description, totals, items = [], date, notes } = invoice;
  const s = statusStyle(status);

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    const token = getToken();
    // Use fetch with Authorization header to properly authenticate the download
    fetch(`${API_BASE}/invoices/${invoice.id}/excel`, {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${quote_no || invoice.id}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Could not download invoice. Please try again.'));
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, padding: 16, backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Invoice ${quote_no}`}
    >
      <div
        id="invoice-print-area"
        style={{
          background: '#12122a', border: '1px solid rgba(57,73,171,0.4)',
          borderRadius: 18, padding: '24px 20px', maxWidth: 480, width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 17, fontWeight: 700 }}>
              {quote_no || 'Invoice'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {date ? new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </div>
          </div>
          <span
            style={{
              background: s.background, color: s.color,
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            }}
          >
            {s.label}
          </span>
        </div>

        <div className="divider" />

        {/* Vehicle */}
        {vehicle && (vehicle.make || vehicle.model || vehicle.reg_no) && (
          <section style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>Vehicle</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              {[vehicle.make, vehicle.model].filter(Boolean).join(' ')}
              {vehicle.reg_no && <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 6 }}>({vehicle.reg_no})</span>}
            </div>
            {vehicle.vin_no && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>VIN: {vehicle.vin_no}</div>}
          </section>
        )}

        {/* Customer */}
        {customer?.name && (
          <section style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>Customer</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{customer.name}</div>
            {customer.phone && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{customer.phone}</div>}
          </section>
        )}

        {/* Job description */}
        {job_description && (
          <section style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>Job Description</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{job_description}</div>
          </section>
        )}

        {/* Line items */}
        {items.length > 0 && (
          <section style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Line Items</div>
            <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
              {items.map((it, i) => (
                <div
                  key={it.id || i}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    fontSize: 13,
                  }}
                >
                  <div style={{ flex: 1, color: 'rgba(255,255,255,0.8)' }}>
                    {it.description || '—'}
                    {it.qty > 1 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginLeft: 6 }}>× {it.qty}</span>}
                  </div>
                  <div style={{ color: '#64b5f6', fontWeight: 600, marginLeft: 12 }}>
                    {fmt(it.nett_price)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Totals */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            <span>Subtotal</span>
            <span>{fmt(totals?.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
            <span>VAT ({totals?.vat_rate ?? 15}%)</span>
            <span>{fmt(totals?.vat_amount)}</span>
          </div>
          <div className="divider" style={{ margin: '6px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#fff' }}>
            <span>Total</span>
            <span style={{ color: '#64b5f6' }}>{fmt(totals?.total)}</span>
          </div>
        </div>

        {notes && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14, fontStyle: 'italic' }}>
            {notes}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, fontSize: 13 }}
            onClick={handleDownload}
            title="Download invoice as Excel"
          >
            ⬇ Download
          </button>
          <button
            className="btn btn-ghost"
            style={{ flex: 1, fontSize: 13 }}
            onClick={handlePrint}
            title="Print invoice"
          >
            🖨 Print
          </button>
          <button
            className="btn btn-ghost"
            style={{ width: 44, padding: 0, fontSize: 18 }}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/invoices');
      if (Array.isArray(data)) {
        setInvoices(data);
      } else {
        setError(data?.error || 'Failed to load invoices.');
      }
    } catch {
      setError('Network error. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  return (
    <div className="app-container">
      {/* App Bar */}
      <div className="app-bar">
        <div>
          <div className="app-bar-title">INVOICES</div>
          <div className="app-bar-subtitle">Your cost estimates &amp; invoices</div>
        </div>
        <button
          className="btn btn-ghost"
          style={{ width: 'auto', padding: '6px 10px' }}
          onClick={() => navigate('/')}
          aria-label="Back to dashboard"
        >
          ←
        </button>
      </div>

      {/* Content */}
      <div className="page-content">
        <div className="section-header">
          <span className="section-title">All Invoices</span>
          <button
            className="btn btn-ghost"
            style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }}
            onClick={fetchInvoices}
            disabled={loading}
          >
            {loading ? '↻ Loading…' : '↻ Refresh'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <div className="empty-state-title">No invoices yet</div>
            <div className="empty-state-text">
              Your invoices will appear here once they are created for your bookings.
            </div>
          </div>
        ) : (
          invoices.map(inv => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              onView={setSelected}
            />
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigate('/')}>
          <span className="bottom-nav-icon">🏠</span>
          Home
        </button>
        <button className="bottom-nav-item active">
          <span className="bottom-nav-icon">🧾</span>
          Invoices
        </button>
      </nav>

      {/* Invoice Detail Modal */}
      {selected && (
        <InvoiceModal invoice={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
