
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    // Se não estiver logado, redireciona para login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Se estiver logado, renderiza o conteúdo da rota (Outlet)
    return <Outlet />;
};
