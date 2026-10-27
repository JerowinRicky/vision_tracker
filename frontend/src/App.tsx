import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { AppLayout } from './components/Layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveCamerasPage } from './pages/LiveCamerasPage';
import { CamerasPage } from './pages/CamerasPage';
import { VideoUploadsPage } from './pages/VideoUploadsPage';
import { ProcessingJobsPage } from './pages/ProcessingJobsPage';
import { ObjectsPage } from './pages/ObjectsPage';
import { ObjectDetailPage } from './pages/ObjectDetailPage';
import { VisitsPage } from './pages/VisitsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ZonesPage } from './pages/ZonesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected platform application routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="live" element={<LiveCamerasPage />} />
                <Route path="cameras" element={<CamerasPage />} />
                <Route path="videos" element={<VideoUploadsPage />} />
                <Route path="jobs" element={<ProcessingJobsPage />} />
                <Route path="objects" element={<ObjectsPage />} />
                <Route path="objects/:id" element={<ObjectDetailPage />} />
                <Route path="visits" element={<VisitsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="zones" element={<ZonesPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="audit" element={<AuditLogsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
