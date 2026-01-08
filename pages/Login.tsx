import React, { useState } from 'react';
import { Landmark, Mail, Lock, Eye, EyeOff, Building2, ChevronDown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300 font-sans relative">
      
      {/* Theme Toggle (Absolute) */}
      <button 
        className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-700"
        onClick={toggleTheme}
      >
        {isDark ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
        ) : (
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        )}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 ring-1 ring-gray-900/5 dark:ring-white/10">
        
        {/* Header with Pattern */}
        <div className="relative bg-gradient-to-br from-primary-600 to-blue-700 p-10 text-center">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
          <div className="relative z-10 flex flex-col items-center justify-center text-white">
            <div className="bg-white/20 backdrop-blur-md p-3.5 rounded-2xl mb-4 shadow-inner ring-1 ring-white/30">
              <Zap className="w-10 h-10 text-yellow-300 fill-yellow-300/20" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-[0.3em] font-bold text-blue-200 mb-1">Gabinete</span>
              <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-sm">Ágil<span className="text-yellow-300">.</span></h1>
            </div>
            <p className="text-blue-100 text-sm font-medium opacity-90 mt-2">Portal de Gestão Política & CRM</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8 sm:p-10 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Acesso ao Sistema</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Entre com suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Organization Select */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="organization">
                Organização
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="text-slate-400 w-5 h-5" />
                </div>
                <select 
                  className="block w-full pl-10 pr-10 py-2.5 text-base border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow sm:text-sm shadow-sm appearance-none cursor-pointer"
                  id="organization" 
                  name="organization"
                  defaultValue=""
                >
                  <option disabled value="">Selecione uma organização...</option>
                  <option value="org1">Gabinete Wederson Lopes</option>
                  <option value="org2">Câmara Municipal de Anápolis</option>
                  <option value="org3">Administração Geral</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="text-slate-400 w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-slate-400 w-5 h-5" />
                </div>
                <input 
                  id="email" 
                  type="email" 
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow sm:text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500" 
                  placeholder="nome@campanha.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-slate-400 w-5 h-5" />
                </div>
                <input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow sm:text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500" 
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 transition-all transform hover:-translate-y-0.5"
              >
                Entrar
              </button>
            </div>
          </form>

          <div className="flex flex-col items-center space-y-4 pt-2">
            <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              Esqueci minha senha
            </a>
            <div className="text-xs text-slate-400 dark:text-slate-500 text-center mt-6 border-t border-gray-100 dark:border-slate-700 w-full pt-4">
              © 2025 Gabinete Ágil. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;