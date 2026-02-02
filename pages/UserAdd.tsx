import React from 'react';
import { User, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserAdd: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-4 animate-fade-in">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-start gap-4 pb-6 border-b border-border dark:border-border">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground tracking-tight">Adicionar Novo Usuário</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl">
            Preencha os dados abaixo para cadastrar um novo membro na equipe da campanha.
            Certifique-se de atribuir a função correta para controle de acesso.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-card dark:bg-card border border-border dark:border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col gap-8">

          {/* Personal Info Section */}
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-semibold text-foreground dark:text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Informações Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col gap-2 group">
                <span className="text-sm font-medium text-muted-foreground group-focus-within:text-primary-600 transition-colors">Nome Completo</span>
                <div className="relative">
                  <input
                    className="w-full rounded-lg bg-background dark:bg-background border border-border dark:border-border text-foreground dark:text-foreground placeholder-muted-foreground focus:border-primary-600 focus:ring-1 focus:ring-primary-600 h-12 px-4 outline-none transition-all"
                    placeholder="Ex: João Silva"
                    type="text"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-2 group">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-focus-within:text-primary-600 transition-colors">Email Corporativo</span>
                <div className="relative">
                  <input
                    className="w-full rounded-lg bg-background dark:bg-background border border-border dark:border-border text-foreground dark:text-foreground placeholder-muted-foreground focus:border-primary-600 focus:ring-1 focus:ring-primary-600 h-12 px-4 outline-none transition-all"
                    placeholder="joao@campanha.com"
                    type="email"
                  />
                  <Mail className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
                </div>
              </label>
            </div>
          </div>

          {/* Access & Security Section */}
          <div className="flex flex-col gap-6 pt-6 border-t border-border dark:border-border">
            <h3 className="text-lg font-semibold text-foreground dark:text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary-600" />
              Acesso e Segurança
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role Selection */}
              <label className="flex flex-col gap-2 group">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-focus-within:text-primary-600 transition-colors">Função no Sistema</span>
                <div className="relative">
                  <select className="w-full appearance-none rounded-lg bg-background dark:bg-background border border-border dark:border-border text-foreground dark:text-foreground focus:border-primary-600 focus:ring-1 focus:ring-primary-600 h-12 px-4 pr-10 outline-none transition-all cursor-pointer">
                    <option disabled selected value="">Selecione uma função</option>
                    <option value="admin">Administrador</option>
                    <option value="manager">Gerente de Campanha</option>
                    <option value="finance">Financeiro</option>
                    <option value="volunteer">Voluntário</option>
                  </select>
                  <span className="absolute right-4 top-4 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </span>
                </div>
              </label>

              {/* Status Toggle */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Status da Conta</span>
                <div className="h-12 flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-3 text-sm font-medium text-slate-900 dark:text-white">Ativo</span>
                  </label>
                </div>
              </div>

              {/* Password */}
              <label className="flex flex-col gap-2 group">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-focus-within:text-primary-600 transition-colors">Senha</span>
                <div className="relative">
                  <input
                    className="w-full rounded-lg bg-background dark:bg-background border border-border dark:border-border text-foreground dark:text-foreground placeholder-muted-foreground focus:border-primary-600 focus:ring-1 focus:ring-primary-600 h-12 px-4 outline-none transition-all"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </label>

              {/* Confirm Password */}
              <label className="flex flex-col gap-2 group">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-focus-within:text-primary-600 transition-colors">Confirmar Senha</span>
                <div className="relative">
                  <input
                    className="w-full rounded-lg bg-background dark:bg-background border border-border dark:border-border text-foreground dark:text-foreground placeholder-muted-foreground focus:border-primary-600 focus:ring-1 focus:ring-primary-600 h-12 px-4 outline-none transition-all"
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="bg-muted/50 dark:bg-muted/50 px-6 py-4 md:px-8 border-t border-border dark:border-border flex items-center justify-between flex-wrap gap-4">
          <button className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm font-medium transition-colors">
            Limpar formulário
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/users')}
              className="h-10 px-6 rounded-lg border border-border dark:border-border text-foreground dark:text-foreground text-sm font-medium hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button className="h-10 px-6 rounded-lg bg-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" />
              Salvar Usuário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAdd;