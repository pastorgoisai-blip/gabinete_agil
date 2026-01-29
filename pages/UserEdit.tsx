import React, { useState, useEffect } from 'react';
import {
  ChevronRight, Home, Camera, User, CheckCircle, Lock, Eye, Info,
  Save, Shield, Activity, Monitor, FileText, LogIn, Edit3, AlertTriangle
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { UserProfile } from '../contexts/AuthContext';
import { Calendar, Clock, MapPin } from 'lucide-react';

const ActivityLogViewer: React.FC<{ userId?: string }> = ({ userId }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('system_access_logs')
          .select('*')
          .eq('user_id', userId)
          .order('accessed_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [userId]);

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando histórico...</div>;
  if (!logs.length) return <div className="p-8 text-center text-slate-500">Nenhuma atividade registrada recente.</div>;

  return (
    <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6">
      {logs.map((log) => (
        <div key={log.id} className="relative pl-6">
          <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-white bg-primary-500 dark:border-slate-900"></div>
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              Acesso ao Sistema
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-3 h-3" />
              {new Date(log.accessed_at).toLocaleDateString('pt-BR')}
              <Clock className="w-3 h-3 ml-1" />
              {new Date(log.accessed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            {log.metadata?.userAgent && (
              <div className="mt-1 text-xs text-slate-400 font-mono truncate max-w-xs">
                {log.metadata.userAgent}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const UserEdit: React.FC = () => {
  const navigate = useNavigate();
  const { profile: currentUser, user: authUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  // const [searchParams] = useSearchParams(); // Removed
  const targetUserId = id; // If editing another user

  // Determine if we are editing self or another
  const isEditingSelf = !targetUserId || targetUserId === currentUser?.id;
  const canEditPermissions = currentUser?.role === 'admin' || currentUser?.is_super_admin;

  // Form State
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'volunteer',
    status: 'active',
    bio: '',
    avatar_url: ''
  });

  // Password State
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  // Permissions State
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
    { id: 'users', label: 'Usuários' },
    { id: 'whatsapp', label: 'Chat WhatsApp' },
    { id: 'notifications', label: 'Notificações' },
    { id: 'settings', label: 'Configurações' },
    { id: 'honored', label: 'Homenageados' },
  ];

  const [permissions, setPermissions] = useState<Record<string, { view: boolean; edit: boolean; delete: boolean }>>({});
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchTargetUser = async () => {
      setLoading(true);
      try {
        // Determine ID to fetch
        const idToFetch = targetUserId || currentUser?.id;

        if (!idToFetch) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', idToFetch)
          .single();

        if (error) throw error;

        setTargetProfile(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '', // Check if schema has phone
          role: data.role || 'volunteer',
          status: data.status || 'active',
          bio: data.bio || '',
          avatar_url: data.avatar_url || ''
        });

        // Initialize permissions from DB or defaults
        const dbPerms = data.permissions || {};
        const initialPerms: any = {};
        modules.forEach(m => {
          initialPerms[m.id] = dbPerms[m.id] || { view: false, edit: false, delete: false };
        });
        setPermissions(initialPerms);

      } catch (err: any) {
        console.error('Error fetching user:', err);
        alert('Erro ao carregar usuário.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) fetchTargetUser();
  }, [currentUser, targetUserId]);

  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchLastLogin = async () => {
      if (!targetProfile?.id) return;
      const { data } = await supabase
        .from('system_access_logs')
        .select('accessed_at')
        .eq('user_id', targetProfile.id)
        .order('accessed_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setLastLoginDate(new Date(data.accessed_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
    };
    fetchLastLogin();
  }, [targetProfile]);



  const handlePermissionChange = (moduleId: string, type: 'view' | 'edit' | 'delete') => {
    if (!canEditPermissions) return;
    setPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [type]: !prev[moduleId]?.[type]
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!targetProfile?.id) return;

      // 1. Update Profile & Permissions
      const updates: any = {
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
        bio: formData.bio,
        permissions: permissions, // Save jsonb
        updated_at: new Date().toISOString()
      };

      // Only update avatar if changed (handled by upload separately usually, but preserving here)
      if (formData.avatar_url) updates.avatar_url = formData.avatar_url;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', targetProfile.id);

      if (error) throw error;

      // 2. Handle Password Change (if provided)
      if (passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          alert('As senhas não conferem.');
          setSaving(false);
          return;
        }

        // Admin updating another user's password requires service role usually, or specific admin API.
        // Supabase Client SDK `updateUser` works for LOGGED IN user.
        // To update ANOTHER user, we need `supabase.auth.admin.updateUserById` which is server-side only (service_role).
        // Or if we are editing SELF:
        if (isEditingSelf) {
          const { error: pwdError } = await supabase.auth.updateUser({ password: passwordData.newPassword });
          if (pwdError) throw pwdError;
          alert('Senha atualizada com sucesso!');
        } else {
          alert('Troca de senha de outros usuários requer função administrativa no servidor (backend). Envie um email de reset.');
          // Alternatively trigger reset password email
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetProfile.email || '');
          if (resetError) console.error("Reset Email Error", resetError);
          else alert(`Email de redefinição enviado para ${targetProfile.email}`);
        }
      }

      alert('Perfil atualizado com sucesso!');
      // Reload?
    } catch (err: any) {
      console.error('Error updating profile:', err);
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${targetProfile?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));

    } catch (error: any) {
      alert(`Erro no upload: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

  const formattedDate = targetProfile?.created_at
    ? new Date(targetProfile.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

  const lastLoginDisplay = lastLoginDate || (targetProfile?.last_access
    ? new Date(targetProfile.last_access).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : 'Nunca');

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full animate-fade-in pb-10">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-primary-600 transition-colors flex items-center gap-1">
          <Home className="w-4 h-4" />
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/users" className="hover:text-primary-600 transition-colors">Usuários</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 dark:text-white font-medium">Editar Perfil</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-slate-700 pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isEditingSelf ? 'Meu Perfil' : `Editar: ${targetProfile?.name}`}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie informações pessoais, acesso e permissões.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center text-center shadow-sm">
            <div className="relative group cursor-pointer mb-4">
              <div
                className="w-32 h-32 rounded-full bg-cover bg-center ring-4 ring-slate-100 dark:ring-slate-900 bg-gray-200 flex items-center justify-center overflow-hidden"
                style={formData.avatar_url ? { backgroundImage: `url("${formData.avatar_url}")` } : {}}
              >
                {!formData.avatar_url && <User className="w-16 h-16 text-gray-400" />}
              </div>
              <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] cursor-pointer">
                <Camera className="text-white w-8 h-8" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{formData.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 capitalize">{formData.role}</p>
            <div className="w-full h-px bg-gray-200 dark:bg-slate-700 mb-4"></div>
            <div className="w-full flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">ID do Usuário</span>
                <span className="text-slate-900 dark:text-white font-mono text-xs">{targetProfile?.id?.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Criado em</span>
                <span className="text-slate-900 dark:text-white">{formattedDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Último login</span>
                <span className="text-slate-900 dark:text-white">{lastLoginDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <form onSubmit={handleSave} className="flex flex-col gap-6">

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
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-all placeholder-slate-400"
                    id="fullName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400" htmlFor="email">Email (Não editável)</label>
                  <div className="relative">
                    <input
                      disabled
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      id="email"
                      type="email"
                      value={targetProfile?.email}
                    />
                    <div className="absolute right-3 top-2.5 text-green-500" title="Email verificado">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400" htmlFor="phone">Telefone</label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-all placeholder-slate-400"
                    id="phone"
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400" htmlFor="role">Função / Cargo</label>
                  <div className="relative">
                    <select
                      disabled={!canEditPermissions}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none appearance-none cursor-pointer disabled:opacity-60"
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="manager">Gerente de Campanha</option>
                      <option value="admin">Administrador do Sistema</option>
                      <option value="coordinator">Coordenador Regional</option>
                      <option value="volunteer">Voluntário</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400" htmlFor="status">Status</label>
                  <div className="flex items-center gap-3 h-[46px]">
                    <span className={`px-3 py-1 rounded text-sm font-bold ${formData.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {formData.status === 'active' ? 'ATO' : 'INATIVO'}
                    </span>
                    {canEditPermissions && (
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, status: p.status === 'active' ? 'inactive' : 'active' }))}
                        className="text-sm underline text-blue-600 hover:text-blue-800"
                      >
                        Alternar
                      </button>
                    )}
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

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <p className="font-bold">Como funcionam as permissões?</p>
                  <p>
                    <span className="font-semibold">Visualizar:</span> Permite acesso de leitura. Se desmarcado, o usuário não verá este módulo no menu.
                  </p>
                  <p>
                    <span className="font-semibold">Editar/Excluir:</span> Permitem alterar ou remover dados. Requerem que "Visualizar" também esteja marcado para funcionarem corretamente.
                  </p>
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

            {/* Security Section (Change Password) - Only for Self or if implemented globally */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Segurança</h3>
                </div>
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
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                    />
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
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-primary-600" />
                <p>A senha deve conter pelo menos 8 caracteres.</p>
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
              <button
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/25 transition-all font-medium text-sm flex items-center gap-2 disabled:opacity-70"
                type="submit"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Log Modal - could be connected to system_access_logs in future */}
      {/* Log Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Histórico de Atividades"
        footer={null}
      >
        <ActivityLogViewer userId={targetProfile?.id} />
      </Modal>

    </div>
  );
};

export default UserEdit;