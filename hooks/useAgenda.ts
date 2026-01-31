import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { z } from 'zod';

// --- Esquema de Validação (Zod) ---
const eventSchema = z.object({
    title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
    type: z.string().min(1, "Selecione o tipo do evento"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    start_time: z.string().min(1, "Defina o horário de início"),
    end_time: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    responsible: z.string().optional(),
    notes: z.string().optional(),
    notify_politician: z.boolean().default(false),
    notify_media: z.boolean().default(false),
    notify_staff: z.boolean().default(false),
    source: z.string().default('app'),
    status: z.string().default('agendado') // 'agendado', 'realizado', 'cancelado'
});

export type EventFormData = z.infer<typeof eventSchema>;

export interface AgendaEvent extends EventFormData {
    id: number;
    cabinet_id: string;
    created_at?: string;
    // Helpers de display calculados
    displayDate?: string;
    statusColor?: string;
    statusLabel?: 'hoje' | 'chegando' | 'distante' | 'concluido';
    google_event_id?: string;
}

export const useAgenda = () => {
    const { profile } = useAuth();
    const [events, setEvents] = useState<AgendaEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (profile?.cabinet_id) {
            fetchEvents();
        }
    }, [profile]);

    // --- Função Auxiliar: Formatar Data para Exibição ---
    const formatDateDisplay = (dateString: string) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    // --- Função Auxiliar: Calcular Status Visual ---
    const calculateStatus = (date: string): 'hoje' | 'chegando' | 'distante' | 'concluido' => {
        const today = new Date().toISOString().split('T')[0];
        const eventDate = new Date(date).toISOString().split('T')[0];

        if (eventDate < today) return 'concluido';
        if (eventDate === today) return 'hoje';

        // Check se é nos próximos 3 dias
        const diffTime = new Date(eventDate).getTime() - new Date(today).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 3) return 'chegando';
        return 'distante';
    };

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) throw error;

            const formattedEvents: AgendaEvent[] = (data || []).map(evt => ({
                ...evt,
                startTime: evt.start_time, // Compatibilidade com UI antiga se nao refatorar tudo
                endTime: evt.end_time,
                notifyPolitician: evt.notify_politician, // Camada de compatibilidade
                notifyMedia: evt.notify_media,
                notifyStaff: evt.notify_staff,
                displayDate: formatDateDisplay(evt.date),
                statusLabel: calculateStatus(evt.date)
            }));

            setEvents(formattedEvents);
        } catch (err: any) {
            console.error('Erro ao buscar agenda:', err);
            setError(err.message || 'Erro ao carregar eventos');
        } finally {
            setLoading(false);
        }
    };

    const createEvent = async (data: EventFormData) => {
        try {
            setLoading(true);

            // Validação Zod (opcional se já validado no form, mas segura)
            const validated = eventSchema.parse(data);

            const { data: newEvent, error } = await supabase
                .from('events')
                .insert([{
                    ...validated,
                    cabinet_id: profile?.cabinet_id
                }])
                .select()
                .single();

            if (error) throw error;

            await fetchEvents(); // Refresh da lista
            return { success: true, data: newEvent };
        } catch (err: any) {
            console.error('Erro ao criar evento:', err);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateEvent = async (id: number, data: Partial<EventFormData>) => {
        try {
            setLoading(true);

            const { error } = await supabase
                .from('events')
                .update(data)
                .eq('id', id);

            if (error) throw error;

            await fetchEvents();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const deleteEvent = async (id: number) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setEvents(prev => prev.filter(e => e.id !== id));
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    return {
        events,
        loading,
        error,
        createEvent,
        updateEvent,
        deleteEvent,
        refresh: fetchEvents
    };
};
