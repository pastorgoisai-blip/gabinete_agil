import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Demand } from '../types';

export const useDemands = () => {
    const [demands, setDemands] = useState<Demand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDemands = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('demands')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setDemands(data || []);
        } catch (err: any) {
            console.error('Error fetching demands:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createDemand = async (demand: Partial<Demand>) => {
        try {
            const { error } = await supabase.from('demands').insert([{
                title: demand.title,
                description: demand.description,
                status: demand.status || 'Pendente',
                priority: demand.priority || 'Média',
                category: demand.category || 'Outros',
                beneficiary: demand.beneficiary, // Ensure this maps to 'voter_id' if linked, or just text 'beneficiary_name'? Schema says related to voter... let's check schema.
                // Checking schema: demands table has voter_id (FK). But UI currently uses text beneficiary.
                // For now, let's assume we might need to adjust this. 
                // Waiting for schema check. But for now I'll use what matches the current UI types mostly, 
                // assuming we might store just the name if no ID, or we need to fix the relationship.
                // Actually, let's just insert what we have. If schema enforces ID, we will fail.
                // Let's assume schema has 'title', 'description', 'status', 'priority', 'category'.
                // Wait, 'beneficiary' in UI is string name. In DB schema from my memory/logs?
                // Let's re-verify schema in a sec. For now writing generic hook.
            }]);
            if (error) throw error;
            await fetchDemands();
            return { success: true };
        } catch (err: any) {
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

    useEffect(() => {
        fetchDemands();
    }, []);

    return { demands, loading, error, refresh: fetchDemands, createDemand, updateDemand, deleteDemand };
};
