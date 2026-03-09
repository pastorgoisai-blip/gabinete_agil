
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVotersCore } from '../src/modules/crm/presentation/hooks/useVotersCore';
import type { Voter } from '../src/modules/crm/domain/entities/Voter';
import { User, Phone, MapPin, Mail, Calendar, Hash, Tag, UserCheck } from 'lucide-react';

interface VoterFormProps {
    voter?: Voter | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function VoterForm({ voter, onSuccess, onCancel }: VoterFormProps) {
    const { profile } = useAuth();
    const { createVoter, updateVoter } = useVotersCore();
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [cpfError, setCpfError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        cpf: '',
        phone: '',
        email: '',
        address: '',
        neighborhood: '',
        city: 'Anápolis', // Default para facilitar
        birthDate: '',
        category: 'Indeciso',
        indicatedBy: '',
        tags: '' // Gerenciar como string comma-separated na UI por simplicidade inicial
    });

    useEffect(() => {
        if (voter) {
            setFormData({
                name: voter.name || '',
                cpf: voter.cpf || '',
                phone: voter.phone || '',
                email: voter.email || '',
                address: voter.address || '',
                neighborhood: voter.neighborhood || '',
                city: voter.city || '',
                birthDate: voter.birthDate || '',
                category: voter.category || 'Indeciso',
                indicatedBy: voter.indicatedBy || '',
                tags: voter.tags ? voter.tags.join(', ') : ''
            });
        }
    }, [voter]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'cpf') setCpfError(null);
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.cabinet_id) return;
        setLoading(true);
        setFormError(null);
        setCpfError(null);

        try {
            const parsedTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);

            if (voter?.id) {
                // Update via useVotersCore
                const result = await updateVoter(voter.id, {
                    name: formData.name,
                    cpf: formData.cpf.replace(/\D/g, '') || undefined,
                    phone: formData.phone,
                    email: formData.email || undefined,
                    address: formData.address,
                    neighborhood: formData.neighborhood || undefined,
                    city: formData.city || undefined,
                    birthDate: formData.birthDate || undefined,
                    category: formData.category as Voter['category'],
                    indicatedBy: formData.indicatedBy || undefined,
                    tags: parsedTags.length > 0 ? parsedTags : undefined,
                });
                if (!result.success) {
                    throw new Error(result.error || 'Erro ao atualizar eleitor.');
                }
            } else {
                // Create via useVotersCore (CPF validated by domain Value Object)
                const result = await createVoter(profile.cabinet_id, {
                    name: formData.name,
                    cpf: formData.cpf.replace(/\D/g, '') || undefined,
                    phone: formData.phone,
                    email: formData.email || undefined,
                    address: formData.address,
                    neighborhood: formData.neighborhood || undefined,
                    city: formData.city || undefined,
                    birthDate: formData.birthDate || undefined,
                    category: formData.category as Voter['category'],
                    indicatedBy: formData.indicatedBy || undefined,
                    tags: parsedTags.length > 0 ? parsedTags : undefined,
                });
                if (!result.success) {
                    throw new Error(result.error || 'Erro ao criar eleitor.');
                }
            }

            onSuccess();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro desconhecido.';
            // Surface CPF validation errors specifically
            if (message.toLowerCase().includes('cpf')) {
                setCpfError(message);
            } else {
                setFormError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                    {formError}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dados Pessoais */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">Nome Completo *</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="pl-10 w-full rounded-lg border-border dark:border-border bg-background dark:bg-background text-foreground dark:text-foreground border p-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Nome do eleitor"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">CPF</label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleChange}
                            className={`pl-10 w-full rounded-lg border p-2 focus:ring-primary-500 focus:border-primary-500 ${
                                cpfError
                                    ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/10'
                                    : 'border-border dark:border-border bg-background dark:bg-background'
                            } text-foreground dark:text-foreground`}
                            placeholder="000.000.000-00"
                        />
                    </div>
                    {cpfError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{cpfError}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">Data de Nascimento</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="date"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleChange}
                            className="pl-10 w-full rounded-lg border-border dark:border-border bg-background dark:bg-background text-foreground dark:text-foreground border p-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                </div>

                {/* Contato */}
                <div>
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">Telefone / WhatsApp</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="pl-10 w-full rounded-lg border-border dark:border-border bg-background dark:bg-background text-foreground dark:text-foreground border p-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="(62) 99999-9999"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="pl-10 w-full rounded-lg border-gray-300 border p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="email@exemplo.com"
                        />
                    </div>
                </div>

                {/* Endereço */}
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">Endereço</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="pl-10 w-full rounded-lg border-border dark:border-border bg-background dark:bg-background text-foreground dark:text-foreground border p-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Rua, Número, Qd, Lt"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">Bairro</label>
                    <input
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleChange}
                        className="w-full rounded-lg border-border dark:border-border bg-background dark:bg-background text-foreground dark:text-foreground border p-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Nome do Bairro"
                    />
                </div>

                {/* Classificação */}
                <div>
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">Categoria</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full rounded-lg border-border dark:border-border bg-background dark:bg-background text-foreground dark:text-foreground border p-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="Indeciso">Indeciso</option>
                        <option value="Apoiador">Apoiador</option>
                        <option value="Liderança">Liderança</option>
                        <option value="Voluntário">Voluntário</option>
                        <option value="Oposição">Oposição</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">Indicado Por (Captador)</label>
                    <div className="relative">
                        <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            name="indicatedBy"
                            value={formData.indicatedBy}
                            onChange={handleChange}
                            className="pl-10 w-full rounded-lg border-border dark:border-border bg-background dark:bg-background text-foreground dark:text-foreground border p-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Quem indicou?"
                        />
                    </div>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">Tags (Interesses)</label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            className="pl-10 w-full rounded-lg border-border dark:border-border bg-background dark:bg-background text-foreground dark:text-foreground border p-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Saúde, Educação, Bairro X (separar por vírgula)"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-foreground dark:text-foreground bg-background dark:bg-background border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                    {loading ? 'Salvando...' : 'Salvar Eleitor'}
                </button>
            </div>
        </form>
    );
}
