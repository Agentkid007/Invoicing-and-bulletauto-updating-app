/**
 * BookingDetailScreen.js
 * Shows full details for a single booking.
 * Admin users can update the booking status.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../App';
import { apiFetch } from '../config/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const STATUS_COLORS = {
  pending:     { bg: '#2A2000', text: '#F5A623' },
  confirmed:   { bg: '#001A2A', text: '#3498DB' },
  in_progress: { bg: '#1A0A00', text: '#E67E22' },
  completed:   { bg: '#0A1F0A', text: '#2ECC71' },
  cancelled:   { bg: '#1F0A0A', text: '#E74C3C' },
};

function formatStatusLabel(status) {
  return (status || '').replace(/_/g, ' ');
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function BookingDetailScreen({ route }) {
  const { bookingId } = route.params;
  const { token, user } = useAuth();

  const [booking,  setBooking]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error,    setError]    = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchBooking = useCallback(async () => {
    try {
      const { ok, data } = await apiFetch(`/bookings/${bookingId}`, {}, token);
      if (ok) {
        setBooking(data);
        setError('');
      } else {
        setError(data?.error || 'Failed to load booking details.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [bookingId, token]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const updateStatus = (newStatus) => {
    Alert.alert(
      'Update Status',
      `Change status to "${formatStatusLabel(newStatus)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              const { ok, data } = await apiFetch(
                `/bookings/${bookingId}`,
                { method: 'PATCH', body: JSON.stringify({ status: newStatus }) },
                token
              );
              if (ok) {
                setBooking(prev => ({ ...prev, status: newStatus }));
              } else {
                Alert.alert('Error', data?.error || 'Failed to update status.');
              }
            } catch {
              Alert.alert('Error', 'Network error. Try again.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Booking not found.'}</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[booking.status] || { bg: '#1A1A1A', text: '#AAA' };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status badge */}
      <View style={[styles.statusBanner, { backgroundColor: statusColor.bg }]}>
        <Text style={[styles.statusLabel, { color: statusColor.text }]}>
          {formatStatusLabel(booking.status).toUpperCase()}
        </Text>
      </View>

      {/* Vehicle section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚗 Vehicle</Text>
        <DetailRow label="Registration" value={booking.vehicle_registration} />
        <DetailRow label="Make"         value={booking.vehicle_make} />
        <DetailRow label="Model"        value={booking.vehicle_model} />
        <DetailRow label="Year"         value={booking.vehicle_year?.toString()} />
        <DetailRow label="Colour"       value={booking.vehicle_colour} />
      </View>

      {/* Service section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Service</Text>
        <DetailRow label="Service Type"  value={booking.service_type} />
        <DetailRow label="Notes"         value={booking.notes} />
      </View>

      {/* Client section (admin only) */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Client</Text>
          <DetailRow label="Name"  value={booking.client_name} />
          <DetailRow label="Email" value={booking.client_email} />
          <DetailRow label="Phone" value={booking.client_phone} />
        </View>
      )}

      {/* Meta */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Details</Text>
        <DetailRow label="Booking ID" value={booking.id} />
        <DetailRow
          label="Created"
          value={new Date(booking.created_at).toLocaleString('en-ZA')}
        />
      </View>

      {/* Admin: status update buttons */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          {updating ? (
            <ActivityIndicator color="#F5A623" style={{ marginTop: 12 }} />
          ) : (
            <View style={styles.statusButtons}>
              {STATUS_OPTIONS.filter(s => s !== booking.status).map(s => {
                const c = STATUS_COLORS[s] || { bg: '#1A1A1A', text: '#AAA' };
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusBtn, { backgroundColor: c.bg, borderColor: c.text }]}
                    onPress={() => updateStatus(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.statusBtnText, { color: c.text }]}>
                      {formatStatusLabel(s)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  statusBanner: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 2,
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#222',
  },
  sectionTitle: {
    color: '#F5A623',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  rowLabel: {
    color: '#888',
    fontSize: 13,
    flex: 1,
  },
  rowValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
