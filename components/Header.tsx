import React from 'react';
import { Menu, Bell, Moon, Sun, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();

  const { profile } = useAuth();

  const getRoleLabel = (role?: string) => {
    const roles: { [key: string]: string } = {
      'super_admin': 'Super Admin',
      'admin': 'Administrador',
      'manager': 'Gerente',
      'staff': 'Equipe',
      'volunteer': 'Voluntário'
    };
    return role ? roles[role] || role : 'Visitante';
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center">
          <button
            type="button"
            className="border-r border-gray-200 dark:border-slate-700 pr-4 text-gray-500 focus:outline-none lg:hidden"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex w-full md:ml-0 max-w-md ml-4">
            <label htmlFor="search-field" className="sr-only">
              Buscar
            </label>
            <div className="relative w-full text-gray-400 focus-within:text-gray-600 dark:focus-within:text-gray-300">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="search-field"
                className="block h-full w-full border-transparent py-2 pl-8 pr-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:border-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm bg-transparent"
                placeholder="Buscar eleitor, documento ou demanda..."
                type="search"
                name="search"
              />
            </div>
          </div>
        </div>

        <div className="ml-4 flex items-center md:ml-6 gap-4">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="rounded-full bg-white dark:bg-slate-800 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <span className="sr-only">Toggle theme</span>
            {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative rounded-full bg-white dark:bg-slate-800 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Profile dropdown trigger */}
          <div className="relative ml-3">
            <div className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{profile?.name || 'Carregando...'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleLabel(profile?.role)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;