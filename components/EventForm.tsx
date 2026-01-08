import React, { useState, useEffect } from 'react';
import { Event } from '../types'; // Adjust path if needed or use local definition
import { Zap, BellRing, MessageCircle, Share2 } from 'lucide-react';

interface EventFormProps {
    initialData?: Event | null;
    onSave: (data: Partial<Event>) => Promise<void>;
    onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Event>>({
        title: '',
        type: 'Sessão Ordinária',
        date: new Date().toISOString().split('T')[0],
        location: '',
        startTime: '08:00',
        endTime: '09:00',
        responsible: '',
        description: '',
        notes: '',
        notifyPolitician: true,
        notifyMedia: true,
        notifyStaff: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Section 1: Event Details */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">Detalhes do Evento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Título</label>
                        <input
                            value={formData.title || ''}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Ex: Inauguração Escola"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tipo</label>
                        <select
                            value={formData.type || 'Sessão Ordinária'}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option>Sessão Ordinária</option>
                            <option>Evento Externo</option>
                            <option>Reunião de Gabinete</option>
                            <option>Audiência Pública</option>
                            <option>Reunião</option>
                            <option>Evento</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Data</label>
                        <input
                            type="date"
                            value={formData.date || ''}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Local</label>
                        <input
                            value={formData.location || ''}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Início</label>
                        <input
                            type="time"
                            value={formData.startTime || ''}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Fim</label>
                        <input
                            type="time"
                            value={formData.endTime || ''}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Responsável</label>
                    <input
                        value={formData.responsible || ''}
                        onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
            </div>

            {/* Section 2: Automation */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Automação e Comunicação
                </h4>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-slate-700">
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400"><BellRing className="w-4 h-4" /></div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Notificar Vereador (Push/SMS)</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={!!formData.notifyPolitician}
                            onChange={(e) => setFormData({ ...formData, notifyPolitician: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                    </label>
                    <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded text-green-600 dark:text-green-400"><MessageCircle className="w-4 h-4" /></div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Avisar Grupo de Mídia (WhatsApp)</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={!!formData.notifyMedia}
                            onChange={(e) => setFormData({ ...formData, notifyMedia: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                    </label>
                    <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-600 dark:text-purple-400"><Share2 className="w-4 h-4" /></div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Notificar Gabinete (Painel/Email)</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={!!formData.notifyStaff}
                            onChange={(e) => setFormData({ ...formData, notifyStaff: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                    </label>
                </div>
                <p className="text-xs text-slate-500 italic px-1">
                    * Ao salvar, os disparos ocorrerão automaticamente via API.
                </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <button
                    onClick={onCancel}
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    type="button" // changed to button to prevent form submit default if not wrapped in form
                    className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? 'Salvando...' : (initialData ? "Salvar Alterações" : <><Zap className="w-4 h-4" /> Criar e Disparar Avisos</>)}
                </button>
            </div>
        </div>
    );
};

export default EventForm;
