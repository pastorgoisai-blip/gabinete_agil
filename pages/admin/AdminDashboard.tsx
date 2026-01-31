import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminCabinets, AdminCabinet } from '../../hooks/admin/useAdminCabinets';
import { useAdminUsers } from '../../hooks/admin/useAdminUsers';
import { useAdminStats } from '../../hooks/admin/useAdminStats';
import {
    Users, Building2, ShieldCheck, Search, Plus,
    CheckCircle, Trash2, Settings, AlertTriangle, Activity, Database, DollarSign, Archive, RefreshCw, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import Modal from '../../components/Modal';

// Mock data for charts if API doesn't provide history yet
const MOCK_MRR_DATA = [
    { month: 'Jan', value: 5000 },
    { month: 'Fev', value: 5500 },
    { month: 'Mar', value: 6800 },
    { month: 'Abr', value: 7200 },
    { month: 'Mai', value: 8500 },
    { month: 'Jun', value: 9200 },
];

const AdminDashboard: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();

    // Hooks
    const { cabinets, loading: loadingCabs, createCabinet, updateCabinet, archiveCabinet, reactivateCabinet, listCabinets } = useAdminCabinets();
    const { stats, loading: loadingStats } = useAdminStats();
    const { users, loading: loadingUsers, searchUsers } = useAdminUsers();

    // UI State
    const [activeTab, setActiveTab] = useState<'overview' | 'cabinets' | 'users'>('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
    const [selectedCabinet, setSelectedCabinet] = useState<AdminCabinet | null>(null);

    // Form State
    const [cabinetForm, setCabinetForm] = useState({ name: '', plan_tier: 'Pro', mrr_value: 0 });

    const filteredCabinets = cabinets.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    React.useEffect(() => {
        listCabinets();
    }, [listCabinets]);

    const handleOpenCreate = () => {
        setCabinetForm({ name: '', plan_tier: 'Pro', mrr_value: 199 });
        setModalMode('create');
    };

    const handleOpenEdit = (cab: AdminCabinet) => {
        setSelectedCabinet(cab);
        setCabinetForm({ name: cab.name, plan_tier: cab.plan_tier, mrr_value: cab.mrr_value });
        setModalMode('edit');
    };

    const handleSaveCabinet = async () => {
        if (modalMode === 'create') {
            const { success, error } = await createCabinet(cabinetForm);
            if (success) {
                alert('Gabinete criado com sucesso!');
                setModalMode(null);
            } else {
                alert('Erro ao criar: ' + error);
            }
        } else if (modalMode === 'edit' && selectedCabinet) {
            const { success, error } = await updateCabinet(selectedCabinet.id, cabinetForm);
            if (success) {
                alert('Gabinete atualizado!');
                setModalMode(null);
            } else {
                alert('Erro ao atualizar: ' + error);
            }
        }
    };

    const handleArchiveToggle = async (cab: AdminCabinet) => {
        if (!window.confirm(`Tem certeza que deseja ${cab.status === 'archived' ? 'reativar' : 'arquivar'} o gabinete ${cab.name}?`)) return;

        let result;
        if (cab.status === 'archived') {
            result = await reactivateCabinet(cab.id);
        } else {
            result = await archiveCabinet(cab.id);
        }

        if (result.success) {
            listCabinets(); // Refresh list specially for status update
        } else {
            alert('Erro: ' + result.error);
        }
    };

    // --- RENDER HELPERS ---
    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            active: 'bg-green-100 text-green-700 border-green-200',
            trial: 'bg-blue-100 text-blue-700 border-blue-200',
            suspended: 'bg-red-100 text-red-700 border-red-200',
            archived: 'bg-gray-100 text-gray-500 border-gray-200',
        };
        const label = {
            active: 'Ativo',
            trial: 'Trial',
            suspended: 'Suspenso',
            archived: 'Arquivado',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border uppercase ${styles[status as keyof typeof styles] || styles.active}`}>
                {label[status as keyof typeof label] || status}
            </span>
        );
    };

    if (!profile?.is_super_admin) {
        return <div className="p-8 text-center text-red-600 font-bold">Acesso Negado.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-purple-600 text-white p-2 rounded-lg"><ShieldCheck size={24} /></span>
                            Business Suite
                        </h1>
                        <p className="text-sm text-gray-500 ml-1">Gabinete Ágil Control Center</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/')} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">
                            Voltar ao App
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-white p-1 rounded-xl w-fit shadow-sm border border-gray-100">
                    {[
                        { id: 'overview', label: 'Visão Financeira', icon: Activity },
                        { id: 'cabinets', label: 'Gestão de Gabinetes', icon: Building2 },
                        { id: 'users', label: 'Usuários Globais', icon: Users },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === tab.id
                                ? 'bg-purple-50 text-purple-700'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* --- TAB CONTENT --- */}

                {/* 1. OVERVIEW (Financeiro) */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-500" /> MRR Total
                                </h3>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalMrr)}
                                </p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-purple-500" /> Gabinetes Ativos
                                </h3>
                                <div className="flex items-end gap-2 mt-2">
                                    <p className="text-3xl font-bold text-gray-900">{stats.activeCabinets}</p>
                                    <span className="text-sm text-gray-400 mb-1">/ {stats.totalCabinets} total</span>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500" /> Ticket Médio
                                </h3>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.avgTicket)}
                                </p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" /> Inadimplência
                                </h3>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.suspendedCabinets}</p>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
                            <h3 className="font-bold text-gray-800 mb-6">Crescimento de MRR (Simulado)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={MOCK_MRR_DATA}>
                                    <defs>
                                        <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="value" stroke="#10B981" fillOpacity={1} fill="url(#colorMrr)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* 2. CABINETS MANAGEMENT */}
                {activeTab === 'cabinets' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Buscar gabinete..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors outline-none w-64"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleOpenCreate}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                            >
                                <Plus className="w-4 h-4" /> Novo Gabinete
                            </button>
                        </div>

                        {/* Custom Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Gabinete</th>
                                        <th className="px-6 py-4">Status & Plano</th>
                                        <th className="px-6 py-4">MRR</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredCabinets.map(cab => (
                                        <tr key={cab.id} className="hover:bg-purple-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{cab.name}</div>
                                                <div className="text-xs text-gray-400 font-mono mt-0.5">{cab.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <StatusBadge status={cab.status} />
                                                    <span className="text-xs text-gray-500 font-medium">{cab.plan_tier}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-gray-700">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cab.mrr_value)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEdit(cab)}
                                                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-all"
                                                        title="Editar"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleArchiveToggle(cab)}
                                                        className={`p-1.5 rounded-lg transition-all ${cab.status === 'archived' ? 'text-green-400 hover:text-green-600 hover:bg-green-100' : 'text-gray-400 hover:text-red-600 hover:bg-red-100'}`}
                                                        title={cab.status === 'archived' ? 'Reativar' : 'Arquivar'}
                                                    >
                                                        {cab.status === 'archived' ? <RefreshCw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. USERS MANAGEMENT */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in min-h-[400px]">
                        <div className="max-w-md mx-auto text-center space-y-4">
                            <h3 className="text-lg font-bold text-gray-800">Busca Global de Usuários</h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Digite nome ou email..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && searchUsers((e.target as any).value)}
                                />
                                <button className="absolute right-2 top-2 p-1.5 bg-gray-100 rounded-lg text-gray-500 hover:text-purple-600">
                                    <Search className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-8">
                            {loadingUsers ? <div className="text-center text-gray-500">Buscando...</div> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {users.map(u => (
                                        <div key={u.id} className="border border-gray-100 p-4 rounded-xl hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                                                    {u.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{u.name}</p>
                                                    <p className="text-xs text-gray-500">{u.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-50">
                                                <p>Gabinete: <span className="font-bold text-gray-700">{u.cabinet_name}</span></p>
                                                <p>Cargo: {u.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* CREATE/EDIT MODAL */}
            <Modal
                isOpen={!!modalMode}
                onClose={() => setModalMode(null)}
                title={modalMode === 'create' ? 'Novo Gabinete' : 'Editar Gabinete'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Gabinete</label>
                        <input
                            value={cabinetForm.name}
                            onChange={e => setCabinetForm({ ...cabinetForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Ex: Prefeitura de São Paulo"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Plano (Tier)</label>
                            <select
                                value={cabinetForm.plan_tier}
                                onChange={e => setCabinetForm({ ...cabinetForm, plan_tier: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="Basic">Basic</option>
                                <option value="Pro">Pro</option>
                                <option value="Enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Valor Mensal (R$)</label>
                            <input
                                type="number"
                                value={cabinetForm.mrr_value}
                                onChange={e => setCabinetForm({ ...cabinetForm, mrr_value: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button onClick={handleSaveCabinet} className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700">Salvar</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminDashboard;
