import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function AdminRoute() {
    const { profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Verifica se o usuário é Admin da Plataforma (Super Admin)
    if (!profile || !profile.is_super_admin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
                <p className="text-gray-600 text-center max-w-md">
                    Esta área é restrita para administradores da plataforma Gabinete Ágil.
                    Se você acredita que deveria ter acesso, contate o suporte.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Voltar para Início
                </button>
            </div>
        );
    }

    return <Outlet />;
}
