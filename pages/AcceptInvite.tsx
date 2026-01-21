import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldCheck, UserPlus, AlertTriangle, ArrowRight, Lock, User, CheckCircle, Mail } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// 1. Zod Schema
const inviteSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
    email: z.string().email(), // Read-only but validated
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function AcceptInvite() {
    const { token } = useParams<{ token: string }>(); // Route: /invite/:token
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [valid, setValid] = useState(false);
    const [successMode, setSuccessMode] = useState(false); // New state for success UI
    const [inviteData, setInviteData] = useState<any>(null);
    const [serverError, setServerError] = useState<string | null>(null);

    // 2. React Hook Form
    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        formState: { errors, isSubmitting }
    } = useForm<InviteFormValues>({
        resolver: zodResolver(inviteSchema)
    });

    useEffect(() => {
        if (!token) {
            setServerError('Token não fornecido.');
            setLoading(false);
            return;
        }
        validateToken(token);
    }, [token]);

    const validateToken = async (tokenUUID: string) => {
        try {
            // Calling the RPC created in previous step
            const { data, error } = await supabase.rpc('validate_invite_token', { token_uuid: tokenUUID });

            if (error) throw error;

            // RPC returns an array
            const result = data[0];

            if (!result || !result.valid) {
                setServerError('Este convite é inválido ou expirou.');
                setValid(false);
            } else {
                setInviteData(result);
                setValid(true);
                setValue('email', result.email); // Lock email in form
                // Pre-fill name if it was part of the invite data
                if (result.email) {
                    const namePart = result.email.split('@')[0];
                    // Auto-capitalize for UX
                    // const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                    // setValue('name', formattedName); 
                }
            }
        } catch (err: any) {
            console.error('Validation Error:', err);
            setServerError('Erro ao validar convite.');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: InviteFormValues) => {
        setServerError(null);
        try {
            // Using Supabase Auth SignUp. 
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name,
                    }
                }
            });

            if (signUpError) throw signUpError;

            if (authData.session) {
                // Logged in immediately (Email Confirmation OFF)
                navigate('/');
            } else {
                // Email Confirmation ON -> Show Success UI
                setSuccessMode(true);
            }

        } catch (err: any) {
            console.error('Signup Error:', err);
            setServerError(err.message || 'Erro ao criar conta.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                        <ShieldCheck className="h-10 w-10 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Convite para Gabinete
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">

                    {/* STATE 1: SUCCESS (EMAIL CONFIRMATION) */}
                    {successMode ? (
                        <div className="text-center animate-fade-in">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                                <Mail className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Realizado!</h3>
                            <p className="text-gray-600 mb-6 px-4">
                                Enviamos um email de confirmação para <strong className="text-gray-900">{getValues('email')}</strong>.
                            </p>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-left">
                                <p className="text-sm text-blue-800 flex gap-2">
                                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                    <span>
                                        <strong>Importante:</strong> Você precisa clicar no link enviado para seu email antes de fazer login.
                                    </span>
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('/login')}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
                            >
                                Ir para o Login
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                        </div>
                    ) : !valid ? (
                        /* STATE 2: INVALID TOKEN */
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Convite Inválido</h3>
                            <p className="mt-2 text-sm text-gray-500 mb-6">
                                {serverError || 'O link que você acessou não é mais válido.'}
                            </p>
                            <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                                Voltar para Login
                            </Link>
                        </div>
                    ) : (
                        /* STATE 3: FORM */
                        <>
                            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <UserPlus className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">Você foi convidado!</h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <p>
                                                Gabinete: <span className="font-bold">{inviteData.cabinet_name}</span><br />
                                                Função: <span className="uppercase text-xs font-bold bg-blue-200 px-1.5 py-0.5 rounded text-blue-800">{inviteData.role}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                                {serverError && (
                                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <AlertTriangle className="h-5 w-5 text-red-400" />
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-red-700">{serverError}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Email (Read Only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <input
                                            type="text"
                                            disabled
                                            className="block w-full pl-3 bg-gray-100 text-gray-500 border-gray-300 rounded-md py-2.5 sm:text-sm cursor-not-allowed"
                                            {...register('email')}
                                        />
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Seu Nome Completo</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className={`block w-full pl-10 sm:text-sm rounded-md py-2.5 ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                                            placeholder="Ex: Ana Silva"
                                            {...register('name')}
                                        />
                                    </div>
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Defina sua Senha</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            className={`block w-full pl-10 sm:text-sm rounded-md py-2.5 ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                                            placeholder="Mínimo 6 caracteres"
                                            {...register('password')}
                                        />
                                    </div>
                                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Confirme a Senha</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <CheckCircle className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            className={`block w-full pl-10 sm:text-sm rounded-md py-2.5 ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}`}
                                            placeholder="Digite novamente"
                                            {...register('confirmPassword')}
                                        />
                                    </div>
                                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                    >
                                        {isSubmitting ? 'Configurando conta...' : 'Aceitar e Entrar'}
                                        {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
