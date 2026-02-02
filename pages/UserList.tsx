import React, { useState } from 'react';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Plus,
  ShieldCheck,
  Briefcase,
  Heart,
  Send,
  Copy,
  Check,
  X,
  User
} from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTeam } from '../hooks/useTeam';
import { UserProfile } from '../contexts/AuthContext';
import ProductivityDashboard from '../components/ProductivityDashboard';

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  // Data Fetching
  const { users, loading: teamLoading } = useTeam();

  // Local State for Filters & Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setGeneratedLink(null);
    try {
      const { data: token, error } = await supabase.rpc('create_invite_token', {
        target_email: inviteEmail,
        target_role: inviteRole
      });

      if (error) throw error;

      const link = `${window.location.origin}/#/invite/${token}`;
      setGeneratedLink(link);
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar convite');
    } finally {
      setInviteLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter Logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || user.status === statusFilter;
    const matchesRole = roleFilter === '' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Role Icon Helper
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return <ShieldCheck className="w-4 h-4 text-primary-600" />;
      case 'volunteer':
        return <Heart className="w-4 h-4 text-pink-500" />;
      default:
        return <Briefcase className="w-4 h-4 text-slate-400" />;
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    const config = {
      active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', dot: 'bg-green-600 dark:bg-green-400', label: 'Ativo' },
      inactive: { bg: 'bg-muted dark:bg-muted', text: 'text-muted-foreground dark:text-muted-foreground', dot: 'bg-muted-foreground dark:bg-muted-foreground', label: 'Inativo' },
      pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-400', dot: 'bg-amber-600 dark:bg-amber-400', label: 'Pendente' },
    };

    const statusKey = status as keyof typeof config;
    const theme = config[statusKey] || config.inactive;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${theme.bg} ${theme.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`}></span>
        {theme.label}
      </span>
    );
  };

  // Proteção de Rota (Security Layer 2)
  if (authLoading) return null;
  if (!profile?.is_super_admin && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm">
          <a className="text-slate-500 dark:text-slate-400 font-medium hover:text-primary-600 transition-colors" href="#">Dashboard</a>
          <ChevronRight className="text-slate-400 w-4 h-4" />
          <span className="text-slate-900 dark:text-white font-medium">Gerenciamento de Usuários</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground dark:text-foreground">Gerenciamento de Usuários</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie o acesso, permissões e monitore a atividade da equipe.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-card dark:bg-card border border-border dark:border-border text-foreground dark:text-foreground font-bold h-10 px-5 rounded-lg flex items-center gap-2 hover:bg-muted dark:hover:bg-muted transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Convidar</span>
            </button>
            <button
              onClick={() => navigate('/users/new')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold h-10 px-5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>
      </div>

      {/* Team Productivity Dashboard */}
      <ProductivityDashboard scope="cabinet" showTitle={true} />

      {/* Filter & Search Bar */}
      <div className="bg-card dark:bg-card border border-border dark:border-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="relative block h-11">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                className="block w-full h-full rounded-lg border-border dark:border-border bg-background dark:bg-background pl-10 pr-4 text-sm text-foreground dark:text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-all"
                placeholder="Buscar por nome ou email..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
          </div>
          <div className="flex gap-4">
            <div className="w-full lg:w-48">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none w-full h-11 bg-background dark:bg-background border border-border dark:border-border text-foreground dark:text-foreground text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block px-3 py-2.5 outline-none"
                >
                  <option value="">Status: Todos</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
            </div>
            <div className="w-full lg:w-48">
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="appearance-none w-full h-11 bg-background dark:bg-background border border-border dark:border-border text-foreground dark:text-foreground text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block px-3 py-2.5 outline-none"
                >
                  <option value="">Função: Todas</option>
                  <option value="admin">Administrador</option>
                  <option value="staff">Equipe</option>
                  <option value="volunteer">Voluntário</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card dark:bg-card border border-border dark:border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 dark:bg-muted/50 border-b border-border dark:border-border">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Usuário</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden sm:table-cell">Função</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden lg:table-cell">Último Acesso</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border text-sm">

              {teamLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <span className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></span>
                    </div>
                    Carregando equipe...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum membro encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/users/edit/${user.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatar_url ? (
                          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover" style={{ backgroundImage: `url("${user.avatar_url}")` }}></div>
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="font-medium text-foreground dark:text-foreground">{user.name}</div>
                          <div className="text-slate-500 dark:text-slate-400 text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status || 'pending')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                      {/* Mocking last access for now or using a helper if column exists */}
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="text-muted-foreground hover:text-foreground dark:hover:text-foreground p-1 rounded hover:bg-muted dark:hover:bg-muted transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination (Optional: Keep static or implement infinite scroll later) */}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-card dark:bg-card rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up border border-border dark:border-border">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground dark:text-foreground">Convidar Membro</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gere um link seguro para cadastro com acesso pré-configurado.</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!generatedLink ? (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email do Convidado</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full rounded-lg border-border dark:border-border bg-background dark:bg-background px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Função</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full rounded-lg border-border dark:border-border bg-background dark:bg-background px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="staff">Staff (Equipe)</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                >
                  {inviteLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Send className="w-4 h-4" />}
                  Gerar Link de Convite
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-300 font-medium flex items-center gap-2">
                    <Check className="w-4 h-4" /> Convite gerado com sucesso!
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link de Acesso</label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={generatedLink}
                      className="flex-1 rounded-lg border-border dark:border-border bg-muted dark:bg-muted px-3 py-2 text-sm text-foreground dark:text-foreground font-mono"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                      title="Copiar"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Envie este link para o membro. Expira em 48h.</p>
                </div>
                <button
                  onClick={() => { setGeneratedLink(null); setInviteEmail(''); setShowInviteModal(false); }}
                  className="w-full bg-muted dark:bg-muted hover:bg-slate-200 dark:hover:bg-slate-600 text-foreground dark:text-foreground font-medium py-2.5 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;