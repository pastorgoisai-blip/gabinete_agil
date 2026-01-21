import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../contexts/AuthContext';

interface UseTeamResult {
    users: UserProfile[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useTeam(): UseTeamResult {
    const { profile } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTeam = async () => {
        if (!profile?.cabinet_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('cabinet_id', profile.cabinet_id)
                .order('name', { ascending: true });

            if (error) throw error;

            setUsers(data as UserProfile[]);
        } catch (err: any) {
            console.error('Error fetching team:', err);
            setError(err.message || 'Erro ao carregar equipe.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, [profile?.cabinet_id]);

    return { users, loading, error, refetch: fetchTeam };
}
