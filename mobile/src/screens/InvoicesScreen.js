/**
 * mobile/src/screens/InvoicesScreen.js
 *
 * Client Invoice Viewer for BulletAuto mobile app.
 *
 * Features
 *  • Fetches invoices from GET /api/invoices (backend filters by client).
 *  • Shows invoice number, vehicle, job description, total, and status badge.
 *  • Tapping a card opens a detail modal with line items and totals.
 *  • Pull-to-refresh supported.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../App';
import { apiFetch } from '../config/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_COLOURS = {
  draft:    { bg: '#1A1A1A', text: '#999',    label: 'Draft'    },
  sent:     { bg: '#001A2A', text: '#3498DB', label: 'Sent'     },
  paid:     { bg: '#0A1F0A', text: '#2ECC71', label: 'Paid'     },
  unpaid:   { bg: '#1F0A0A', text: '#E74C3C', label: 'Unpaid'   },
  approved: { bg: '#001A18', text: '#4DB6AC', label: 'Approved' },
};

function statusStyle(status) {
  return STATUS_COLOURS[status] || { bg: '#1A1A1A', text: '#999', label: status || '—' };
}

function fmt(amount) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(amount) || 0);
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = statusStyle(status);
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

// ─── Invoice Card ─────────────────────────────────────────────────────────────
function InvoiceCard({ invoice, onPress }) {
  const { quote_no, status, vehicle, job_description, totals, date } = invoice;
  const vehicleStr = [vehicle?.make, vehicle?.model, vehicle?.reg_no].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(invoice)} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.quoteNo} numberOfLines={1}>{quote_no || 'Invoice'}</Text>
          <Text style={styles.cardDate}>{fmtDate(date)}</Text>
        </View>
        <StatusBadge status={status} />
      </View>

      {!!vehicleStr && (
        <Text style={styles.cardMeta} numberOfLines={1}>🚗 {vehicleStr}</Text>
      )}
      {!!job_description && (
        <Text style={styles.cardMeta} numberOfLines={1}>🔧 {job_description}</Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.cardTotal}>{fmt(totals?.total)}</Text>
        <Text style={styles.cardVat}>incl. {totals?.vat_rate ?? 15}% VAT</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Invoice Detail Modal ─────────────────────────────────────────────────────
function InvoiceModal({ invoice, onClose }) {
  if (!invoice) return null;
  const { quote_no, status, vehicle, customer, job_description, totals, items = [], date, notes } = invoice;

  function handleDownload() {
    // Fetch the Excel file with the Authorization header and present a share
    // dialog. expo-file-system is not available in this project, so we alert
    // the user and open the web app as a fallback.
    Alert.alert(
      'Download Invoice',
      `Invoice ${quote_no} can be downloaded from the BulletAuto web portal.`,
      [{ text: 'OK' }]
    );
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{quote_no || 'Invoice'}</Text>
                <Text style={styles.modalDate}>{fmtDate(date)}</Text>
              </View>
              <StatusBadge status={status} />
            </View>

            <View style={styles.divider} />

            {/* Vehicle */}
            {vehicle && (vehicle.make || vehicle.model || vehicle.reg_no) && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>VEHICLE</Text>
                <Text style={styles.sectionValue}>
                  {[vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                  {vehicle.reg_no ? `  (${vehicle.reg_no})` : ''}
                </Text>
                {!!vehicle.vin_no && <Text style={styles.sectionSub}>VIN: {vehicle.vin_no}</Text>}
              </View>
            )}

            {/* Customer */}
            {!!customer?.name && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>CUSTOMER</Text>
                <Text style={styles.sectionValue}>{customer.name}</Text>
                {!!customer.phone && <Text style={styles.sectionSub}>{customer.phone}</Text>}
              </View>
            )}

            {/* Job description */}
            {!!job_description && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>JOB</Text>
                <Text style={styles.sectionValue}>{job_description}</Text>
              </View>
            )}

            {/* Line items */}
            {items.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>LINE ITEMS</Text>
                <View style={styles.itemsTable}>
                  {items.map((it, i) => (
                    <View key={it.id || i} style={[styles.itemRow, i > 0 && styles.itemRowBorder]}>
                      <Text style={styles.itemDesc} numberOfLines={2}>
                        {it.description || '—'}
                        {it.qty > 1 ? `  ×${it.qty}` : ''}
                      </Text>
                      <Text style={styles.itemPrice}>{fmt(it.nett_price)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Totals */}
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>{fmt(totals?.subtotal)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>VAT ({totals?.vat_rate ?? 15}%)</Text>
                <Text style={styles.totalsValue}>{fmt(totals?.vat_amount)}</Text>
              </View>
              <View style={[styles.divider, { marginVertical: 8 }]} />
              <View style={styles.totalsRow}>
                <Text style={styles.totalsBold}>Total</Text>
                <Text style={[styles.totalsBold, { color: '#64B5F6' }]}>{fmt(totals?.total)}</Text>
              </View>
            </View>

            {!!notes && (
              <Text style={styles.notes}>{notes}</Text>
            )}

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={handleDownload}>
                <Text style={styles.actionBtnText}>⬇ Download</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnGhost]} onPress={onClose}>
                <Text style={styles.actionBtnGhostText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function InvoicesScreen() {
  const { token } = useAuth();
  const [invoices,   setInvoices]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const [selected,   setSelected]   = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const { ok, data } = await apiFetch('/invoices', {}, token);
      if (ok && Array.isArray(data)) {
        setInvoices(data);
        setError('');
      } else {
        setError((data && data.error) || 'Failed to load invoices.');
      }
    } catch {
      setError('Network error. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Reload whenever screen comes into focus
  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchInvoices();
  }, [fetchInvoices]));

  function onRefresh() {
    setRefreshing(true);
    fetchInvoices();
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={invoices}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={invoices.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5A623" />}
        renderItem={({ item }) => (
          <InvoiceCard invoice={item} onPress={setSelected} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>No Invoices Yet</Text>
            <Text style={styles.emptyText}>
              Your invoices will appear here once they are created for your bookings.
            </Text>
          </View>
        }
      />

      <InvoiceModal
        invoice={selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: 16,
  },

  // Error banner
  errorBanner: {
    backgroundColor: 'rgba(239,83,80,0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#EF5350',
    padding: 12,
    margin: 12,
    borderRadius: 8,
  },
  errorText: { color: '#EF9A9A', fontSize: 13 },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIcon:  { fontSize: 52, marginBottom: 16 },
  emptyTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptyText:  { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Card
  card: {
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  quoteNo: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  cardDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  cardMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginBottom: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardTotal: { color: '#64B5F6', fontSize: 16, fontWeight: '700' },
  cardVat:   { color: 'rgba(255,255,255,0.3)', fontSize: 11 },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#12122A',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(57,73,171,0.4)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  modalDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 12,
  },
  section: { marginBottom: 12 },
  sectionLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionValue: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  sectionSub:   { color: 'rgba(255,255,255,0.4)',  fontSize: 11, marginTop: 2 },

  // Items table
  itemsTable: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  itemDesc:  { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  itemPrice: { color: '#64B5F6', fontWeight: '700', fontSize: 13, marginLeft: 8 },

  // Totals box
  totalsBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  totalsRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalsLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  totalsValue: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  totalsBold:  { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  notes: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 14,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: '#1A237E',
  },
  actionBtnGhost: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionBtnText:      { color: '#FFFFFF',                fontWeight: '600', fontSize: 14 },
  actionBtnGhostText: { color: 'rgba(255,255,255,0.75)', fontWeight: '600', fontSize: 14 },
});
