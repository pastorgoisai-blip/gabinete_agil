import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    Users, Building2, ShieldCheck, Search, Plus, MoreHorizontal,
    RotateCcw, Lock, CheckCircle, XCircle
} from 'lucide-react';

interface AdminStats {
    totalUsers: number;
    totalCabinets: number;
    activeCabinets: number;
}

const AdminDashboard: React.FC = () => {
    const { profile } = useAuth();
    const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalCabinets: 0, activeCabinets: 0 });
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, admins, pending

    // Estado para "Criar Usuário Manualmente"
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Stats
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact' });
            const { count: cabinetCount } = await supabase.from('cabinets').select('*', { count: 'exact' });

            // Lista de Usuários (agora possível graças às policies de Platform Admin)
            const { data: usersData, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    cabinets ( name )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setStats({
                totalUsers: userCount || 0,
                totalCabinets: cabinetCount || 0,
                activeCabinets: cabinetCount || 0 // TODO: Filtrar por status se houver
            });
            setUsers(usersData || []);

        } catch (error) {
            console.error('Erro ao carregar dados admin:', error);
            alert('Falha ao carregar dados. Verifique suas permissões.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);

        try {
            // Usando uma Edge Function hipotética ou inserção direta se Policies permitirem
            // Como estamos sem service_role no client, a melhor aposta é tentar o Sign Up
            // Mas o usuário quer bypass...
            // VAMOS TENTAR INSERIR NO PROFILES DIRETO SE O AUTH EXISTIR, MAS...
            // O ideal para "Criar na Força" é via SQL Function que criamos.

            // Mas vamos usar a função `force_create_admin_profile` se o ID já existir no Auth,
            // ou instruir o usuário que ele precisa se cadastrar no Auth primeiro.

            // Abordagem Híbrida:
            alert('Para criar usuários totalmente novos (Auth + Profile), use o Signup normal.\n\nEsta função promoveria um email existente para Admin.');

        } catch (error) {
            console.error(error);
        } finally {
            setCreateLoading(false);
            setShowCreateModal(false);
        }
    };

    const promoteToAdmin = async (email: string) => {
        if (!confirm(`Promover ${email} a Super Admin Global?`)) return;

        const { data, error } = await supabase.rpc('make_me_admin', { target_email: email });

        if (error) alert('Erro: ' + error.message);
        else {
            alert(data);
            fetchData();
        }
    };

    const filteredUsers = users.filter(user =>
        (user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filter === 'all' || (filter === 'admins' && user.is_platform_admin))
    );

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ShieldCheck className="text-purple-600" />
                            Painel Super Admin
                        </h1>
                        <p className="text-gray-500">Gestão global do SaaS (Gabinete Ágil)</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{profile?.name}</p>
                            <p className="text-xs text-purple-600 font-mono">PLATFORM OWNER</p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            Voltar ao App
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Usuários Registrados</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.totalUsers}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-full text-green-600">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Gabinetes Ativos</p>
                            <h3 className="text-3xl font-bold text-gray-900">{stats.activeCabinets}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                        <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Status do Sistema</p>
                            <h3 className="text-lg font-bold text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-5 h-5" /> Operacional
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h2 className="text-lg font-bold text-gray-900">Gerenciamento de Usuários</h2>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar usuário..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500 w-full sm:w-64"
                                />
                            </div>
                            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Novo
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Usuário</th>
                                    <th className="px-6 py-3">Gabinete</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Carregando usuários...
                                        </td>
                                    </tr>
                                ) : filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                                    {user.name?.charAt(0) || user.email?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-gray-500 text-xs">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.cabinets ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <Building2 className="w-3 h-3" />
                                                    {user.cabinets.name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">Sem gabinete</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_platform_admin ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                                    SUPER ADMIN
                                                </span>
                                            ) : (
                                                <span className="capitalize text-gray-700">{user.role}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {user.status === 'active' ? 'Ativo' : 'Pendente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => promoteToAdmin(user.email)}
                                                className="text-gray-400 hover:text-purple-600 font-medium text-xs mr-3"
                                                title="Promover a Admin"
                                            >
                                                Promover
                                            </button>
                                            <button className="text-gray-400 hover:text-blue-600">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
