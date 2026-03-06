/**
 * App.js — BulletAuto Mobile entry point
 *
 * Sets up:
 *  • Auth context (token + user stored in AsyncStorage)
 *  • React Navigation stack
 *  • Dark theme (background #0A0A0A, accent #F5A623)
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BookingDetailScreen from './src/screens/BookingDetailScreen';
import NewBookingScreen from './src/screens/NewBookingScreen';

// ─── Auth Context ─────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

const Stack = createNativeStackNavigator();

// ─── Navigation theme ─────────────────────────────────────────────────────────
const NAV_THEME = {
  dark: true,
  colors: {
    primary:      '#F5A623',
    background:   '#0A0A0A',
    card:         '#111111',
    text:         '#FFFFFF',
    border:       '#222222',
    notification: '#F5A623',
  },
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken]   = useState(null);
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from storage on first launch
  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem('ba_token');
      const storedUser  = await AsyncStorage.getItem('ba_user');
      if (storedToken) setToken(storedToken);
      if (storedUser)  setUser(JSON.parse(storedUser));
      setLoading(false);
    })();
  }, []);

  const login = async (newToken, newUser) => {
    await AsyncStorage.setItem('ba_token', newToken);
    await AsyncStorage.setItem('ba_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['ba_token', 'ba_user']);
    setToken(null);
    setUser(null);
  };

  // Don't render until storage has been read
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      <StatusBar style="light" />
      <NavigationContainer theme={NAV_THEME}>
        <Stack.Navigator
          screenOptions={{
            headerStyle:      { backgroundColor: '#111111' },
            headerTintColor:  '#F5A623',
            headerTitleStyle: { fontWeight: 'bold', color: '#FFFFFF' },
            contentStyle:     { backgroundColor: '#0A0A0A' },
          }}
        >
          {token ? (
            <>
              <Stack.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ title: 'BulletAuto' }}
              />
              <Stack.Screen
                name="BookingDetail"
                component={BookingDetailScreen}
                options={{ title: 'Booking Details' }}
              />
              <Stack.Screen
                name="NewBooking"
                component={NewBookingScreen}
                options={{ title: 'New Booking' }}
              />
            </>
          ) : (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
