import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // DEBUG: Visualization
    const [sessionDebug, setSessionDebug] = useState<string>('Checking...');

    useEffect(() => {
        const checkSession = async () => {
            // 1. Try standart session
            const { data } = await supabase.auth.getSession();
            let currentSession = data.session;

            // 2. If no session, check for "Life Raft" tokens passed via history state
            if (!currentSession) {
                const state = location.state as { accessToken?: string; refreshToken?: string } | null;
                if (state?.accessToken && state?.refreshToken) {
                    console.log('ResetPassword: Found tokens in history state! Attempting rescue hydration...');
                    setSessionDebug('Hydrating from State...');
                    const { data: dataRescue, error: errorRescue } = await supabase.auth.setSession({
                        access_token: state.accessToken,
                        refresh_token: state.refreshToken
                    });

                    if (!errorRescue && dataRescue.session) {
                        currentSession = dataRescue.session;
                        console.log('ResetPassword: Rescue hydration SUCCESS.');
                    } else {
                        console.error('ResetPassword: Rescue hydration failed:', errorRescue);
                    }
                }
            }

            console.log('ResetPassword Final Session Check:', currentSession);
            setSessionDebug(currentSession ? `Active: ${currentSession.user.email}` : 'No Session Found');
        };
        checkSession();
    }, [location]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem' });
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Senha atualizada com sucesso! Redirecionando...' });

            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro ao atualizar senha' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors px-4 sm:px-6 lg:px-8">
            {/* DEBUG INDICATOR - REMOVE AFTER FIX */}
            <div className="mb-4 text-xs font-mono text-slate-500 bg-slate-200 p-2 rounded">
                Session Status: {sessionDebug}
            </div>
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        <Lock className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Redefinir Senha
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Crie uma senha forte para proteger sua conta.
                    </p>
                </div>

                {message && (
                    <div className={`rounded-xl p-4 border flex items-start gap-3 ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                        : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="h-5 w-5 mt-0.5" /> : <AlertTriangle className="h-5 w-5 mt-0.5" />}
                        <span className="text-sm font-medium leading-relaxed">{message.text}</span>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleReset}>
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Nova Senha
                            </label>
                            <div className="relative mt-1.5">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 pl-10 pr-10 py-3 text-slate-900 dark:text-white bg-white dark:bg-slate-700 placeholder-slate-400 focus:border-primary-500 focus:ring-primary-500 focus:ring-2 transition-all sm:text-sm shadow-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Confirmar Nova Senha
                            </label>
                            <div className="relative mt-1.5">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 pl-10 py-3 text-slate-900 dark:text-white bg-white dark:bg-slate-700 placeholder-slate-400 focus:border-primary-500 focus:ring-primary-500 focus:ring-2 transition-all sm:text-sm shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative flex w-full justify-center rounded-xl bg-primary-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 transition-all active:scale-[0.99] ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                                    Atualizando...
                                </span>
                            ) : 'Definir Nova Senha'}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
                    >
                        &larr; Voltar ao Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
