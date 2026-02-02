import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { Upload, X, Paperclip, Calendar } from 'lucide-react';

interface ProjectFormProps {
    initialData?: Project | null;
    onSave: (data: Partial<Project>) => void;
    onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        type: 'Projeto de Lei',
        number: '',
        year: new Date().getFullYear().toString(),
        author: 'Wederson Lopes',
        summary: '',
        status: 'Em Tramitação' as const,
        deadline: '',
        document_url: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                type: initialData.type,
                number: initialData.number,
                year: initialData.year,
                author: initialData.author,
                summary: initialData.summary,
                status: initialData.status as any,
                deadline: initialData.deadline || '',
                document_url: initialData.document_url || ''
            });
        }
    }, [initialData]);

    const handleSubmit = () => {
        if (!formData.number || !formData.summary) return; // Basic validation
        onSave(formData);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">Tipo</label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-background text-foreground dark:text-foreground focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option>Projeto de Lei</option>
                        <option>Projeto de Decreto Legislativo</option>
                        <option>Requerimento</option>
                        <option>Moção</option>
                        <option>Ofício</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">Número</label>
                    <input
                        type="text"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        placeholder="Ex: 123"
                        className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-background text-foreground dark:text-foreground focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ano</label>
                    <input
                        type="text"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-background text-foreground dark:text-foreground focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-background text-foreground dark:text-foreground focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="Em Tramitação">Em Tramitação</option>
                        <option value="Finalizado">Finalizado</option>
                        <option value="Arquivado">Arquivado</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Autor</label>
                    <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-background text-foreground dark:text-foreground focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prazo / Vencimento</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-background text-foreground dark:text-foreground focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ementa / Resumo</label>
                <textarea
                    rows={4}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Descreva o resumo do projeto..."
                    className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-background text-foreground dark:text-foreground focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link do Documento (URL)</label>
                <input
                    type="text"
                    value={formData.document_url}
                    onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-background text-foreground dark:text-foreground focus:ring-2 focus:ring-primary-500 outline-none"
                />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
                >
                    Salvar
                </button>
            </div>
        </div>
    );
};

export default ProjectForm;
