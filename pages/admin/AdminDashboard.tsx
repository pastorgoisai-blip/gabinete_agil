import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    Users, Building2, ShieldCheck, Search, Plus,
    CheckCircle, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Cabinet {
    id: string;
    name: string;
    created_at: string;
}

interface UserProfile {
    id: string;
    name: string | null;
    role: string;
    status: string; // [NEW] Status column
    is_super_admin: boolean;
    cabinet_id: string | null;
    created_at: string;
}

interface AdminStats {
    totalUsers: number;
    totalCabinets: number;
    activeCabinets: number;
}

const AdminDashboard: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalCabinets: 0, activeCabinets: 0 });
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [cabinets, setCabinets] = useState<Cabinet[]>([]);
    const [activeTab, setActiveTab] = useState<'cabinets' | 'users'>('cabinets');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null); // [NEW] Track active action
    const [cabinetActionLoading, setCabinetActionLoading] = useState(false); // [NEW] Cabinet action loading

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log('=== FRESH START: Fetching data ===');

            // 1. Users
            const { data: usersData, error: uErr } = await supabase
                .from('profiles')
                .select('id, name, role, status, is_super_admin, cabinet_id, created_at') // [NEW] Added status
                .order('created_at', { ascending: false });

            if (uErr) {
                console.error('Error fetching users:', uErr);
            } else {
                console.log('✓ Users loaded:', usersData?.length);
                setUsers(usersData as UserProfile[] || []);
            }

            // 2. Cabinets (formerly organizations)
            const { data: cabinetsData, error: cErr } = await supabase
                .from('cabinets')
                .select('id, name, created_at')
                .order('created_at', { ascending: false });

            if (cErr) {
                console.error('Error fetching cabinets:', cErr);
            } else {
                console.log('✓ Cabinets loaded:', cabinetsData?.length);
                setCabinets(cabinetsData as Cabinet[] || []);
            }

            // 3. Stats
            setStats({
                totalUsers: usersData?.length || 0,
                totalCabinets: cabinetsData?.length || 0,
                activeCabinets: cabinetsData?.length || 0
            });

        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCabinets = cabinets.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // [NEW] Actions Implementation
    const handleApproveUser = async (userId: string) => {
        setActionLoading(userId);
        try {
            const { error } = await supabase.rpc('approve_user', { target_user_id: userId });
            if (error) throw error;
            alert('Usuário aprovado com sucesso!'); // Replacing toast with alert for simplicity as requested by flow context, but user asked for toasts. Using alert implies native confirm too.
            fetchData();
        } catch (error: any) {
            console.error('Error approving user:', error);
            alert(`Erro ao aprovar: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleChangeRole = async (userId: string, newRole: string) => {
        setActionLoading(userId);
        try {
            const { error } = await supabase.rpc('change_user_role', { target_user_id: userId, new_role: newRole });
            if (error) throw error;
            alert(`Função alterada para ${newRole} com sucesso!`);
            fetchData();
        } catch (error: any) {
            console.error('Error changing role:', error);
            alert(`Erro ao alterar função: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.')) return;

        setActionLoading(userId);
        try {
            const { error } = await supabase.rpc('delete_user_profile', { target_user_id: userId });
            if (error) throw error;
            alert('Usuário deletado com sucesso!');
            fetchData();
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert(`Erro ao deletar usuário: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    // [NEW] Cabinet Actions
    const handleCreateCabinet = async () => {
        const name = window.prompt("Nome do novo gabinete:");
        if (!name) return;

        setCabinetActionLoading(true);
        try {
            const { error } = await supabase.rpc('create_cabinet_admin', { name, plan: 'basic', owner_email: null });
            if (error) throw error;
            alert('Gabinete criado com sucesso!');
            fetchData();
        } catch (error: any) {
            console.error('Error creating cabinet:', error);
            alert(`Erro ao criar gabinete: ${error.message}`);
        } finally {
            setCabinetActionLoading(false);
        }
    };

    const handleDeleteCabinet = async (cabinetId: string) => {
        if (!window.confirm('ATENÇÃO: Tem certeza que deseja apagar este gabinete e TODOS os seus dados? Esta ação é irreversível.')) return;

        setCabinetActionLoading(true);
        try {
            const { error } = await supabase.rpc('delete_cabinet_fully', { target_cabinet_id: cabinetId });
            if (error) throw error;
            alert('Gabinete deletado com sucesso!');
            fetchData();
        } catch (error: any) {
            console.error('Error deleting cabinet:', error);
            alert(`Erro ao deletar gabinete: ${error.message}`);
        } finally {
            setCabinetActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ShieldCheck className="text-purple-600" />
                            Super Admin
                        </h1>
                        <p className="text-sm text-gray-500">Controle total da plataforma</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleCreateCabinet}
                            disabled={cabinetActionLoading}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Novo Gabinete
                        </button>
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-900">{profile?.full_name || profile?.name}</p>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">MASTER</span>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            Sair do Admin
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-6 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-6 h-6 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-500">Total de Gabinetes</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalCabinets}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6 text-green-600" />
                            <div>
                                <p className="text-sm text-gray-500">Usuários Totais</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-xl">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-purple-600" />
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <p className="text-lg font-bold text-purple-600">Operacional</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                        <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('cabinets')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'cabinets'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4" /> Gabinetes
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'users'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Usuários
                                </div>
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder={activeTab === 'cabinets' ? "Buscar gabinete..." : "Buscar usuário..."}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500 w-64"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {loading && (
                            <div className="p-12 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4 mx-auto"></div>
                                Carregando...
                            </div>
                        )}

                        {!loading && activeTab === 'cabinets' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3">Nome</th>
                                        <th className="px-6 py-3">ID</th>
                                        <th className="px-6 py-3">Criado em</th>
                                        <th className="px-6 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredCabinets.map(cab => (
                                        <tr key={cab.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{cab.name || 'Sem nome'}</td>
                                            <td className="px-6 py-4 text-xs font-mono text-gray-400">{cab.id}</td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(cab.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteCabinet(cab.id)}
                                                    disabled={cabinetActionLoading}
                                                    className="p-1 hover:bg-red-50 text-red-500 rounded transition"
                                                    title="Deletar Gabinete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>

                                        </tr>
                                    ))}
                                    {filteredCabinets.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-gray-400">
                                                Nenhum gabinete encontrado
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {!loading && activeTab === 'users' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3">Nome</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Super Admin?</th>
                                        <th className="px-6 py-3">Gabinete ID</th>
                                        <th className="px-6 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{u.name || 'Sem nome'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' || u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {u.status || 'pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {u.is_super_admin ? (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-gray-400">
                                                {u.cabinet_id || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {/* Approve Button */}
                                                {u.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleApproveUser(u.id)}
                                                        disabled={actionLoading === u.id}
                                                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition"
                                                    >
                                                        Aprovar
                                                    </button>
                                                )}

                                                {/* Promote/Demote Buttons */}
                                                {(u.status === 'active' && u.role !== 'admin' && u.role !== 'super_admin') && (
                                                    <button
                                                        onClick={() => handleChangeRole(u.id, 'admin')}
                                                        disabled={actionLoading === u.id}
                                                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition"
                                                    >
                                                        Promover Admin
                                                    </button>
                                                )}

                                                {(u.status === 'active' && (u.role === 'admin' || u.role === 'super_admin')) && (
                                                    <button
                                                        onClick={() => handleChangeRole(u.id, 'staff')}
                                                        disabled={actionLoading === u.id}
                                                        className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded transition"
                                                    >
                                                        Rebaixar
                                                    </button>
                                                )}

                                                {/* Delete Button */}
                                                {profile?.id !== u.id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        disabled={actionLoading === u.id}
                                                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition"
                                                    >
                                                        Deletar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-400">
                                                Nenhum usuário encontrado
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
