import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ManagerRoute: React.FC = () => {
    const { profile, loading } = useAuth();
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        if (!loading) {
            setAuthChecked(true);
        }
    }, [loading]);

    if (loading || !authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    // RBAC Check: Super Admin OR Admin
    const isManager = profile.is_super_admin || profile.role === 'admin';

    if (!isManager) {
        // Using alert since we don't have a toast context readily available in this file scope without significant refactor,
        // matching the "alert" pattern used elsewhere in the current session.
        // In a real scenario, we might want to pass a state to the location to show a toast on the destination page.
        alert("Acesso não autorizado: Área restrita para gestores.");
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ManagerRoute;
