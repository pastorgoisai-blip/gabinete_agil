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
  Landmark,
  Bot,
  Bell,
  LifeBuoy,
  User,
  Zap, // Adicionado ícone de agilidade
  ShieldCheck
} from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { profile } = useProfile(); // Contexto visual (Legacy/Local)
  const { profile: authProfile } = useAuth(); // Contexto de Autenticação Real (Supabase)

  // Reordenação para fluxo de trabalho Ágil: Agente (Entrada) -> Demandas (Processamento) -> CRM (Base)
  const menuItems = [
    { label: 'Visão Geral', path: '/', icon: LayoutDashboard },
    { label: 'Agente 24h (IA)', path: '/agent', icon: Bot },
    { label: 'Gestão de Demandas', path: '/demands', icon: MessageSquareText },
    { label: 'Base de Eleitores', path: '/voters', icon: Users },
    { label: 'Agenda Oficial', path: '/agenda', icon: Calendar },
    { label: 'Espaço Legislativo', path: '/legislative', icon: Gavel },
    { label: 'Matérias Legislativas', path: '/projects', icon: FolderOpen },
    { label: 'Homenageados', path: '/honored', icon: Award },
    { label: 'Relatórios & BI', path: '/reports', icon: BarChart3 },
    { label: 'Equipe & Usuários', path: '/users', icon: Users },
    { label: 'Configurações', path: '/settings', icon: Settings },
    { label: 'Ajuda', path: '/help', icon: LifeBuoy },
  ].filter(item => {
    // Regras de Visibilidade
    if (item.path === '/users' || item.path === '/settings') {
      // Apenas Admin ou Super Admin podem ver "Equipes" e "Configurações"
      return authProfile?.role === 'admin' || authProfile?.is_super_admin;
    }
    return true; // Demais itens visíveis para todos (por enquanto)
  });

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-20 bg-gray-900 bg-opacity-50 transition-opacity lg:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-900 text-white transition duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>

        {/* Header - Novo Logo Ágil */}
        <div className="flex items-center justify-center h-24 bg-slate-950 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-2.5 rounded-xl border border-slate-700 shadow-xl group-hover:border-primary-500/50 transition-all">
                <Zap className="w-6 h-6 text-primary-400 fill-primary-400/20" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold leading-tight">Gabinete</span>
              <span className="text-xl font-black text-white leading-none tracking-tighter">
                Ágil<span className="text-primary-500">.</span>
              </span>
            </div>
          </div>
        </div>

        {/* Profile Snippet (Novo Design Redondo) */}
        <div className="p-5 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md bg-slate-800"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-slate-400 shadow-md">
                  <User className="w-6 h-6" />
                </div>
              )}
              {/* Status Indicator */}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full" title="Sistema Online"></span>
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="font-bold text-sm text-white truncate leading-tight" title={profile.name}>
                {profile.name}
              </p>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {profile.party}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20 translate-x-1'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
              `}
              onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-950 space-y-2">
          {/* Link Super Admin (Apenas para Admins) */}
          {authProfile?.is_super_admin && (
            <NavLink
              to="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-purple-400 hover:text-white hover:bg-purple-900/40 transition-colors border border-purple-900/30 mb-2"
            >
              <ShieldCheck className="w-5 h-5" />
              Administração SaaS
            </NavLink>
          )}

          <NavLink
            to="/login"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair do Sistema
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default Sidebar;