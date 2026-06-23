import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
 
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ViewProvider } from '@/context/ViewContext';

const MainLayout = React.lazy(() => import('@/components/layout/MainLayout'));
const Dashboard = React.lazy(() => import('@/modules/dashboard/pages/DashboardPage'));
const Login = React.lazy(() => import('@/modules/auth/pages/LoginPage'));
const Organization = React.lazy(() => import('@/modules/organization/pages/OrganizationPage'));
const Collaborators = React.lazy(() => import('@/modules/organization/pages/CollaboratorsPage'));
const Inventory = React.lazy(() => import('@/modules/inventory/pages/InventoryPage'));
const Initiatives = React.lazy(() => import('@/modules/initiatives/pages/InitiativesPage'));
const InitiativeEdit = React.lazy(() => import('@/modules/initiatives/pages/InitiativeEditPage'));
const Vendors = React.lazy(() => import('@/modules/vendors/pages/VendorsPage'));
const Admin = React.lazy(() => import('@/modules/admin/pages/AdminPage'));
const Tasks = React.lazy(() => import('@/modules/tasks/pages/TasksPage'));
const Allocations = React.lazy(() => import('@/modules/allocations/pages/AllocationsPage'));

const RouteFallback = () => (
  <div className="flex-center" style={{ height: '100vh', background: '#0F1117', color: '#FFFFFF' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div className="animate-spin" style={{ width: '2rem', height: '2rem', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#FFD919', borderRadius: '50%' }}></div>
      <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Carregando tela...</p>
    </div>
  </div>
);

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
    <React.Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="organizacao" element={<Organization />} />
          <Route path="colaboradores" element={<Collaborators />} />
          <Route path="inventario" element={<Inventory />} />
          <Route path="iniciativas" element={<Initiatives />} />
          <Route path="iniciativas/:id/edit" element={<InitiativeEdit />} />
          <Route path="fornecedores" element={<Vendors />} />
          <Route path="tarefas" element={<Tasks />} />
          <Route path="alocacoes" element={<Allocations />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
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

