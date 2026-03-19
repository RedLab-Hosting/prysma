import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import SuperAdminView from './views/SuperAdmin/SuperAdminView';
import StorefrontView from './views/Client/StorefrontView';
import CheckoutView from './views/Client/CheckoutView';
import LoginView from './views/Login/LoginView';
import { TenantProvider } from './context/TenantContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

import AdminDashboardView from './views/Admin/AdminDashboardView';

// Helper to redirect old hash-based URLs to true paths
function HashRedirector() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1); // remove #
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const slug = pathSegments[0];

      if (slug && (hash === 'login' || hash === 'admin' || hash === 'checkout')) {
        navigate(`/${slug}/${hash}`, { replace: true });
      }
    }
  }, [navigate, location]);

  return null;
}

function App() {
  // Determine basename for GitHub Pages subfolders
  const hostname = window.location.hostname;
  const isGitHubPages = hostname.includes('github.io');
  const pathSegments = window.location.pathname.split('/');
  const basename = isGitHubPages && pathSegments[1] ? `/${pathSegments[1]}` : '';

  return (
    <Router basename={basename}>
      <AuthProvider>
        <HashRedirector />
        <Routes>
          {/* Super Admin Route */}
          <Route path="/superadmin" element={<SuperAdminView />} />
          
          {/* Multi-tenant Routes */}
          <Route path="/:tenantSlug/login" element={
            <TenantProvider>
              <LoginView />
            </TenantProvider>
          } />

          <Route path="/:tenantSlug/admin" element={
            <TenantProvider>
              <AdminDashboardView />
            </TenantProvider>
          } />

          {/* Multi-tenant Client Routes */}
          <Route path="/:tenantSlug" element={
            <TenantProvider>
              <CartProvider>
                <StorefrontView />
              </CartProvider>
            </TenantProvider>
          } />

          <Route path="/:tenantSlug/checkout" element={
            <TenantProvider>
              <CartProvider>
                <CheckoutView />
              </CartProvider>
            </TenantProvider>
          } />

          <Route path="/" element={<Navigate to="/superadmin" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
