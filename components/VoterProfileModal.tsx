import React from 'react';
import {
    X, MapPin, Phone, Mail, Calendar, Tag, MessageCircle, Edit, Trash2, User
} from 'lucide-react';
import { Voter } from '../types';

interface VoterProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    voter: Voter | null;
    onEdit: (voter: Voter) => void;
    onDelete: (voter: Voter) => void;
}

const VoterProfileModal: React.FC<VoterProfileModalProps> = ({
    isOpen, onClose, voter, onEdit, onDelete
}) => {
    if (!isOpen || !voter) return null;

    const getInitial = (name: string) => name.charAt(0).toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-card dark:bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="relative h-32 bg-gradient-to-r from-primary-600 to-primary-800">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Profile Info */}
                <div className="px-8 pb-8 flex-1 overflow-y-auto">
                    <div className="relative -mt-16 mb-6 flex justify-between items-end">
                        <div className="flex items-end gap-6">
                            <div className="w-32 h-32 rounded-full border-4 border-card dark:border-card bg-card dark:bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground shadow-lg">
                                {voter.avatar_url ? (
                                    <img src={voter.avatar_url} alt={voter.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    getInitial(voter.name)
                                )}
                            </div>
                            <div className="mb-2">
                                <h2 className="text-2xl font-bold text-foreground dark:text-foreground">{voter.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase">
                                        {voter.category}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${voter.status === 'active'
                                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                        }`}>
                                        {voter.status === 'active' ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 mb-2">
                            <button
                                onClick={() => onEdit(voter)}
                                className="p-2 text-muted-foreground hover:text-primary-600 hover:bg-primary-50 dark:text-muted-foreground dark:hover:bg-muted rounded-lg transition-colors"
                                title="Editar"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => onDelete(voter)}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:text-muted-foreground dark:hover:bg-muted rounded-lg transition-colors"
                                title="Excluir"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-foreground dark:text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary-500" />
                                    Dados Pessoais
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Telefone</p>
                                            <p className="text-slate-900 dark:text-white font-medium">{voter.phone || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                                            <p className="text-slate-900 dark:text-white font-medium">{voter.email || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Nascimento</p>
                                            <p className="text-slate-900 dark:text-white font-medium">
                                                {voter.birth_date ? new Date(voter.birth_date).toLocaleDateString('pt-BR') : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="flex items-center justify-center w-5 h-5 font-bold text-slate-400 text-xs border border-slate-300 rounded">CPF</span>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">CPF</p>
                                            <p className="text-slate-900 dark:text-white font-medium">{voter.cpf || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary-500" />
                                    Endereço
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Completo</p>
                                            <p className="text-slate-900 dark:text-white font-medium">{voter.address || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5"></div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Bairro</p>
                                            <p className="text-slate-900 dark:text-white font-medium">{voter.neighborhood || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5"></div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Cidade</p>
                                            <p className="text-slate-900 dark:text-white font-medium">{voter.city || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-primary-500" />
                                    Outros
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Indicado por</p>
                                        <p className="text-slate-900 dark:text-white font-medium">{voter.indicated_by || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Tags</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {voter.tags && voter.tags.length > 0 ? voter.tags.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full">
                                                    {tag}
                                                </span>
                                            )) : (
                                                <span className="text-slate-400 text-sm">Sem tags</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-muted/50 dark:bg-muted/50 border-t border-border dark:border-border flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-card dark:bg-card border border-border dark:border-border text-foreground dark:text-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
                    >
                        Fechar
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" /> Whatsapp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoterProfileModal;
