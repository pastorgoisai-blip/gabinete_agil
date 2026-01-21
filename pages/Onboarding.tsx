import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Building2, LogOut, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Onboarding() {
    const { user, signOut } = useAuth();
    const [joinName, setJoinName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

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
                    Gabinete Ágil
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Entre na sua campanha ou gabinete existente.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

                    <div className="mb-6 bg-blue-50 p-4 rounded-md flex items-start gap-3 border border-blue-100">
                        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            <strong>Nota de Segurança:</strong> A criação de novos gabinetes é restrita. Se você é um vereador e deseja cadastrar sua campanha, entre em contato com o suporte.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleJoinCabinet}>
                        <div>
                            <label htmlFor="joinName" className="block text-sm font-medium text-gray-700">
                                Nome da Campanha / Gabinete
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="joinName"
                                    name="joinName"
                                    type="text"
                                    required
                                    value={joinName}
                                    onChange={(e) => setJoinName(e.target.value)}
                                    className="block w-full rounded-md border border-gray-300 pl-10 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="Digite o nome exato..."
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Digite o nome exato da campanha que você foi convidado a participar.
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
                            {loading ? 'Verificando...' : 'Entrar na Campanha'}
                            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </button>
                    </form>

                    <div className="mt-6 border-t border-gray-100 pt-6">
                        <button
                            type="button"
                            onClick={() => signOut()}
                            className="flex w-full justify-center items-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair da conta e tentar outro e-mail
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-6 text-center">
                <a href="#/pending-invite" className="text-sm text-gray-400 hover:text-gray-600">
                    Ainda não tem convite? Veja instruções.
                </a>
            </div>
        </div>
    );
}
