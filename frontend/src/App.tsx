import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
 
import { AuthProvider, useAuth } from './core/auth';
import { ViewProvider } from './core/view';
import MainLayout from './shared/ui/layout/MainLayout';
import Dashboard from './modules/dashboard/pages/DashboardPage';
import Login from './modules/auth/pages/LoginPage';
import Organization from './modules/organization/pages/OrganizationPage';
import Inventory from './modules/inventory/pages/InventoryPage';
import InventoryDetail from './modules/inventory/pages/InventoryDetailPage';
import Initiatives from './modules/initiatives/pages/InitiativesPage';
import InitiativeEdit from './modules/initiatives/pages/InitiativeEditPage';
import Vendors from './modules/vendors/pages/VendorsPage';
import Admin from './modules/admin/pages/AdminPage';
import Tasks from './modules/tasks/pages/TasksPage';
import Allocations from './modules/allocations/pages/AllocationsPage';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading && !user) {
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
        <Route path="tarefas" element={<Tasks />} />
        <Route path="alocacoes" element={<Allocations />} />
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

