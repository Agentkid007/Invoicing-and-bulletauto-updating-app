/**
 * NewBookingScreen.js
 * Form for clients to submit a new vehicle service booking.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../App';
import { apiFetch } from '../config/api';

const SERVICE_TYPES = [
  'Full Service',
  'Oil & Filter Change',
  'Brake Service',
  'Tyre Rotation & Balance',
  'Engine Diagnostics',
  'Transmission Service',
  'Air Conditioning Service',
  'Battery Replacement',
  'Suspension & Steering',
  'Electrical Diagnostics',
  'Car Wash & Valet',
  'Other',
];

export default function NewBookingScreen({ navigation }) {
  const { token } = useAuth();

  const [form, setForm] = useState({
    vehicle_registration: '',
    vehicle_make:         '',
    vehicle_model:        '',
    vehicle_year:         '',
    vehicle_colour:       '',
    service_type:         SERVICE_TYPES[0],
    notes:                '',
  });
  const [loading,  setLoading]  = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.vehicle_registration.trim()) {
      Alert.alert('Required', 'Vehicle registration is required.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        vehicle_year: form.vehicle_year ? parseInt(form.vehicle_year, 10) : undefined,
      };
      const { ok, data } = await apiFetch(
        '/bookings',
        { method: 'POST', body: JSON.stringify(payload) },
        token
      );
      if (ok && data.id) {
        Alert.alert('Booking Submitted! ✅', 'Your booking has been received. We will confirm shortly.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', data?.error || data?.message || 'Failed to create booking.');
      }
    } catch {
      Alert.alert('Network Error', 'Check the backend is running and the API URL is set correctly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Vehicle details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Vehicle Details</Text>

          <Text style={styles.label}>Registration <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={form.vehicle_registration}
            onChangeText={v => set('vehicle_registration', v.toUpperCase())}
            placeholder="e.g. ABC 123 GP"
            placeholderTextColor="#555"
            autoCapitalize="characters"
            returnKeyType="next"
          />

          <Text style={styles.label}>Make</Text>
          <TextInput
            style={styles.input}
            value={form.vehicle_make}
            onChangeText={v => set('vehicle_make', v)}
            placeholder="e.g. Toyota"
            placeholderTextColor="#555"
            returnKeyType="next"
          />

          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            value={form.vehicle_model}
            onChangeText={v => set('vehicle_model', v)}
            placeholder="e.g. Corolla"
            placeholderTextColor="#555"
            returnKeyType="next"
          />

          <Text style={styles.label}>Year</Text>
          <TextInput
            style={styles.input}
            value={form.vehicle_year}
            onChangeText={v => set('vehicle_year', v.replace(/\D/g, '').slice(0, 4))}
            placeholder="e.g. 2019"
            placeholderTextColor="#555"
            keyboardType="number-pad"
            maxLength={4}
            returnKeyType="next"
          />

          <Text style={styles.label}>Colour</Text>
          <TextInput
            style={styles.input}
            value={form.vehicle_colour}
            onChangeText={v => set('vehicle_colour', v)}
            placeholder="e.g. White"
            placeholderTextColor="#555"
            returnKeyType="next"
          />
        </View>

        {/* Service type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Service</Text>

          <Text style={styles.label}>Service Type</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowPicker(!showPicker)}
            activeOpacity={0.8}
          >
            <Text style={styles.pickerText}>{form.service_type}</Text>
            <Text style={styles.pickerChevron}>{showPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showPicker && (
            <View style={styles.pickerDropdown}>
              {SERVICE_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerOption,
                    form.service_type === type && styles.pickerOptionSelected,
                  ]}
                  onPress={() => { set('service_type', type); setShowPicker(false); }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    form.service_type === type && styles.pickerOptionTextSelected,
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.notes}
            onChangeText={v => set('notes', v)}
            placeholder="Describe any issues or special requests…"
            placeholderTextColor="#555"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#0A0A0A" />
            : <Text style={styles.buttonText}>Submit Booking</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
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
  label: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  required: {
    color: '#E74C3C',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 15,
  },
  textarea: {
    minHeight: 96,
    paddingTop: 11,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  pickerChevron: {
    color: '#F5A623',
    fontSize: 12,
  },
  pickerDropdown: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  pickerOptionSelected: {
    backgroundColor: '#2A1F00',
  },
  pickerOptionText: {
    color: '#CCC',
    fontSize: 14,
  },
  pickerOptionTextSelected: {
    color: '#F5A623',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#F5A623',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0A0A0A',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
