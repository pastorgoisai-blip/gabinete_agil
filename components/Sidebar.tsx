import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Award,
  Calendar,
  MessageSquareText,
  BarChart3,
  Gavel,
  FolderOpen,
  Settings,
  LogOut,
  Bot,
  LifeBuoy,
  User,

  ShieldCheck
} from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { profile } = useProfile();
  const { profile: authProfile } = useAuth();

  const menuItems = [
    { label: 'Visão Geral', path: '/', icon: LayoutDashboard, moduleId: 'dashboard' },
    { label: 'Agente 24h (IA)', path: '/agent', icon: Bot, moduleId: 'agent' },
    { label: 'Gestão de Demandas', path: '/demands', icon: MessageSquareText, moduleId: 'demands' },
    // Base de Eleitores maps to 'voters' permission
    { label: 'Base de Eleitores', path: '/voters', icon: Users, moduleId: 'voters' },
    { label: 'Agenda Oficial', path: '/agenda', icon: Calendar, moduleId: 'agenda' },
    { label: 'Espaço Legislativo', path: '/legislative', icon: Gavel, moduleId: 'legislative' },
    { label: 'Matérias Legislativas', path: '/projects', icon: FolderOpen, moduleId: 'projects' },
    { label: 'Homenageados', path: '/honored', icon: Award, moduleId: 'honored' },
    { label: 'Relatórios & BI', path: '/reports', icon: BarChart3, moduleId: 'reports' },
    { label: 'Equipe & Usuários', path: '/users', icon: Users, moduleId: 'users' },
    { label: 'Configurações', path: '/settings', icon: Settings, moduleId: 'settings' },
    { label: 'Ajuda', path: '/help', icon: LifeBuoy, moduleId: 'dashboard' }, // Help usually open to all, mapping to dashboard or public
  ].filter(item => {
    // 1. Admin/Super Admin bypass checks
    if (authProfile?.role === 'admin' || authProfile?.is_super_admin) return true;

    // 2. Specific Role Checks (Legacy support if permissions empty)
    if (item.path === '/users' || item.path === '/settings') {
      return false; // Only admins can see these, handled above
    }

    // 3. Permission Checks
    const perms = authProfile?.permissions;
    if (perms && item.moduleId) {
      // If permission object exists for this module, check 'view'
      if (perms[item.moduleId] && perms[item.moduleId].view === false) {
        return false;
      }
    }

    return true;
  });

  return (
    <>
      {/* Mobile backdrop - Mantido para compatibilidade mobile */}
      <div
        className={`fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsOpen(false)}
      />

      {/* 
        Sidebar Container - Floating Glass 
        Fixed position with margins to create floating effect
      */}
      <aside
        className={`
          fixed text-[#09231c]
          lg:left-4 lg:top-4 lg:bottom-4 lg:w-64 
          left-0 top-0 bottom-0 w-64
          z-50 
          bg-gradient-to-b from-[#a8bbb7] to-[#63857c] dark:bg-none dark:bg-card/95
          backdrop-blur-md 
          border-r border-primary-900/10 lg:border border-primary-900/10 dark:border-border
          shadow-2xl 
          rounded-r-2xl lg:rounded-2xl 
          flex flex-col 
          overflow-hidden 
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header da Logo */}
        <div className="p-6 border-b border-primary-900/10 dark:border-border flex items-center justify-center shrink-0">
          <div className="flex items-center justify-center">
            {/* Light Mode Logo */}
            <img
              src="/assets/branding/login-logo.png"
              alt="Gabinete Ágil Logo"
              className="h-14 w-auto object-contain hover:scale-105 transition-transform duration-300 dark:hidden"
            />
            {/* Dark Mode Logo */}
            <img
              src="/assets/branding/sidebar-logo-dark.png"
              alt="Gabinete Ágil Logo"
              className="h-14 w-auto object-contain hover:scale-105 transition-transform duration-300 hidden dark:block"
            />
          </div>
        </div>

        {/* Profile Card Minimalista */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 p-3 rounded-xl dark:bg-muted/50 dark:border-border">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-border shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-muted flex items-center justify-center text-primary-700 dark:text-muted-foreground ring-2 ring-white dark:ring-border">
                <User className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary-950 dark:text-foreground truncate">{profile.name}</p>
              <p className="text-xs text-primary-900/80 dark:text-muted-foreground truncate">{profile.party || 'Sem partido'}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#06dd82] shadow-[0_0_8px_rgba(6,221,130,0.5)]"></div>
          </div>
        </div>

        {/* Navegação Scrollable sem barra visível */}
        <nav className="flex-1 overflow-y-auto hover:overflow-y-auto pr-2 px-4 py-2 space-y-1 no-scrollbar text-sm">
          <div className="text-[10px] font-bold text-primary-900/70 dark:text-muted-foreground uppercase tracking-wider mb-2 mt-2 px-2">Menu Principal</div>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                 group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium
                 ${isActive
                  ? 'bg-[#8eb69b] dark:bg-primary-900/20 text-[#051f20] dark:text-primary-300 shadow-sm ring-1 ring-[#5c8574]/30 dark:ring-primary-900/50'
                  : 'text-[#09231c] dark:text-slate-400 hover:text-[#051f20] dark:hover:text-slate-200 hover:bg-[#8eb69b] dark:hover:bg-slate-800'
                }
               `}
              onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <div className={`
                      p-1.5 rounded-lg transition-all duration-300
                      ${isActive
                      ? 'bg-primary-100/50 dark:bg-primary-800/30 text-primary-900 dark:text-primary-400'
                      : 'bg-transparent text-primary-900 dark:text-muted-foreground group-hover:bg-primary-900/10 dark:group-hover:bg-muted group-hover:text-primary-950 dark:group-hover:text-foreground group-hover:scale-110'
                    }
                   `}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 bg-slate-50/50 dark:bg-muted/10 border-t border-slate-100 dark:border-border backdrop-blur-sm space-y-1">
          {authProfile?.is_super_admin && (
            <NavLink
              to="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-100 dark:border-purple-800 transition-colors mb-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Administração SaaS
            </NavLink>
          )}

          <NavLink
            to="/login"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
          >
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400 group-hover:text-rose-500 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </div>
            Sair do Sistema
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;