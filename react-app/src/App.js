import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import UserSettings from './pages/UserSettings';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MenuManager from './pages/admin/MenuManager';
import OrderDashboard from './pages/admin/OrderDashboard';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import WorkOrderDashboard from './pages/admin/WorkOrderDashboard';
import WorkOrderForm from './pages/admin/WorkOrderForm';
import Menu from './pages/Menu';
import './App.css';

// Replace this with your actual Google Client ID
// Get it from: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <UserSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/menu"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <MenuManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <OrderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/workorders"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee']}>
                    <WorkOrderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/workorders/new"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee']}>
                    <WorkOrderForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/workorders/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee']}>
                    <WorkOrderForm />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
