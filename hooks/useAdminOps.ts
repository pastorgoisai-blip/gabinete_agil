import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface AdminMetric {
    date: string;
    calls: number;
    errors: number;
    tokens: number;
}

export interface DetailedCabinet {
    id: string;
    name: string;
    created_at: string;
    plan: string;
    gemini_api_key?: string;
    openai_api_key?: string;
    owner_email?: string;
}

export const useAdminOps = () => {
    const { profile } = useAuth();
    const [metrics, setMetrics] = useState<AdminMetric[]>([]);
    const [allCabinets, setAllCabinets] = useState<DetailedCabinet[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ensure only super admin can use this
    const isSuperAdmin = profile?.is_super_admin === true;

    const fetchMetrics = async () => {
        if (!isSuperAdmin) return;

        // MOCK DATA for now, as usage_metrics table might be empty
        // In real usage, we would query: supabase.from('usage_metrics').select('*')...
        const mockMetrics: AdminMetric[] = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                calls: Math.floor(Math.random() * 500) + 100,
                errors: Math.floor(Math.random() * 20),
                tokens: Math.floor(Math.random() * 50000) + 10000
            };
        });
        setMetrics(mockMetrics);
    };

    const fetchAllCabinets = async () => {
        if (!isSuperAdmin) return;
        setLoading(true);
        try {
            // Because of God Mode RLS, this should return ALL cabinets
            const { data, error } = await supabase
                .from('cabinets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAllCabinets(data as DetailedCabinet[]);
        } catch (err: any) {
            console.error('Error fetching all cabinets:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateCabinetConfig = async (cabinetId: string, updates: Partial<DetailedCabinet>, reason: string) => {
        if (!isSuperAdmin) return { success: false, error: 'Unauthorized' };

        try {
            // 1. Update Cabinet
            const { error: updateError } = await supabase
                .from('cabinets')
                .update(updates)
                .eq('id', cabinetId);

            if (updateError) throw updateError;

            // 2. Log Audit
            const { error: auditError } = await supabase
                .from('admin_audit_logs')
                .insert({
                    admin_id: profile?.id,
                    target_cabinet_id: cabinetId,
                    action: 'update_config',
                    details: { updates, reason }
                });

            if (auditError) console.error('Audit log failed:', auditError);

            await fetchAllCabinets();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const resetAgentContext = async (cabinetId: string) => {
        if (!isSuperAdmin) return { success: false, error: 'Unauthorized' };

        try {
            // Dummy implementation: In a real scenario, this might clear specific tables or call an Edge Function
            // For now, we just log it
            const { error: auditError } = await supabase
                .from('admin_audit_logs')
                .insert({
                    admin_id: profile?.id,
                    target_cabinet_id: cabinetId,
                    action: 'reset_context',
                    details: { timestamp: new Date().toISOString() }
                });

            if (auditError) throw auditError;

            return { success: true, message: 'Context reset logic triggered (Simulated)' };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    useEffect(() => {
        if (isSuperAdmin) {
            fetchMetrics();
            fetchAllCabinets();
        }
    }, [isSuperAdmin]);

    return {
        metrics,
        allCabinets,
        loading,
        error,
        refresh: fetchAllCabinets,
        updateCabinetConfig,
        resetAgentContext,
        isSuperAdmin
    };
};
