import React, { useState, useEffect } from 'react';
import { Voter } from '../types';

interface VoterFormProps {
    initialData?: Voter | null;
    onSave: (data: Partial<Voter>) => Promise<void>;
    onCancel: () => void;
}

const VoterForm: React.FC<VoterFormProps> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Voter>>({
        name: '',
        cpf: '',
        phone: '',
        address: '',
        category: 'Apoiador',
        status: 'active',
        tags: []
    });
    const [loading, setLoading] = useState(false);
    const [tagInput, setTagInput] = useState('');

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

    const handleAddTag = () => {
        if (tagInput && !formData.tags?.includes(tagInput)) {
            setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput] }));
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tag) }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 bg-gray-50 bg-white"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPF</label>
                    <input
                        type="text"
                        value={formData.cpf || ''}
                        onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 bg-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                    <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 bg-white"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço</label>
                <input
                    type="text"
                    value={formData.address || ''}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 bg-white"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                    <select
                        value={formData.category || 'Apoiador'}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 bg-white"
                    >
                        <option value="Liderança">Liderança</option>
                        <option value="Apoiador">Apoiador</option>
                        <option value="Voluntário">Voluntário</option>
                        <option value="Indeciso">Indeciso</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select
                        value={formData.status || 'active'}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 bg-white"
                    >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags / Interesses</label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        className="flex-1 rounded-md border-gray-300 dark:border-slate-600 dark:bg-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 bg-white"
                        placeholder="Ex: Saúde, Educação..."
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <button type="button" onClick={handleAddTag} className="bg-slate-200 px-3 rounded-md text-sm font-bold">+</button>
                </div>
                <div className="flex flex-wrap gap-1">
                    {formData.tags?.map(tag => (
                        <span key={tag} className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 font-bold">&times;</button>
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 disabled:opacity-50">
                    {loading ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
    );
};

export default VoterForm;
