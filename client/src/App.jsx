import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getToken } from './api.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewBooking from './pages/NewBooking.jsx';
import BookingDetail from './pages/BookingDetail.jsx';
import ClientInvoices from './pages/ClientInvoices.jsx';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/bookings/new"
          element={
            <RequireAuth>
              <NewBooking />
            </RequireAuth>
          }
        />
        <Route
          path="/bookings/:id"
          element={
            <RequireAuth>
              <BookingDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/invoices"
          element={
            <RequireAuth>
              <ClientInvoices />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
