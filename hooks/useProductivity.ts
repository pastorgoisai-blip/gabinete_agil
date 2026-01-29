import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SystemAccessLog, ProductivityMetrics } from '../types';

export const useProductivity = () => {
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);

    const logAccess = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get cabinet_id from profile (assuming stored in local state or fetch again)
            // For a quick non-blocking log, we'll fetch just what we need or assume context
            const { data: profile } = await supabase.from('profiles').select('cabinet_id').eq('id', user.id).single();

            if (profile?.cabinet_id) {
                await supabase.from('system_access_logs').insert({
                    user_id: user.id,
                    cabinet_id: profile.cabinet_id,
                    accessed_at: new Date().toISOString(),
                    metadata: {
                        userAgent: navigator.userAgent
                    }
                });
            }
        } catch (err) {
            console.error('Failed to log access', err);
        }
    }, []);

    const fetchMetrics = useCallback(async (userId?: string, period: 'day' | 'week' | 'month' = 'week') => {
        setLoading(true);
        try {
            const now = new Date();
            let startDate = new Date();

            if (period === 'day') startDate.setDate(now.getDate() - 1);
            if (period === 'week') startDate.setDate(now.getDate() - 7);
            if (period === 'month') startDate.setMonth(now.getMonth() - 1); // Approx

            const startStr = startDate.toISOString();

            // Helper to apply filter if userId is provided, otherwise rely on RLS (Cabinet scope)
            const applyFilter = (query: any, column = 'created_by') => {
                if (userId) return query.eq(column, userId);
                return query;
            };

            // Run queries in parallel
            const [logins, voters, demands, events] = await Promise.all([
                applyFilter(supabase.from('system_access_logs').select('id', { count: 'exact' }), 'user_id').gte('accessed_at', startStr),
                applyFilter(supabase.from('voters').select('id', { count: 'exact' })).gte('created_at', startStr),
                applyFilter(supabase.from('demands').select('id', { count: 'exact' })).gte('created_at', startStr),
                applyFilter(supabase.from('events').select('id', { count: 'exact' })).gte('created_at', startStr),
            ]);

            setMetrics({
                userId: userId || 'cabinet',
                period,
                logins: logins.count || 0,
                votersCreated: voters.count || 0,
                demandsCreated: demands.count || 0,
                eventsCreated: events.count || 0
            });

        } catch (err) {
            console.error('Error fetching productivity metrics', err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        metrics,
        logAccess,
        fetchMetrics
    };
};
