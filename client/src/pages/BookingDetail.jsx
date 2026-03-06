import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch, getToken } from '../api.js';
import useBookingEvents from '../useBookingEvents.js';

const API_BASE = 'http://localhost:4000/api';
const MEDIA_BASE = 'http://localhost:4000';

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
  } catch { return str; }
}

function formatDateTime(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return str; }
}

function MediaItem({ file }) {
  const url = `${MEDIA_BASE}${file.url}`;
  if (file.mimetype && file.mimetype.startsWith('video/')) {
    return (
      <video
        src={url}
        controls
        style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, marginTop: 6, background: '#000' }}
      />
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img
        src={url}
        alt={file.originalname || 'attachment'}
        style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, marginTop: 6, objectFit: 'cover' }}
      />
    </a>
  );
}

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Notes input
  const [noteText, setNoteText] = useState('');
  const [noteFiles, setNoteFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [noteError, setNoteError] = useState('');
  const fileInputRef = useRef(null);
  const notesEndRef = useRef(null);

  const fetchBooking = useCallback(async () => {
    try {
      const data = await apiFetch(`/bookings/${id}`);
      if (data && data.id) setBooking(data);
    } catch { /* ignore refresh errors */ }
  }, [id]);

  const fetchNotes = useCallback(async () => {
    try {
      const data = await apiFetch(`/bookings/${id}/notes`);
      if (Array.isArray(data)) setNotes(data);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([fetchBooking(), fetchNotes()])
      .catch(() => setError('Failed to load booking.'))
      .finally(() => setLoading(false));
  }, [fetchBooking, fetchNotes]);

  // Auto-scroll notes to bottom when new notes arrive
  useEffect(() => {
    if (notesEndRef.current) {
      notesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notes]);

  // Live updates via SSE
  useBookingEvents(useCallback((type, data) => {
    if (type === 'booking_updated' && data.id === id) fetchBooking();
    if (type === 'note_added' && data.booking_id === id) fetchNotes();
  }, [id, fetchBooking, fetchNotes]));

  async function handleSendNote(e) {
    e.preventDefault();
    if (!noteText.trim() && noteFiles.length === 0) return;
    setSending(true);
    setNoteError('');
    try {
      const token = getToken();
      const formData = new FormData();
      if (noteText.trim()) formData.append('message', noteText.trim());
      noteFiles.forEach(f => formData.append('media', f));
      const res = await fetch(`${API_BASE}/bookings/${id}/notes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.id) {
        setNoteText('');
        setNoteFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchNotes();
      } else {
        setNoteError(data.error || 'Could not send note.');
      }
    } catch {
      setNoteError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function handleFileChange(e) {
    setNoteFiles(Array.from(e.target.files));
  }

  function removeFile(index) {
    setNoteFiles(prev => prev.filter((_, i) => i !== index));
  }

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
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '6px 4px', fontSize: 20 }} onClick={() => navigate('/')}>←</button>
        <div className="app-bar-title">BOOKING</div>
        <div style={{ width: 40 }} />
      </div>

      <div className="page-content">
        {/* Car Header */}
        <div className="car-header">
          <div className="car-make-model">{booking.car_make} {booking.car_model}</div>
          <div className="car-reg">{booking.car_year} · {booking.car_registration}</div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge badge-${booking.status}`}>{STATUS_LABEL[booking.status] || booking.status}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>🔧 {booking.service_type}</span>
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
            <span className="info-value">{formatDateTime(booking.estimated_completion)}</span>
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
        </div>

        {/* Service Update Timeline */}
        {updates.length > 0 && (
          <>
            <div className="section-header">
              <span className="section-title">Service Updates</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{updates.length}</span>
            </div>
            <div className="timeline">
              {updates.map((upd, idx) => (
                <div className="timeline-item" key={upd.id || idx}>
                  <div className="timeline-dot" />
                  <div className="timeline-time">{formatDateTime(upd.created_at)}</div>
                  <div className="timeline-message">{upd.message}</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                    {upd.created_by_name && <div className="timeline-author">by {upd.created_by_name}</div>}
                    {upd.progress != null && <div style={{ fontSize: 11, color: '#25d366' }}>↑ {upd.progress}%</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Notes / Chat ───────────────────────────────────────────────── */}
        <div className="section-header" style={{ marginTop: 8 }}>
          <span className="section-title">💬 Notes</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{notes.length}</span>
        </div>

        <div className="notes-thread">
          {notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              No notes yet — start the conversation below
            </div>
          ) : (
            notes.map((note) => {
              const isMe = note.author_role === 'client';
              return (
                <div
                  key={note.id}
                  className={`note-bubble ${isMe ? 'note-mine' : 'note-theirs'}`}
                >
                  <div className="note-author">
                    {isMe ? 'You' : `🔧 ${note.author_name}`}
                    <span className="note-time">{formatDateTime(note.created_at)}</span>
                  </div>
                  {note.message && <div className="note-text">{note.message}</div>}
                  {note.media && note.media.length > 0 && (
                    <div className="note-media">
                      {note.media.map((f, i) => <MediaItem key={i} file={f} />)}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={notesEndRef} />
        </div>

        {/* Note input */}
        <form className="note-input-row" onSubmit={handleSendNote}>
          {noteError && <div className="alert alert-error" style={{ marginBottom: 8 }}>{noteError}</div>}
          {noteFiles.length > 0 && (
            <div className="note-file-previews">
              {noteFiles.map((f, i) => (
                <div key={i} className="note-file-chip">
                  <span>{f.name.length > 18 ? f.name.slice(0, 15) + '…' : f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="note-file-remove">✕</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              className="note-textarea"
              placeholder="Add a note…"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              rows={2}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendNote(e); }
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="btn btn-outline" style={{ padding: '8px 10px', cursor: 'pointer', textAlign: 'center' }} title="Attach photo/video">
                📎
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '8px 12px' }}
                disabled={sending || (!noteText.trim() && noteFiles.length === 0)}
              >
                {sending ? '…' : '➤'}
              </button>
            </div>
          </div>
        </form>

        <div style={{ height: 16 }} />
        <button className="btn btn-outline" onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    </div>
  );
}
