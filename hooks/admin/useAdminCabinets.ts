import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export interface AdminCabinet {
    id: string;
    name: string;
    created_at: string;
    status: 'active' | 'trial' | 'suspended' | 'archived';
    plan_tier: string;
    mrr_value: number;
    payment_method?: string;
    next_payment?: string;
    owner_email?: string; // Derived or stored
}

export const useAdminCabinets = () => {
    const { profile } = useAuth();
    const [cabinets, setCabinets] = useState<AdminCabinet[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSuperAdmin = profile?.is_super_admin === true;

    const listCabinets = useCallback(async () => {
        if (!isSuperAdmin) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cabinets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCabinets(data as AdminCabinet[]);
        } catch (err: any) {
            console.error('Error listing cabinets:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [isSuperAdmin]);

    const createCabinet = async (data: { name: string; plan_tier: string; mrr_value: number }) => {
        if (!isSuperAdmin) return { success: false, error: 'Unauthorized' };
        try {
            const { data: newCab, error } = await supabase
                .from('cabinets')
                .insert([{
                    name: data.name,
                    plan_tier: data.plan_tier,
                    mrr_value: data.mrr_value,
                    status: 'active'
                }])
                .select()
                .single();

            if (error) throw error;

            // Log audit
            await supabase.from('admin_audit_logs').insert({
                admin_id: profile?.id,
                target_cabinet_id: newCab.id,
                action: 'create_cabinet',
                details: data
            });

            await listCabinets();
            return { success: true, id: newCab.id };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const updateCabinet = async (id: string, updates: Partial<AdminCabinet>) => {
        if (!isSuperAdmin) return { success: false, error: 'Unauthorized' };
        try {
            const { error } = await supabase
                .from('cabinets')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // Log audit
            await supabase.from('admin_audit_logs').insert({
                admin_id: profile?.id,
                target_cabinet_id: id,
                action: 'update_cabinet_business',
                details: updates
            });

            await listCabinets();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const archiveCabinet = async (id: string) => {
        return updateCabinet(id, { status: 'archived' });
    };

    const reactivateCabinet = async (id: string) => {
        return updateCabinet(id, { status: 'active' });
    };

    return {
        cabinets,
        loading,
        error,
        listCabinets,
        createCabinet,
        updateCabinet,
        archiveCabinet,
        reactivateCabinet
    };
};
