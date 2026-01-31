import React, { useState, useEffect } from 'react';
import { Demand } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { User, Tag, Briefcase } from 'lucide-react';
import { useDemands } from '../hooks/useDemands';

interface DemandFormProps {
    initialData?: Demand | null;
    onSave: (data: Partial<Demand>) => Promise<void>;
    onCancel: () => void;
}

const DemandForm: React.FC<DemandFormProps> = ({ initialData, onSave, onCancel }) => {
    const { profile } = useAuth();
    const { getUniqueCategories } = useDemands();

    const [formData, setFormData] = useState<Partial<Demand>>({
        title: '',
        description: '',
        beneficiary: '',
        category: 'Saúde',
        priority: 'Média',
        status: 'Pendente',
        assigned_to: '',
        obs: ''
    });

    const [existingCategories, setExistingCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }

        // Load categories for autocomplete
        const loadCategories = async () => {
            const cats = await getUniqueCategories();
            setExistingCategories(cats);
        };
        loadCategories();
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return;
        setLoading(true);
        await onSave(formData);
        setLoading(false);
    };

    const defaultCategories = ['Saúde', 'Infraestrutura', 'Educação', 'Social', 'Segurança', 'Esporte', 'Cultura', 'Outros'];
    const allCategories = Array.from(new Set([...defaultCategories, ...existingCategories]));

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header / Main Info */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">O que precisa ser feito?</label>
                    <input
                        value={formData.title || ''}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Reforma da Praça Central"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all shadow-sm"
                        required
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-slate-400" /> Categoria
                        </label>
                        <input
                            list="categories-list"
                            value={formData.category || ''}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            placeholder="Selecione ou digite..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                        />
                        <datalist id="categories-list">
                            {allCategories.map(cat => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Prioridade</label>
                        <select
                            value={formData.priority || 'Média'}
                            onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                        >
                            <option value="Alta">Alta 🔥</option>
                            <option value="Média">Média</option>
                            <option value="Baixa">Baixa</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* People Involved */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Beneficiário (Quem pediu?)</label>
                        <input
                            value={formData.beneficiary || ''}
                            onChange={e => setFormData({ ...formData, beneficiary: e.target.value })}
                            placeholder="Nome do munícipe"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Responsável Acompanhamento
                        </label>
                        <input
                            value={formData.assigned_to || ''}
                            onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                            placeholder="Ex: Chefe de Gabinete, Assessoria..."
                            className="w-full px-3 py-2 border border-left-4 border-l-blue-500 border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-300">
                        <User className="w-3 h-3" />
                        Registrado por: {initialData?.author || profile?.name || 'Seu Usuário'}
                    </div>
                </div>
            </div>

            {/* Status & Description */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Status Atual</label>
                    <select
                        value={formData.status || 'Pendente'}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                    >
                        <option value="Pendente">🟡 Pendente / A Fazer</option>
                        <option value="Em Andamento">🔵 Em Execução</option>
                        <option value="Concluída">🟢 Concluído / Entregue</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Detalhes / Observações</label>
                    <textarea
                        value={formData.description || ''}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-lg shadow-primary-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? 'Salvando...' : 'Salvar Demanda'}
                </button>
            </div>
        </form>
    );
};

export default DemandForm;
