import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import { Overview } from './pages/Overview';
import { SupplyNetwork } from './pages/SupplyNetwork';
import { Suppliers } from './pages/Suppliers';
import { Facilities } from './pages/Facilities';
import { Inventory } from './pages/Inventory';
import { DisruptionScenarios } from './pages/DisruptionScenarios';
import { SimulationLab } from './pages/SimulationLab';
import { MitigationPlanner } from './pages/MitigationPlanner';
import { AiInsights } from './pages/AiInsights';
import { Reports } from './pages/Reports';
import { Approvals } from './pages/Approvals';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-mono text-xs">
        <div className="space-y-2 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Verifying Enterprise Tenant Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Enterprise Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="network" element={<SupplyNetwork />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="facilities" element={<Facilities />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="scenarios" element={<DisruptionScenarios />} />
              <Route path="simulation" element={<SimulationLab />} />
              <Route path="mitigation" element={<MitigationPlanner />} />
              <Route path="agents" element={<AiInsights />} />
              <Route path="reports" element={<Reports />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
