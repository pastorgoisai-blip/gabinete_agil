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
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-background dark:bg-background border-b border-border dark:border-border shadow-sm transition-colors">
      <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center">
          <button
            type="button"
            className="border-r border-border dark:border-border pr-4 text-muted-foreground focus:outline-none lg:hidden"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex w-full md:ml-0 max-w-md ml-4">
            <label htmlFor="search-field" className="sr-only">
              Buscar
            </label>
            <div className="relative w-full text-muted-foreground focus-within:text-foreground dark:focus-within:text-foreground">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="search-field"
                className="block h-full w-full border-transparent py-2 pl-8 pr-3 text-foreground dark:text-foreground placeholder-muted-foreground focus:border-transparent focus:placeholder-muted-foreground focus:outline-none focus:ring-0 sm:text-sm bg-transparent"
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
            className="rounded-full bg-background dark:bg-background p-1 text-muted-foreground hover:text-foreground dark:hover:text-foreground focus:outline-none"
          >
            <span className="sr-only">Toggle theme</span>
            {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative rounded-full bg-background dark:bg-background p-1 text-muted-foreground hover:text-foreground dark:hover:text-foreground focus:outline-none"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Profile dropdown trigger */}
          <div className="relative ml-3">
            <div className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors">
              <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground dark:text-foreground">{profile?.name || 'Carregando...'}</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">{getRoleLabel(profile?.role)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;