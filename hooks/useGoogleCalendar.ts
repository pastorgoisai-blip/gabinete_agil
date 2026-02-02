import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useGoogleCalendar = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);

    // 1. Iniciar Fluxo de Autenticação
    const connectGoogle = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
                body: { action: 'auth-url' }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url; // Redireciona para Google
            }
        } catch (err) {
            console.error('Erro ao conectar Google:', err);
            alert('Erro ao iniciar conexão com Google Calendar.');
        } finally {
            setLoading(false);
        }
    };

    // 1.5 Processar Callback (Trocar Code por Token)
    const exchangeCodeForToken = async (code: string) => {
        setLoading(true);
        try {
            if (!profile?.cabinet_id) throw new Error("Gabinete não identificado");

            const { data, error } = await supabase.functions.invoke('google-calendar-oauth', {
                body: {
                    action: 'callback',
                    code,
                    cabinet_id: profile.cabinet_id
                }
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Erro ao trocar token:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // 2. Desconectar (Remover Tokens)
    const disconnectGoogle = async () => {
        if (!profile?.cabinet_id) return;
        if (!confirm('Deseja realmente desconectar o Google Calendar?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('cabinets')
                .update({
                    google_access_token: null,
                    google_refresh_token: null,
                    google_token_expires_at: null
                })
                .eq('id', profile.cabinet_id);

            if (error) throw error;
            window.location.reload(); // Recarrega para atualizar estado
        } catch (err) {
            console.error('Erro ao desconectar:', err);
            alert('Erro ao desconectar.');
        } finally {
            setLoading(false);
        }
    };

    // 3. Sincronizar Evento (Create/Update/Delete)
    const syncEvent = async (eventId: string, action: 'create' | 'update' | 'delete') => {
        try {
            console.log(`Syncing Event ${eventId} (${action})...`);
            const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
                body: { event_id: eventId, action }
            });

            if (error) throw error;
            console.log('Sync result:', data);
            return data;
        } catch (err) {
            console.error('Sync failed:', err);
            // Non-blocking error (don't alert user necessarily, just log)
            // Or use a toast if available
        }
    };

    return {
        connectGoogle,
        exchangeCodeForToken, // Export function
        disconnectGoogle,
        syncEvent,
        loading
    };
};
