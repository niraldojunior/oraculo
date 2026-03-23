import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
 
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

import Organization from './pages/Organization';
import Inventory from './pages/Inventory';
import InventoryDetail from './pages/InventoryDetail';
import Initiatives from './pages/Initiatives';
import InitiativeForm from './pages/InitiativeForm';
import InitiativeDetail from './pages/InitiativeDetail';
import Roadmap from './pages/Roadmap';
import Vendors from './pages/Vendors';
import PendingInitiatives from './pages/PendingInitiatives';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
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
        <Route path="iniciativas/:id" element={<InitiativeDetail />} />
        <Route path="iniciativas/nova" element={<InitiativeForm />} />
        <Route path="iniciativas/editar/:id" element={<InitiativeForm />} />
        <Route path="iniciativas/pendencias" element={<PendingInitiatives />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="fornecedores" element={<Vendors />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
