import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    cabinet_id: string;
    cabinet_name?: string;
    last_access?: string;
}

export const useAdminUsers = () => {
    const { profile } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(false);

    const isSuperAdmin = profile?.is_super_admin === true;

    const searchUsers = async (term: string) => {
        if (!isSuperAdmin) return;
        setLoading(true);
        try {
            let query = supabase
                .from('profiles')
                .select(`
                    id, name, email, role, status, cabinet_id, last_access,
                    cabinets ( name )
                `)
                .order('created_at', { ascending: false });

            if (term) {
                query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
            } else {
                query = query.limit(50); // Default limit to avoid fetching everyone
            }

            const { data, error } = await query;

            if (error) throw error;

            const formatted = (data || []).map((u: any) => ({
                ...u,
                cabinet_name: u.cabinets?.name || 'Sem Gabinete'
            }));

            setUsers(formatted);
        } catch (err) {
            console.error('Error searching users:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        users,
        loading,
        searchUsers
    };
};
