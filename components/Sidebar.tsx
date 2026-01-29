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
  Zap,
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
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsOpen(false)}
      />

      {/* 
        Sidebar Container - Floating Glass 
        Fixed position with margins to create floating effect
      */}
      <aside
        className={`
          fixed text-slate-800
          lg:left-4 lg:top-4 lg:bottom-4 lg:w-64 
          left-0 top-0 bottom-0 w-64
          z-50 
          bg-white/90 dark:bg-slate-900/95 
          backdrop-blur-md 
          border-r border-slate-200/60 lg:border border-slate-200/60 dark:border-slate-800/60
          shadow-2xl 
          rounded-r-2xl lg:rounded-2xl 
          flex flex-col 
          overflow-hidden 
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header da Logo */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-default">
              <div className="absolute inset-0 bg-primary-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
              <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 p-2.5 rounded-xl shadow-lg ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-300">
                <Zap className="w-5 h-5 text-white fill-white/20" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold leading-tight">Gabinete</span>
              <span className="text-xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">
                Ágil<span className="text-primary-600">.</span>
              </span>
            </div>
          </div>
        </div>

        {/* Profile Card Minimalista */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 ring-2 ring-white dark:ring-slate-700">
                <User className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{profile.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile.party || 'Sem partido'}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(35,83,71,0.5)]"></div>
          </div>
        </div>

        {/* Navegação Scrollable sem barra visível */}
        <nav className="flex-1 overflow-y-auto hover:overflow-y-auto pr-2 px-4 py-2 space-y-1 no-scrollbar text-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2 px-2">Menu Principal</div>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                 group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium
                 ${isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm ring-1 ring-primary-100 dark:ring-primary-900/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }
               `}
              onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <div className={`
                      p-1.5 rounded-lg transition-all duration-300
                      ${isActive
                      ? 'bg-primary-100/50 dark:bg-primary-800/30 text-primary-600 dark:text-primary-400'
                      : 'bg-transparent text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 group-hover:text-slate-600 group-hover:scale-110'
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
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 backdrop-blur-sm space-y-1">
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