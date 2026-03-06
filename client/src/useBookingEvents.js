import { useEffect, useRef } from 'react';
import { getToken } from './api.js';

const API_BASE = 'http://localhost:4000/api';

/**
 * Subscribe to booking SSE events from the backend.
 * Calls `onEvent(type, data)` whenever the server pushes an update.
 * Automatically reconnects on connection loss.
 * Authenticates via ?token= query param (EventSource can't set headers).
 */
export default function useBookingEvents(onEvent) {
  const onEventRef = useRef(onEvent);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let es;
    let retryTimer;

    function connect() {
      es = new EventSource(`${API_BASE}/events?token=${encodeURIComponent(token)}`);

      es.addEventListener('booking_created', (e) => {
        try { onEventRef.current('booking_created', JSON.parse(e.data)); } catch { /* ignore */ }
      });
      es.addEventListener('booking_updated', (e) => {
        try { onEventRef.current('booking_updated', JSON.parse(e.data)); } catch { /* ignore */ }
      });
      es.addEventListener('booking_deleted', (e) => {
        try { onEventRef.current('booking_deleted', JSON.parse(e.data)); } catch { /* ignore */ }
      });
      es.addEventListener('note_added', (e) => {
        try { onEventRef.current('note_added', JSON.parse(e.data)); } catch { /* ignore */ }
      });

      es.onerror = () => {
        es.close();
        retryTimer = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimer);
      if (es) es.close();
    };
  }, []);
}
