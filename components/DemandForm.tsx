import React, { useState, useEffect } from 'react';
import { Demand } from '../types';

interface DemandFormProps {
    initialData?: Demand | null;
    onSave: (data: Partial<Demand>) => Promise<void>;
    onCancel: () => void;
}

const DemandForm: React.FC<DemandFormProps> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Demand>>({
        title: '',
        description: '',
        beneficiary: '',
        category: 'Saúde',
        priority: 'Média',
        status: 'Pendente',
        obs: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return;
        setLoading(true);
        await onSave(formData);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Título / O que precisa?</label>
                <input
                    value={formData.title || ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Tapa buraco na Rua X"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                    <select
                        value={formData.category || 'Outros'}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                    >
                        <option value="Saúde">Saúde</option>
                        <option value="Infraestrutura">Infraestrutura</option>
                        <option value="Educação">Educação</option>
                        <option value="Social">Social</option>
                        <option value="Outros">Outros</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
                    <select
                        value={formData.priority || 'Média'}
                        onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                    >
                        <option value="Alta">Alta</option>
                        <option value="Média">Média</option>
                        <option value="Baixa">Baixa</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                        value={formData.status || 'Pendente'}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                    >
                        <option value="Pendente">A Fazer</option>
                        <option value="Em Andamento">Em Execução</option>
                        <option value="Concluída">Feito</option>
                    </select>
                </div>
                <div>
                    {/* TODO: Integrate with Voter Selection later */}
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Beneficiário (Nome)</label>
                    <input
                        value={formData.beneficiary || ''}
                        onChange={e => setFormData({ ...formData, beneficiary: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Descrição Detalhada</label>
                <textarea
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-50">
                    {loading ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
    );
};

export default DemandForm;
