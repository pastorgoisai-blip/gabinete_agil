
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Lado Esquerdo - Imagem/Branding */}
      <div className="hidden w-1/2 bg-blue-600 lg:flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 opacity-90 z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1555848962-6e79363ec58f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-20 text-white max-w-lg p-12">
          <div className="mb-8 flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Gabinete Ágil</h1>
          </div>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Gestão política moderna e eficiente para o seu mandato. O sistema é restrito à equipe autorizada.
          </p>
          <div className="flex gap-4 text-sm text-blue-200 font-medium">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div> Multi-tenant Seguro</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div> Gestão Financeira</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div> Agenda Inteligente</span>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex w-full items-center justify-center lg:w-1/2 px-4 sm:px-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              {mode === 'signin' ? 'Área Restrita' : 'Recuperar Senha'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {mode === 'signin'
                ? 'Entre com suas credenciais para acessar o painel.'
                : 'Digite seu e-mail para receber o link de recuperação.'}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={mode === 'signin' ? handleLogin : handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 pl-10 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {mode !== 'forgot_password' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 pl-10 pr-10 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-all"
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
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
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erro na autenticação</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {message && (
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Sucesso</h3>
                    <div className="mt-2 text-sm text-green-700">
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
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 transition-all shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : (
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    {mode === 'signin' && <Lock className="h-5 w-5 text-blue-500 group-hover:text-blue-400 transition-colors" aria-hidden="true" />}
                  </span>
                )}
                {mode === 'signin' ? 'Entrar no Sistema' : 'Enviar Link de Recuperação'}
              </button>
            </div>
          </form>

          {/* Footer alterado para Closed SaaS */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-2 text-gray-500">Acesso Restrito</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              {mode === 'signin' ? (
                <p className="text-center text-xs text-gray-500">
                  Não tem uma conta? <span className="text-gray-700 font-medium">Solicite um convite ao administrador do seu gabinete.</span>
                </p>
              ) : (
                <button
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setMessage(null);
                  }}
                  className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-all text-sm"
                >
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