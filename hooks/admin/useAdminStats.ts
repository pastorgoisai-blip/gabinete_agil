import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export interface BusinessStats {
    totalMrr: number;
    totalCabinets: number;
    activeCabinets: number;
    trialCabinets: number;
    suspendedCabinets: number;
    avgTicket: number;
}

export const useAdminStats = () => {
    const { profile } = useAuth();
    const [stats, setStats] = useState<BusinessStats>({
        totalMrr: 0,
        totalCabinets: 0,
        activeCabinets: 0,
        trialCabinets: 0,
        suspendedCabinets: 0,
        avgTicket: 0
    });
    const [loading, setLoading] = useState(false);

    const isSuperAdmin = profile?.is_super_admin === true;

    const fetchStats = async () => {
        if (!isSuperAdmin) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cabinets')
                .select('status, mrr_value');

            if (error) throw error;

            const newStats = (data || []).reduce((acc, curr) => {
                acc.totalCabinets++;
                if (curr.status === 'active') acc.activeCabinets++;
                if (curr.status === 'trial') acc.trialCabinets++;
                if (curr.status === 'suspended') acc.suspendedCabinets++;

                // Sum MRR only for paying customers (active)
                if (curr.status === 'active') {
                    acc.totalMrr += Number(curr.mrr_value || 0);
                }
                return acc;
            }, {
                totalMrr: 0,
                totalCabinets: 0,
                activeCabinets: 0,
                trialCabinets: 0,
                suspendedCabinets: 0
            });

            const avgTicket = newStats.activeCabinets > 0
                ? newStats.totalMrr / newStats.activeCabinets
                : 0;

            setStats({ ...newStats, avgTicket });
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isSuperAdmin) {
            fetchStats();
        }
    }, [isSuperAdmin]);

    return {
        stats,
        loading,
        refreshStats: fetchStats
    };
};
