/**
 * DashboardScreen.js
 * Lists all bookings (admin sees all; client sees own bookings).
 * Pull-to-refresh. Clients can create a new booking.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../App';
import { apiFetch } from '../config/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:     { bg: '#2A2000', text: '#F5A623', label: 'Pending'     },
  confirmed:   { bg: '#001A2A', text: '#3498DB', label: 'Confirmed'   },
  in_progress: { bg: '#1A0A00', text: '#E67E22', label: 'In Progress' },
  completed:   { bg: '#0A1F0A', text: '#2ECC71', label: 'Completed'   },
  cancelled:   { bg: '#1F0A0A', text: '#E74C3C', label: 'Cancelled'   },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#1A1A1A', text: '#AAA', label: status };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

function BookingCard({ booking, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardVehicle} numberOfLines={1}>
          {booking.vehicle_registration || 'No Reg'}
          {booking.vehicle_make ? ` · ${booking.vehicle_make}` : ''}
          {booking.vehicle_model ? ` ${booking.vehicle_model}` : ''}
        </Text>
        <StatusBadge status={booking.status} />
      </View>
      <Text style={styles.cardService} numberOfLines={1}>
        {booking.service_type || 'General Service'}
      </Text>
      {booking.client_name ? (
        <Text style={styles.cardMeta}>👤 {booking.client_name}</Text>
      ) : null}
      <Text style={styles.cardMeta}>
        🗓 {new Date(booking.created_at).toLocaleDateString('en-ZA', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DashboardScreen({ navigation }) {
  const { token, user, logout } = useAuth();

  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchBookings = useCallback(async () => {
    try {
      const { ok, data } = await apiFetch('/bookings', {}, token);
      if (ok && Array.isArray(data)) {
        setBookings(data);
        setError('');
      } else {
        setError(data?.error || 'Failed to load bookings.');
      }
    } catch {
      setError('Network error. Check your API URL in src/config/api.js.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Refresh list every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBookings();
    }, [fetchBookings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  // Inject logout button in header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Role banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          {isAdmin ? '🔧 Admin Dashboard' : '🚗 My Bookings'}
        </Text>
        {user?.name ? <Text style={styles.bannerSub}>Hello, {user.name}</Text> : null}
      </View>

      {/* Error */}
      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Booking list */}
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
          />
        )}
        contentContainerStyle={bookings.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5A623" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No bookings yet</Text>
            {!isAdmin && (
              <Text style={styles.emptyHint}>Tap the button below to book a service.</Text>
            )}
          </View>
        }
      />

      {/* New Booking FAB (clients only) */}
      {!isAdmin && (
        <View style={styles.fabRow}>
          <TouchableOpacity
            style={[styles.fab, styles.fabSecondary]}
            onPress={() => navigation.navigate('Invoices')}
            activeOpacity={0.85}
          >
            <Text style={styles.fabSecondaryText}>🧾 Invoices</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('NewBooking')}
            activeOpacity={0.85}
          >
            <Text style={styles.fabText}>+ New Booking</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  banner: {
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  bannerText: {
    color: '#F5A623',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bannerSub: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  errorBox: {
    margin: 16,
    backgroundColor: '#2A1010',
    borderWidth: 1,
    borderColor: '#C0392B',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 13,
  },
  list: {
    padding: 16,
    paddingBottom: 96,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardVehicle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  cardService: {
    color: '#CCC',
    fontSize: 13,
    marginBottom: 6,
  },
  cardMeta: {
    color: '#777',
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyHint: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
  },
  fab: {
    flex: 1,
    backgroundColor: '#F5A623',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabRow: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    gap: 10,
  },
  fabSecondary: {
    backgroundColor: '#1A237E',
    shadowColor: '#1A237E',
    flex: 0,
    paddingHorizontal: 18,
  },
  fabText: {
    color: '#0A0A0A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fabSecondaryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    color: '#F5A623',
    fontWeight: '600',
    fontSize: 14,
  },
});
