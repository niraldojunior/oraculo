import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ViewProvider } from '@/context/ViewContext';
import { ChunkErrorBoundary } from '@/components/common/ChunkErrorBoundary';
import { lazyWithRetry } from '@/shared/lazyWithRetry';

const MainLayout = lazyWithRetry(() => import('@/components/layout/MainLayout'));
const Dashboard = lazyWithRetry(() => import('@/modules/dashboard/pages/DashboardPage'));
const Login = lazyWithRetry(() => import('@/modules/auth/pages/LoginPage'));
const Organization = lazyWithRetry(() => import('@/modules/organization/pages/OrganizationPage'));
const Inventory = lazyWithRetry(() => import('@/modules/inventory/pages/InventoryPage'));
const Initiatives = lazyWithRetry(() => import('@/modules/initiatives/pages/InitiativesPage'));
const InitiativeEdit = lazyWithRetry(() => import('@/modules/initiatives/pages/InitiativeEditPage'));
const Vendors = lazyWithRetry(() => import('@/modules/vendors/pages/VendorsPage'));
const Services = lazyWithRetry(() => import('@/modules/vendors/pages/ServicesPage'));
const Admin = lazyWithRetry(() => import('@/modules/admin/pages/AdminPage'));
const Tasks = lazyWithRetry(() => import('@/modules/tasks/pages/TasksPage'));
const Allocations = lazyWithRetry(() => import('@/modules/allocations/pages/AllocationsPage'));

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
    <ChunkErrorBoundary>
      <React.Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />

            <Route path="rede">
              <Route index element={<Navigate to="/rede/hierarquia" replace />} />
              <Route path="hierarquia" element={<Organization />} />
              <Route path="skills" element={<Organization />} />
              <Route path="demandantes" element={<Organization />} />
              <Route path="colaboradores" element={<Organization mode="collaborators" />} />
              <Route path="capacidade" element={<Organization mode="collaborators" />} />
              <Route path="alocacao" element={<Allocations />} />
            </Route>

            <Route path="produtos">
              <Route index element={<Navigate to="/produtos/aplicacoes/landscape" replace />} />
              <Route path="aplicacoes">
                <Route index element={<Navigate to="/produtos/aplicacoes/landscape" replace />} />
                <Route path="landscape" element={<Inventory />} />
                <Route path="tabela" element={<Inventory />} />
              </Route>
              <Route path="servicos">
                <Route index element={<Services />} />
                <Route path="fornecedores" element={<Vendors tab="fornecedores" />} />
                <Route path="contratos" element={<Vendors tab="contratos" />} />
              </Route>
            </Route>

            {/* As rotas literais precisam vir antes de :id para não capturar lista/kanban/timeline */}
            <Route path="iniciativas">
              <Route index element={<Navigate to="/iniciativas/lista" replace />} />
              <Route path="lista" element={<Initiatives />} />
              <Route path="kanban" element={<Initiatives />} />
              <Route path="timeline" element={<Initiatives />} />
              <Route path=":id/edit" element={<InitiativeEdit />} />
            </Route>

            <Route path="tarefas">
              <Route index element={<Navigate to="/tarefas/lista" replace />} />
              <Route path="lista" element={<Tasks />} />
              <Route path="cartoes" element={<Tasks />} />
            </Route>
          </Route>

          <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </ChunkErrorBoundary>
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

