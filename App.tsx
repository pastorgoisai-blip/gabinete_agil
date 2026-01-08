import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CopilotWidget from './components/CopilotWidget'; // Import Copilot
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
import { ProfileProvider } from './contexts/ProfileContext';

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
        {/* Global Copilot Widget - Floating Action Button */}
        <CopilotWidget />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ProfileProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes - Main Modules */}
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/voters" element={<Layout><Voters /></Layout>} />
          <Route path="/demands" element={<Layout><Demands /></Layout>} />
          <Route path="/legislative" element={<Layout><Legislative /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          
          {/* New Pages */}
          <Route path="/agenda" element={<Layout><Agenda /></Layout>} />
          <Route path="/honored" element={<Layout><Honored /></Layout>} />
          <Route path="/agent" element={<Layout><Agent /></Layout>} />
          <Route path="/projects" element={<Layout><Projects /></Layout>} />
          <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/help" element={<Layout><HelpSupport /></Layout>} />
          
          {/* User Management */}
          <Route path="/users" element={<Layout><UserList /></Layout>} />
          <Route path="/users/new" element={<Layout><UserAdd /></Layout>} />
          <Route path="/users/edit/:id" element={<Layout><UserEdit /></Layout>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ProfileProvider>
  );
};

export default App;