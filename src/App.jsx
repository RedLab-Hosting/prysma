import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SuperAdminView from './views/SuperAdmin/SuperAdminView';
import StorefrontView from './views/Client/StorefrontView';
import CheckoutView from './views/Client/CheckoutView';
import { TenantProvider } from './context/TenantContext';
import { CartProvider } from './context/CartContext';

import AdminDashboardView from './views/Admin/AdminDashboardView';

function App() {
  // Determine basename for GitHub Pages subfolders
  const hostname = window.location.hostname;
  const isGitHubPages = hostname.includes('github.io');
  const pathSegments = window.location.pathname.split('/');
  const basename = isGitHubPages && pathSegments[1] ? `/${pathSegments[1]}` : '';

  return (
    <Router basename={basename}>
      <Routes>
        {/* Super Admin Route */}
        <Route path="/superadmin" element={<SuperAdminView />} />
        
        {/* Local Admin Route */}
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
    </Router>
  );
}

export default App;
