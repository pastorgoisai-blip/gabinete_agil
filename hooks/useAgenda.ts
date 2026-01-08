import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
// Define local interface if not exported or use generic temporarily. 
// Ideally we should move Event interface to types.ts but for now I will define generic usage or allow implicit any map.
// Let's import Event from types if it exists, otherwise define it.
// Checking types.ts content previously view... it had Event.
import { Event } from '../types';

export const useAgenda = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true }); // sort by date

            if (error) throw error;

            const mappedEvents = data.map((e: any) => ({
                ...e,
                startTime: e.start_time?.slice(0, 5), // 'HH:MM:SS' -> 'HH:MM'
                endTime: e.end_time?.slice(0, 5),
                displayDate: new Date(e.date).toLocaleDateString('pt-BR'), // Simple format
                notifyPolitician: e.notify_politician,
                notifyMedia: e.notify_media,
                notifyStaff: e.notify_staff,
                notes: e.notes || ''
            }));

            setEvents(mappedEvents);
        } catch (err: any) {
            console.error('Error fetching events:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createEvent = async (event: Partial<Event>) => {
        try {
            const { error } = await supabase.from('events').insert([{
                title: event.title,
                type: event.type,
                status: event.status, // 'chegando', etc. logic might need to be recalculable?
                // Actually status is usually derived from date relative to today.
                // But for now let's persist what is passed, or valid DB columns.
                date: event.date,
                start_time: event.startTime,
                end_time: event.endTime,
                location: event.location,
                description: event.description,
                responsible: event.responsible,
                notes: event.notes,
                notify_politician: event.notifyPolitician,
                notify_media: event.notifyMedia,
                notify_staff: event.notifyStaff
            }]);
            if (error) throw error;
            await fetchEvents();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const updateEvent = async (id: number | string, updates: Partial<Event>) => {
        try {
            const dbUpdates: any = { ...updates };
            // Map back to snake_case
            if (updates.startTime) dbUpdates.start_time = updates.startTime;
            if (updates.endTime) dbUpdates.end_time = updates.endTime;
            if (updates.notifyPolitician !== undefined) dbUpdates.notify_politician = updates.notifyPolitician;
            if (updates.notifyMedia !== undefined) dbUpdates.notify_media = updates.notifyMedia;
            if (updates.notifyStaff !== undefined) dbUpdates.notify_staff = updates.notifyStaff;

            // Remove UI-only fields from dbUpdates to avoid error if they are not in DB columns
            delete dbUpdates.startTime;
            delete dbUpdates.endTime;
            delete dbUpdates.displayDate;
            delete dbUpdates.notifyPolitician;
            delete dbUpdates.notifyMedia;
            delete dbUpdates.notifyStaff;

            const { error } = await supabase
                .from('events')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
            await fetchEvents();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const deleteEvent = async (id: number | string) => {
        try {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
            await fetchEvents();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return { events, loading, error, refresh: fetchEvents, createEvent, updateEvent, deleteEvent };
};
