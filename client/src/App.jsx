import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupsPage from './pages/GroupsPage';
import JoinGroup from './pages/JoinGroup';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/join" element={<JoinGroup />} />
              <Route
                path="/activity"
                element={
                  <div className="p-8 text-text-secondary">
                    Activity page coming soon
                  </div>
                }
              />
              <Route
                path="/settings"
                element={
                  <div className="p-8 text-text-secondary">
                    Settings page coming soon
                  </div>
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
