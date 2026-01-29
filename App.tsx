
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CopilotWidget from './components/CopilotWidget';
import Dashboard from './pages/Dashboard';
import Voters from './pages/Voters';
import Demands from './pages/Demands';
import Legislative from './pages/Legislative';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import PendingInvite from './pages/PendingInvite';
import Agenda from './pages/Agenda';
import Honored from './pages/Honored';
import Agent from './pages/Agent';
import UserList from './pages/UserList';
import UserAdd from './pages/UserAdd';
import UserEdit from './pages/UserEdit';
import Projects from './pages/Projects';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import HelpSupport from './pages/HelpSupport';
import { ProfileProvider } from './contexts/ProfileContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';

import ManagerRoute from './components/ManagerRoute';
import AcceptInvite from './pages/AcceptInvite';
import ResetPassword from './pages/ResetPassword';

// Layout Component (Authenticated)
const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="flex bg-gray-50 dark:bg-slate-950 min-h-screen">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Wrapper - Com margem para Sidebar Flutuante */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 lg:ml-72">
        <Header
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
        />

        <main className="flex-1 relative focus:outline-none p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </main>

        <CopilotWidget />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProfileProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />

            {/* Rota semi-protegida: Usuário logado mas sem vínculo */}
            <Route element={<ProtectedRoute />}>
              <Route path="/pending-invite" element={<PendingInvite />} />
              <Route path="/onboarding" element={<Onboarding />} />
            </Route>

            {/* Rotas Protegidas e com Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/voters" element={<Voters />} />
                <Route path="/demands" element={<Demands />} />
                <Route path="/legislative" element={<Legislative />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/honored" element={<Honored />} />
                <Route path="/agent" element={<Agent />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/help" element={<HelpSupport />} />

                {/* Manager Routes (Admin/Super Admin only) */}
                <Route element={<ManagerRoute />}>
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/users" element={<UserList />} />
                  <Route path="/users/new" element={<UserAdd />} />
                  <Route path="/users/edit/:id" element={<UserEdit />} />
                </Route>
              </Route>
            </Route>

            {/* Rota Super Admin (Separada do Layout padrão) */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ProfileProvider>
    </AuthProvider>
  );
};

export default App;