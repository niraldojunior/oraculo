import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
 
import { AuthProvider, useAuth } from './context/AuthContext';
import { ViewProvider } from './context/ViewContext';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

import Organization from './pages/Organization';
import Inventory from './pages/Inventory';
import InventoryDetail from './pages/InventoryDetail';
import Initiatives from './pages/Initiatives';
import InitiativeEdit from './pages/InitiativeEdit';
import Vendors from './pages/Vendors';
import Admin from './pages/Admin';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: '#0F1117', color: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="animate-spin" style={{ width: '2rem', height: '2rem', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#FFD919', borderRadius: '50%' }}></div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="organizacao" element={<Organization />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="inventario/:id" element={<InventoryDetail />} />
        <Route path="iniciativas" element={<Initiatives />} />
        <Route path="iniciativas/:id/edit" element={<InitiativeEdit />} />
        <Route path="fornecedores" element={<Vendors />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ViewProvider>
          <AppRoutes />
        </ViewProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

