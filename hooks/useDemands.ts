import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Demand } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useDemands = () => {
    const { profile } = useAuth();
    const [demands, setDemands] = useState<Demand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDemands = async () => {
        if (!profile?.cabinet_id) return;

        setLoading(true);
        try {
            // Fetch demands with the creator's profile name
            const { data, error } = await supabase
                .from('demands')
                .select(`
                    *,
                    profiles:created_by (
                        name
                    )
                `)
                .eq('cabinet_id', profile.cabinet_id) // Explicit filter for safety/performance
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map the data to flatten the profile name into 'author' for UI compatibility
            const mappedDemands = (data || []).map((d: any) => ({
                ...d,
                author: d.profiles?.name || 'Sistema'
            }));

            setDemands(mappedDemands);
        } catch (err: any) {
            console.error('Error fetching demands:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createDemand = async (demand: Partial<Demand>) => {
        if (!profile?.cabinet_id) {
            return { success: false, error: 'Gabinete não identificado.' };
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase.from('demands').insert([{
                title: demand.title,
                description: demand.description,
                status: demand.status || 'Pendente',
                priority: demand.priority || 'Média',
                category: demand.category || 'Outros',
                beneficiary: demand.beneficiary,
                assigned_to: demand.assigned_to,
                created_by: user?.id,
                cabinet_id: profile.cabinet_id
            }]);

            if (error) throw error;
            await fetchDemands();
            return { success: true };
        } catch (err: any) {
            console.error('Error creating demand:', err);
            return { success: false, error: err.message };
        }
    };

    const updateDemand = async (id: number | string, updates: Partial<Demand>) => {
        try {
            const { error } = await supabase
                .from('demands')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            await fetchDemands();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const updateDemandStatus = async (id: number | string, newStatus: string) => {
        return updateDemand(id, { status: newStatus as any });
    };

    const deleteDemand = async (id: number | string) => {
        try {
            const { error } = await supabase.from('demands').delete().eq('id', id);
            if (error) throw error;
            await fetchDemands();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const getUniqueCategories = async () => {
        if (!profile?.cabinet_id) return [];
        try {
            const { data } = await supabase
                .from('demands')
                .select('category')
                .eq('cabinet_id', profile.cabinet_id);

            // Extract unique categories
            const categories = Array.from(new Set(data?.map((d: any) => d.category) || []));
            return categories.sort();
        } catch (err) {
            return [];
        }
    };

    useEffect(() => {
        if (profile?.cabinet_id) {
            fetchDemands();
        }
    }, [profile?.cabinet_id]);

    return {
        demands,
        loading,
        error,
        refresh: fetchDemands,
        createDemand,
        updateDemand,
        updateDemandStatus,
        deleteDemand,
        getUniqueCategories,
        setDemands // Exposed for optimistic UI updates in DnD
    };
};
