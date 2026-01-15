
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
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split('@')[0], // Nome temporário
          }
        }
      });

      if (error) throw error;

      if (data.user && data.session === null) {
        setMessage('Verifique seu e-mail para confirmar o cadastro!');
        setMode('signin');
      } else {
        // Se auto-confirm estiver ligado ou login automatico
        navigate('/');
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Lado Esquerdo - Imagem/Branding */}
      <div className="hidden w-1/2 bg-blue-600 lg:flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 opacity-90 z-10"></div>
        {/* Placeholder para imagem de fundo se desejar */}
        <img
          src="https://images.unsplash.com/photo-1555848962-6e79363ec58f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-20 text-white max-w-lg p-12">
          <div className="mb-8 flex items-center gap-3">
            <ShieldCheck className="h-10 w-10 text-blue-200" />
            <h1 className="text-4xl font-bold tracking-tight">Gabinete Ágil</h1>
          </div>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Gestão política moderna e eficiente para o seu mandato. Otimize processos, gerencie eleitores e foque no que importa.
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
              {mode === 'signin' ? 'Bem-vindo de volta' : 'Comece agora'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {mode === 'signin'
                ? 'Entre com suas credenciais para acessar o painel.'
                : 'Crie sua conta para gerenciar seu gabinete.'}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={mode === 'signin' ? handleLogin : handleSignUp}>
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
                    autoComplete={mode === 'signin' ? "current-password" : "new-password"}
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
                {mode === 'signin' ? 'Entrar no Sistema' : 'Criar Conta'}
                {!loading && mode === 'signup' && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-2 text-gray-500">Ou continue com</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              <p className="text-center text-sm text-gray-600">
                {mode === 'signin' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                {' '}
                <button
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null); }}
                  className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-all"
                >
                  {mode === 'signin' ? 'Cadastre-se gratuitamente' : 'Faça login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}