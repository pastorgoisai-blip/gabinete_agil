import React, { useState } from 'react';
import { 
  ChevronRight, 
  Home, 
  Camera, 
  User, 
  CheckCircle, 
  Lock, 
  Eye, 
  Info,
  Save,
  Shield,
  AlertTriangle,
  Activity,
  Monitor,
  FileText,
  LogIn,
  Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

const UserEdit: React.FC = () => {
  const navigate = useNavigate();

  // SIMULAÇÃO: No futuro, isso virá do seu contexto de autenticação (AuthContext)
  const currentUserRole = 'admin'; 
  const canEditPermissions = currentUserRole === 'admin';

  // Estado para o Modal de Log
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Mock de dados de Log
  const activityLogs = [
    { id: 1, action: 'Login no Sistema', date: 'Hoje, 09:41', details: 'IP: 192.168.1.10 - Chrome (Windows)', type: 'login' },
    { id: 2, action: 'Edição de Eleitor', date: 'Hoje, 08:15', details: 'Alterou dados de: Maria Silva (Telefone)', type: 'edit' },
    { id: 3, action: 'Exportação de Relatório', date: 'Ontem, 16:30', details: 'Relatório Geral de Eleitores (PDF)', type: 'file' },
    { id: 4, action: 'Alteração de Senha', date: '10 Ago, 18:30', details: 'Alterou a própria senha de acesso', type: 'security' },
    { id: 5, action: 'Login no Sistema', date: '10 Ago, 08:00', details: 'IP: 192.168.1.10 - Chrome (Windows)', type: 'login' },
    { id: 6, action: 'Criação de Demanda', date: '09 Ago, 14:20', details: 'Nova demanda: Tapa-buraco Rua 5', type: 'edit' },
  ];

  // Helper para ícones do log
  const getLogIcon = (type: string) => {
    switch (type) {
      case 'login': return <LogIn className="w-4 h-4 text-blue-500" />;
      case 'edit': return <Edit3 className="w-4 h-4 text-amber-500" />;
      case 'file': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'security': return <Lock className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  // Mock de módulos para permissões
  const modules = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'voters', label: 'Eleitores' },
    { id: 'demands', label: 'Demandas' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'legislative', label: 'Espaço Legislativo' },
    { id: 'projects', label: 'Projetos' },
    { id: 'agent', label: 'Agente de Mensagens' },
    { id: 'base', label: 'Base Eleitoral' },
    { id: 'talents', label: 'Banco de Talentos' },
    { id: 'users', label: 'Usuários' },
    { id: 'whatsapp', label: 'Chat WhatsApp' },
    { id: 'notifications', label: 'Notificações' },
    { id: 'settings', label: 'Configurações' },
    { id: 'honored', label: 'Homenageados' },
  ];

  // Estado inicial das permissões
  const [permissions, setPermissions] = useState<Record<string, { view: boolean; edit: boolean; delete: boolean }>>({
    dashboard: { view: true, edit: true, delete: true },
    agenda: { view: true, edit: false, delete: false },
    voters: { view: true, edit: true, delete: true },
    demands: { view: true, edit: true, delete: true },
  });

  const handlePermissionChange = (moduleId: string, type: 'view' | 'edit' | 'delete') => {
    if (!canEditPermissions) return; 
    
    setPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId] || { view: false, edit: false, delete: false },
        [type]: !prev[moduleId]?.[type]
      }
    }));
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fade-in pb-10">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <a className="hover:text-primary-600 transition-colors flex items-center gap-1" href="/">
          <Home className="w-4 h-4" />
        </a>
        <ChevronRight className="w-4 h-4" />
        <a className="hover:text-primary-600 transition-colors" href="#/users">Usuários</a>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 dark:text-white font-medium">Editar Perfil</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-slate-700 pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Editar Perfil de Usuário</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie as informações pessoais, configurações de acesso e permissões.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsLogModalOpen(true)}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Ver Log de Atividades
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center text-center shadow-sm">
            <div className="relative group cursor-pointer mb-4">
              <div className="w-32 h-32 rounded-full bg-cover bg-center ring-4 ring-slate-100 dark:ring-slate-900" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCXiRCepx6ffc9A6gVaFmcjN5FLcw1wAatdiDBImtTaBCnFIq7V8ElVV1LfTkZthdwIDr5_NkAqf2rZwcKsfgbtl1MmaNI1M8HTnmObIXXVPbp3CYVgjS_J9DtHpDoicOrXIQQ7Ed4fsh2xHOdeM5Aivv_Y-oYkaILV6M6z7wsg3uyvjjJnjO-VYzE7NKuMhPcjESdi_zdQafradtnUjzFPqO5LfO_S9VaEvmAi8GfeG2H2vlcXtGyqEOcbCOcjasxhxN3K_HJjWzc")'}}></div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                <Camera className="text-white w-8 h-8" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Carlos Silva</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Gerente de Campanha</p>
            <div className="w-full h-px bg-gray-200 dark:bg-slate-700 mb-4"></div>
            <div className="w-full flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">ID do Usuário</span>
                <span className="text-slate-900 dark:text-white font-mono">#USR-2024-88</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Criado em</span>
                <span className="text-slate-900 dark:text-white">12 Ago, 2023</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Último login</span>
                <span className="text-slate-900 dark:text-white">Hoje, 09:41</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <form className="flex flex-col gap-6">
            
            {/* Personal Information Section */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Informações Pessoais</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400" htmlFor="fullName">Nome Completo</label>
                  <div className="relative">
                    <input 
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-all placeholder-slate-400" 
                      id="fullName" 
                      type="text" 
                      defaultValue="Carlos Silva"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400" htmlFor="email">Email Corporativo</label>
                  <div className="relative">
                    <input 
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-all placeholder-slate-400" 
                      id="email" 
                      type="email" 
                      defaultValue="carlos.silva@campanha2024.com"
                    />
                    <div className="absolute right-3 top-2.5 text-green-500" title="Email verificado">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400" htmlFor="role">Função / Cargo</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none appearance-none cursor-pointer" 
                      id="role"
                      defaultValue="manager"
                    >
                      <option value="manager">Gerente de Campanha</option>
                      <option value="admin">Administrador do Sistema</option>
                      <option value="coordinator">Coordenador Regional</option>
                      <option value="volunteer">Voluntário</option>
                    </select>
                    <span className="absolute right-3 top-3 text-slate-400 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400" htmlFor="status">Status da Conta</label>
                  <div className="flex items-center justify-between h-[46px] px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <span className="text-sm text-slate-900 dark:text-white">Ativo</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-600/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm relative transition-opacity ${!canEditPermissions ? 'opacity-80' : ''}`}>
              
              {!canEditPermissions && (
                <div className="absolute inset-0 z-10 bg-gray-50/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 flex items-center gap-3 max-w-sm">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Edição Bloqueada</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Apenas administradores podem alterar as permissões de acesso.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${canEditPermissions ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-gray-100 text-gray-500'}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Permissões do Usuário</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Defina o que este usuário pode ver ou alterar no sistema.</p>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-gray-100 dark:divide-slate-700">
                {modules.map((module) => {
                  const perms = permissions[module.id] || { view: false, edit: false, delete: false };
                  return (
                    <div key={module.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3">
                      <div className="font-medium text-slate-700 dark:text-slate-200 text-sm">
                        {module.label}
                      </div>
                      <div className="flex items-center gap-6">
                        <label className={`flex items-center gap-2 group ${canEditPermissions ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                          <input 
                            type="checkbox" 
                            disabled={!canEditPermissions}
                            checked={perms.view}
                            onChange={() => handlePermissionChange(module.id, 'view')}
                            className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 dark:bg-slate-900"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">Visualizar</span>
                        </label>
                        <label className={`flex items-center gap-2 group ${canEditPermissions ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                          <input 
                            type="checkbox" 
                            disabled={!canEditPermissions}
                            checked={perms.edit}
                            onChange={() => handlePermissionChange(module.id, 'edit')}
                            className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 dark:bg-slate-900"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">Editar</span>
                        </label>
                        <label className={`flex items-center gap-2 group ${canEditPermissions ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                          <input 
                            type="checkbox" 
                            disabled={!canEditPermissions}
                            checked={perms.delete}
                            onChange={() => handlePermissionChange(module.id, 'delete')}
                            className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 dark:bg-slate-900"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">Excluir</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Segurança</h3>
                </div>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium hover:underline" type="button">Resetar via Email</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400" htmlFor="newPassword">Nova Senha</label>
                  <div className="relative">
                    <input 
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-all placeholder-slate-400" 
                      id="newPassword" 
                      placeholder="••••••••" 
                      type="password"
                    />
                    <button className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors" type="button">
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400" htmlFor="confirmPassword">Confirmar Nova Senha</label>
                  <div className="relative">
                    <input 
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-all placeholder-slate-400" 
                      id="confirmPassword" 
                      placeholder="••••••••" 
                      type="password"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-primary-600" />
                <p>A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, números e símbolos especiais.</p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <button 
                onClick={() => navigate('/users')}
                className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-medium text-sm" 
                type="button"
              >
                Cancelar
              </button>
              <button className="px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/25 transition-all font-medium text-sm flex items-center gap-2" type="submit">
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Log Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log de Atividades - Carlos Silva"
        footer={
          <button 
            onClick={() => setIsLogModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        }
      >
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute top-0 bottom-0 left-[19px] w-px bg-gray-200 dark:bg-slate-700"></div>

          <div className="space-y-6">
            {activityLogs.map((log) => (
              <div key={log.id} className="relative flex items-start gap-4">
                {/* Icon bubble */}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
                  {getLogIcon(log.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 pt-1.5">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{log.action}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{log.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{log.details}</p>
                  
                  {log.type === 'login' && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                      <Monitor className="w-3 h-3" />
                      <span>Sessão segura</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default UserEdit;