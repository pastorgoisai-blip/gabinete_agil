import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Voter } from '../types';

export const useVoters = () => {
    const [voters, setVoters] = useState<Voter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVoters = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('voters')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedVoters = data.map((v: any) => ({
                ...v,
                tags: v.tags || [],
                engagement: v.engagement || 0,
                socialStats: v.social_stats || { instagram: { isFollowing: false, interactions: 0 }, whatsapp: { status: 'none', msgCount: 0 } },
                lastContact: v.last_contact,
                lastChannel: v.last_channel,
                initial: v.name ? v.name.charAt(0).toUpperCase() : '?'
            }));

            setVoters(mappedVoters);
        } catch (err: any) {
            console.error('Error fetching voters:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createVoter = async (voter: Partial<Voter>) => {
        try {
            const { error } = await supabase.from('voters').insert([{
                name: voter.name,
                cpf: voter.cpf,
                phone: voter.phone,
                address: voter.address,
                category: voter.category,
                status: voter.status || 'active',
                tags: voter.tags,
                engagement: voter.engagement,
                social_stats: {
                    instagram: { isFollowing: false, interactions: 0 },
                    whatsapp: { status: 'opt-in', msgCount: 0 }
                },
                // We can map other fields back to snake_case if strictly needed by DB,
                // but Supabase js client handles camelCase if the DB column is snake_case? 
                // NO, it doesn't automatically. We must use exact column names.
                // My hook mapped FROM db but insert needs exact column names.
            }]);
            if (error) throw error;
            await fetchVoters();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const updateVoter = async (id: number | string, updates: Partial<Voter>) => {
        try {
            const { error } = await supabase
                .from('voters')
                .update({
                    name: updates.name,
                    cpf: updates.cpf,
                    phone: updates.phone,
                    address: updates.address,
                    category: updates.category,
                    status: updates.status,
                    tags: updates.tags,
                    engagement: updates.engagement,
                    social_stats: updates.socialStats, // mapping back
                })
                .eq('id', id);

            if (error) throw error;
            await fetchVoters();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const deleteVoter = async (id: number | string) => {
        try {
            const { error } = await supabase.from('voters').delete().eq('id', id);
            if (error) throw error;
            await fetchVoters();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    useEffect(() => {
        fetchVoters();
    }, []);

    return { voters, loading, error, refresh: fetchVoters, createVoter, updateVoter, deleteVoter };
};
