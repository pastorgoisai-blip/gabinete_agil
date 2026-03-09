import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RequirePermissionProps {
    moduleId: string;
    action?: 'view' | 'edit' | 'delete';
}

const RequirePermission: React.FC<RequirePermissionProps> = ({
    moduleId,
    action = 'view'
}) => {
    const { profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    // Admin and Super Admin bypass all permission checks
    if (profile.is_super_admin || profile.role === 'admin') {
        return <Outlet />;
    }

    // Check granular permission from JSONB
    const modulePerms = profile.permissions?.[moduleId];

    // If no permissions configured for this module, allow access (backwards compatibility)
    if (!modulePerms) {
        return <Outlet />;
    }

    // If permission entry exists but the specific action is explicitly false, deny
    if (modulePerms[action] === false) {
        alert('Acesso não autorizado: Você não tem permissão para acessar este módulo.');
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default RequirePermission;
