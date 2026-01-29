import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Voter } from '../types';

export const useReports = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getGeneralStats = useCallback(async (startDate?: string, endDate?: string) => {
        setLoading(true);
        try {
            let query = supabase.from('voters').select('id, category, status, birth_date, city, neighborhood, created_at', { count: 'exact' });

            if (startDate) query = query.gte('created_at', startDate);
            if (endDate) query = query.lte('created_at', endDate);

            const { data, count, error } = await query;
            if (error) throw error;

            return { data, total: count };
        } catch (err: any) {
            setError(err.message);
            return { data: [], total: 0 };
        } finally {
            setLoading(false);
        }
    }, []);

    const getByNeighborhood = useCallback(async (neighborhood?: string) => {
        setLoading(true);
        try {
            let query = supabase.from('voters').select('neighborhood, id, name, phone, address');

            if (neighborhood) {
                query = query.ilike('neighborhood', `%${neighborhood}%`);
            }

            const { data, error } = await query;
            if (error) throw error;

            return data;
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getByCity = useCallback(async (city?: string) => {
        setLoading(true);
        try {
            let query = supabase.from('voters').select('city, id, name, phone, address');

            if (city) {
                query = query.ilike('city', `%${city}%`);
            }

            const { data, error } = await query;
            if (error) throw error;

            return data;
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getBirthdays = useCallback(async (month: number) => {
        setLoading(true);
        try {
            // Note: filtering by month in Supabase/Postgres requires SQL function or client side filtering if volume is low.
            // For now, fetching all birthdays and filtering client side (MVDP - Minimum Viable Data Pattern)
            // Ideally we should use a custom RPC or text search on date string.
            const { data, error } = await supabase.from('voters')
                .select('id, name, birth_date, phone, city')
                .not('birth_date', 'is', null);

            if (error) throw error;

            // Filter by month (0-indexed or 1-indexed? usually month input is 1-12)
            const filtered = data.filter((v: any) => {
                if (!v.birth_date) return false;
                const d = new Date(v.birth_date);
                // getMonth() is 0-11. formatted param 'month' assumed 1-12.
                return (d.getMonth() + 1) === month;
            });

            return filtered;
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        getGeneralStats,
        getByNeighborhood,
        getByCity,
        getBirthdays
    };
};
