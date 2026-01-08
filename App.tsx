import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Voters from './pages/Voters';
import Demands from './pages/Demands';
import Legislative from './pages/Legislative';
import Settings from './pages/Settings';
import Login from './pages/Login';
import PlaceholderPage from './pages/PlaceholderPage';
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

// Layout Component to wrap authenticated pages
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
        />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

import { AuthProvider, useAuth } from './contexts/AuthContext';

// Auth Guard Component
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes - Main Modules */}
      <Route path="/" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
      <Route path="/voters" element={<RequireAuth><Layout><Voters /></Layout></RequireAuth>} />
      <Route path="/demands" element={<RequireAuth><Layout><Demands /></Layout></RequireAuth>} />
      <Route path="/legislative" element={<RequireAuth><Layout><Legislative /></Layout></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Layout><Settings /></Layout></RequireAuth>} />

      {/* New Pages */}
      <Route path="/agenda" element={<RequireAuth><Layout><Agenda /></Layout></RequireAuth>} />
      <Route path="/honored" element={<RequireAuth><Layout><Honored /></Layout></RequireAuth>} />
      <Route path="/agent" element={<RequireAuth><Layout><Agent /></Layout></RequireAuth>} />
      <Route path="/projects" element={<RequireAuth><Layout><Projects /></Layout></RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><Layout><Notifications /></Layout></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><Layout><Reports /></Layout></RequireAuth>} />
      <Route path="/help" element={<RequireAuth><Layout><HelpSupport /></Layout></RequireAuth>} />

      {/* User Management */}
      <Route path="/users" element={<RequireAuth><Layout><UserList /></Layout></RequireAuth>} />
      <Route path="/users/new" element={<RequireAuth><Layout><UserAdd /></Layout></RequireAuth>} />
      <Route path="/users/edit/:id" element={<RequireAuth><Layout><UserEdit /></Layout></RequireAuth>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;