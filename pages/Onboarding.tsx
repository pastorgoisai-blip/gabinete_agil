import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Building2, Save, LogOut, Users, PlusCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Onboarding() {
    const { user, signOut } = useAuth();
    const [cabinetName, setCabinetName] = useState('');
    const [joinName, setJoinName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'create' | 'join'>('create');
    const navigate = useNavigate();

    const handleCreateCabinet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Criar o Gabinete (Tenant)
            const { data: cabinet, error: cabinetError } = await supabase
                .from('cabinets')
                .insert({
                    name: cabinetName,
                    plan: 'free',
                })
                .select()
                .single();

            if (cabinetError) {
                // Check for unique constraint violation (Postgres error 23505)
                if (cabinetError.code === '23505') {
                    throw new Error('Já existe um gabinete com este nome. Tente entrar nele ou escolha outro nome.');
                }
                throw cabinetError;
            }
            if (!cabinet) throw new Error("Erro ao criar gabinete");

            // 2. Atualizar o Perfil do Usuário
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    cabinet_id: cabinet.id,
                    name: user.user_metadata.name || user.email?.split('@')[0],
                    email: user.email,
                    role: 'super_admin',
                    status: 'active'
                });

            if (profileError) throw profileError;

            window.location.href = '/';

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao configurar seu gabinete.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinCabinet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';
            const userEmail = user.email || '';

            // Chamada RPC para entrar no gabinete pelo nome
            const { data, error: rpcError } = await supabase
                .rpc('join_cabinet_by_name', {
                    cabinet_name: joinName,
                    user_name: userName,
                    user_email: userEmail
                });

            if (rpcError) throw rpcError;

            // Verificação do response customizado do RPC
            if (data && data.success) {
                window.location.href = '/';
            } else {
                throw new Error(data?.message || 'Gabinete não encontrado ou erro ao entrar.');
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao entrar no gabinete. Verifique se o nome está correto.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="rounded-full bg-blue-100 p-3">
                        <Building2 className="h-10 w-10 text-blue-600" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Bem-vindo ao Gabinete Ágil
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Gerencie sua campanha ou mandato de forma eficiente.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            onClick={() => { setMode('create'); setError(null); }}
                            className={`flex-1 pb-4 text-sm font-medium text-center border-b-2 transition-colors ${mode === 'create'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <PlusCircle className="w-4 h-4" />
                                Nova Campanha
                            </div>
                        </button>
                        <button
                            onClick={() => { setMode('join'); setError(null); }}
                            className={`flex-1 pb-4 text-sm font-medium text-center border-b-2 transition-colors ${mode === 'join'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Users className="w-4 h-4" />
                                Entrar em Existente
                            </div>
                        </button>
                    </div>

                    {mode === 'create' ? (
                        <form className="space-y-6" onSubmit={handleCreateCabinet}>
                            <div>
                                <label htmlFor="cabinetName" className="block text-sm font-medium text-gray-700">
                                    Nome do Gabinete / Vereador
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="cabinetName"
                                        name="cabinetName"
                                        type="text"
                                        required
                                        value={cabinetName}
                                        onChange={(e) => setCabinetName(e.target.value)}
                                        className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                        placeholder="Ex: Vereador João da Silva"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    Você será o administrador deste novo gabinete.
                                </p>
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full justify-center items-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? 'Criando...' : 'Criar Gabinete'}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </button>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleJoinCabinet}>
                            <div>
                                <label htmlFor="joinName" className="block text-sm font-medium text-gray-700">
                                    Nome da Campanha para Entrar
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="joinName"
                                        name="joinName"
                                        type="text"
                                        required
                                        value={joinName}
                                        onChange={(e) => setJoinName(e.target.value)}
                                        className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                        placeholder="Ex: Vereador João da Silva"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    Digite o nome exato da campanha que deseja participar.
                                </p>
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full justify-center items-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? 'Entrando...' : 'Entrar na Campanha'}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </button>
                        </form>
                    )}

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => signOut()}
                            className="flex w-full justify-center items-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair da conta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
