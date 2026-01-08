import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useDashboard() {
    const [stats, setStats] = useState({
        totalVoters: 0,
        activeDemands: 0,
        coverage: 0,
        interactions: 0, // Mock for now or sum from voters
    });

    const [neighborhoods, setNeighborhoods] = useState<{ name: string, count: number, lat: number, lng: number }[]>([]);
    const [birthdays, setBirthdays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Total Voters
            const { count: votersCount, data: votersData } = await supabase
                .from('voters')
                .select('id, neighborhood, birth_date, name, phone, city', { count: 'exact' });

            // 2. Active Demands
            const { count: demandsCount } = await supabase
                .from('demands')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'Concluída');

            // 3. Process Neighborhoods (Client-side aggregation for now)
            // Mock coords for demo purposes for major Anapolis neighborhoods
            const neighborhoodCoords: Record<string, { lat: number, lng: number }> = {
                'Jundiaí': { lat: -16.3380, lng: -48.9450 },
                'Centro': { lat: -16.3285, lng: -48.9534 },
                'Fabril': { lat: -16.3150, lng: -48.9600 },
                'Lourdes': { lat: -16.3200, lng: -48.9300 },
                'Vila Góis': { lat: -16.3400, lng: -48.9600 },
                'Ibirapuera': { lat: -16.3100, lng: -48.9400 },
            };

            const hoodMap: Record<string, number> = {};
            votersData?.forEach(v => {
                const n = v.neighborhood || 'Outros';
                hoodMap[n] = (hoodMap[n] || 0) + 1;
            });

            const processedHoods = Object.entries(hoodMap)
                .map(([name, count]) => ({
                    name,
                    count,
                    lat: neighborhoodCoords[name]?.lat || -16.3285 + (Math.random() - 0.5) * 0.05, // Random offset if unknown
                    lng: neighborhoodCoords[name]?.lng || -48.9534 + (Math.random() - 0.5) * 0.05
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Top 5

            // 4. Process Birthdays (Simple check for current month?)
            // Note: Date filtering in Supabase on text/date fields can be tricky without precise types.
            // We'll filter client side for "upcoming" (next 7 days)
            const today = new Date();
            const currentMonth = today.getMonth() + 1;
            const currentDay = today.getDate();

            const upcomingBirthdays = votersData?.filter(v => {
                if (!v.birth_date) return false;
                // Format expected YYYY-MM-DD
                const [year, month, day] = v.birth_date.split('-').map(Number);
                if (month === currentMonth && day >= currentDay) return true; // Simple logic
                return false;
            }).slice(0, 5).map(v => ({
                ...v,
                date: v.birth_date.split('-').reverse().join('/')
            })) || [];

            setStats({
                totalVoters: votersCount || 0,
                activeDemands: demandsCount || 0,
                coverage: Object.keys(hoodMap).length,
                interactions: 428 // Static for now as we don't store interactions history
            });
            setNeighborhoods(processedHoods);
            setBirthdays(upcomingBirthdays);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        stats,
        neighborhoods,
        birthdays,
        loading
    };
}
