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
  LifeBuoy
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  // Reordenação para fluxo de trabalho Ágil: Agente (Entrada) -> Demandas (Processamento) -> CRM (Base)
  const menuItems = [
    { label: 'Visão Geral', path: '/', icon: LayoutDashboard },
    { label: 'Agente 24h (IA)', path: '/agent', icon: Bot },
    { label: 'Gestão de Demandas', path: '/demands', icon: MessageSquareText },
    { label: 'Base de Eleitores', path: '/voters', icon: Users },
    { label: 'Agenda Oficial', path: '/agenda', icon: Calendar },
    { label: 'Espaço Legislativo', path: '/legislative', icon: Gavel },
    { label: 'Projetos de Lei', path: '/projects', icon: FolderOpen },
    { label: 'Homenageados', path: '/honored', icon: Award },
    { label: 'Relatórios & BI', path: '/reports', icon: BarChart3 },
    { label: 'Equipe & Usuários', path: '/users', icon: Users }, // Ícone repetido intencionalmente para agrupar pessoas
    { label: 'Configurações', path: '/settings', icon: Settings },
    { label: 'Ajuda', path: '/help', icon: LifeBuoy },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className={`fixed inset-0 z-20 bg-gray-900 bg-opacity-50 transition-opacity lg:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-900 text-white transition duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
        
        {/* Header */}
        <div className="flex items-center justify-center h-20 bg-slate-950 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-lg shadow-lg shadow-primary-900/50">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none tracking-tight">Gabinete<br/><span className="font-light text-primary-400">Ágil</span></h1>
            </div>
          </div>
        </div>

        {/* Profile Snippet */}
        <div className="p-4 border-b border-slate-800/50">
          <div className="relative overflow-hidden rounded-xl bg-slate-800 border border-slate-700 aspect-[2.5/1] group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-slate-900 opacity-90"></div>
            <div className="absolute inset-0 flex flex-col justify-center px-4">
              <p className="font-bold text-sm text-white">Wederson Lopes</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-xs text-slate-300">Gabinete Online</p>
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
        <div className="p-4 border-t border-slate-800/50 bg-slate-950">
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