
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  // Refactor: Removed 'signup' mode
  const [mode, setMode] = useState<'signin' | 'forgot_password'>('signin');
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  // Refactor: Removed handleSignUp

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Lado Esquerdo - Imagem/Branding */}
      <div className="hidden w-1/2 bg-primary-900 lg:flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-900 opacity-90 z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1555848962-6e79363ec58f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-20 text-white max-w-lg p-12 animate-fade-in-up">
          <div className="mb-8 flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm">Gabinete Ágil</h1>
          </div>
          <p className="text-xl text-primary-100 mb-8 leading-relaxed font-light">
            Gestão política moderna e eficiente para o seu mandato. O sistema é restrito à equipe autorizada.
          </p>
          <div className="flex flex-col gap-4 text-sm text-primary-50 font-medium">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
              Gabinete 24h (IA)
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"></div>
              Copilot Legislativo Integrado
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]"></div>
              Agente de Agenda Inteligente
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex w-full items-center justify-center lg:w-1/2 px-4 sm:px-12 bg-white dark:bg-slate-950 transition-colors">
        <div className="w-full max-w-md space-y-8 py-12">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {mode === 'signin' ? 'Área Restrita' : 'Recuperar Senha'}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {mode === 'signin'
                ? 'Entre com suas credenciais para acessar o painel.'
                : 'Digite seu e-mail para receber o link de recuperação.'}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={mode === 'signin' ? handleLogin : handleResetPassword}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <div className="relative mt-1.5 group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 pl-10 py-3 text-slate-900 dark:text-white bg-white dark:bg-slate-900 placeholder-slate-400 focus:border-primary-500 focus:ring-primary-500 focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all sm:text-sm shadow-sm"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {mode !== 'forgot_password' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
                  </div>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" aria-hidden="true" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 pl-10 pr-10 py-3 text-slate-900 dark:text-white bg-white dark:bg-slate-900 placeholder-slate-400 focus:border-primary-500 focus:ring-primary-500 focus:ring-2 transition-all sm:text-sm shadow-sm"
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Eye className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800 animate-shake">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Erro na autenticação</h3>
                    <div className="mt-1 text-sm text-red-700 dark:text-red-400">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 animate-fade-in">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Sucesso</h3>
                    <div className="mt-1 text-sm text-green-700 dark:text-green-400">
                      <p>{message}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mode === 'signin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setMode('forgot_password'); setError(null); setMessage(null); }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-xl bg-primary-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 active:scale-[0.99]"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                ) : (
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    {mode === 'signin' && <Lock className="h-5 w-5 text-primary-200 group-hover:text-white transition-colors" aria-hidden="true" />}
                  </span>
                )}
                {mode === 'signin' ? 'Entrar no Sistema' : 'Enviar Link de Recuperação'}
              </button>
            </div>
          </form>

          {/* Footer alterado para Closed SaaS */}
          <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="relative flex justify-center text-sm mb-4">
              <span className="bg-white dark:bg-slate-950 px-2 text-slate-500 dark:text-slate-400 -mt-9">Acesso Restrito</span>
            </div>

            <div className="flex justify-center gap-2">
              {mode === 'signin' ? (
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Não tem uma conta? <span className="text-slate-700 dark:text-slate-300 font-medium">Solicite um convite ao administrador do seu gabinete.</span>
                </p>
              ) : (
                <button
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setMessage(null);
                  }}
                  className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:underline transition-all text-sm flex items-center gap-1"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Voltar ao Login
                </button>
              )}
            </div>
          </div>
        </div >
      </div >
    </div >
  );
}