import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, CheckCircle2, FileText, Globe, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CreateFromTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (document: any) => void;
}

interface Template {
    id: string;
    title: string;
    type: string;
    storage_path: string | null;
    cabinet_id: string | null;
    created_at: string;
}

const TEMPLATE_ICONS: Record<string, string> = {
    'Ofício': '📄',
    'Ofício de Gabinete': '📄',
    'Moção': '👏',
    'Moção de Aplausos': '👏',
    'Indicação': '💡',
    'Título': '🏆',
    'Título de Cidadão': '🏆',
    'Requerimento': '📋',
};

const TEMPLATE_GRADIENTS: Record<string, string> = {
    'Ofício': 'from-blue-500 to-blue-600',
    'Ofício de Gabinete': 'from-blue-500 to-blue-600',
    'Moção': 'from-green-500 to-green-600',
    'Moção de Aplausos': 'from-green-500 to-green-600',
    'Indicação': 'from-amber-500 to-amber-600',
    'Título': 'from-purple-500 to-purple-600',
    'Título de Cidadão': 'from-purple-500 to-purple-600',
    'Requerimento': 'from-red-500 to-red-600',
};

const CreateFromTemplateModal: React.FC<CreateFromTemplateModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { profile } = useAuth();

    const [step, setStep] = useState<'choose' | 'metadata'>('choose');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [number, setNumber] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');

    // Load templates from database
    useEffect(() => {
        if (isOpen && profile?.cabinet_id) {
            fetchTemplates();
        }
    }, [isOpen, profile]);

    const fetchTemplates = async () => {
        if (!profile?.cabinet_id) return;

        setLoadingTemplates(true);
        setError(null);

        try {
            // Get both global templates (cabinet_id = null) AND cabinet-specific templates
            const { data, error: fetchError } = await supabase
                .from('doc_templates')
                .select('*')
                .or(`cabinet_id.is.null,cabinet_id.eq.${profile.cabinet_id}`)
                .not('storage_path', 'is', null) // Apenas templates com arquivo DOCX
                .order('type', { ascending: true })
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setTemplates(data || []);

            if (!data || data.length === 0) {
                setError('Nenhum template disponível. Faça upload de templates DOCX na seção "Configurações".');
            }
        } catch (err: any) {
            console.error('Error fetching templates:', err);
            setError('Erro ao carregar templates. Tente novamente.');
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleSelectTemplate = (template: Template) => {
        setSelectedTemplate(template);
        setStep('metadata');
        setError(null);
    };

    const handleBack = () => {
        setStep('choose');
        setSelectedTemplate(null);
        setError(null);
    };

    const handleCreate = async () => {
        if (!selectedTemplate || !number || !year) {
            setError('Por favor, preencha o número e o ano');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Changed function name to match the one deployed in previous steps: 'create-document-from-template'
            const { data, error: fnError } = await supabase.functions.invoke('create-document-from-template', {
                body: {
                    template_id: selectedTemplate.id,
                    metadata: {
                        number,
                        year,
                        recipient: recipient || undefined,
                        subject: subject || undefined,
                    },
                },
            });

            if (fnError) throw fnError;

            if (!data.success) {
                throw new Error(data.error || 'Erro ao criar documento');
            }

            // Success!
            onSuccess(data.document);
            handleClose();
        } catch (err: any) {
            console.error('Error creating document:', err);
            setError(err.message || 'Erro ao criar documento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('choose');
        setSelectedTemplate(null);
        setNumber('');
        setYear(new Date().getFullYear().toString());
        setRecipient('');
        setSubject('');
        setError(null);
        onClose();
    };

    const getTemplateIcon = (type: string): string => {
        // Procura por match parcial (ex: "Ofício de Gabinete" → "Ofício")
        const matchKey = Object.keys(TEMPLATE_ICONS).find(key => type.includes(key));
        return TEMPLATE_ICONS[matchKey || ''] || '📄';
    };

    const getTemplateGradient = (type: string): string => {
        const matchKey = Object.keys(TEMPLATE_GRADIENTS).find(key => type.includes(key));
        return TEMPLATE_GRADIENTS[matchKey || ''] || 'from-gray-500 to-gray-600';
    };

    const isGlobalTemplate = (template: Template): boolean => {
        return template.cabinet_id === null;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {step === 'choose' ? 'Escolha um Template' : 'Preencha os Metadados'}
                            </h2>
                            <p className="text-sm text-white/80">
                                {step === 'choose'
                                    ? `${templates.length} template(s) disponível(is)`
                                    : 'O documento será aberto no OnlyOffice para edição'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* STEP 1: Choose Template */}
                    {step === 'choose' && (
                        <div className="space-y-6">
                            {loadingTemplates ? (
                                <div className="text-center py-12">
                                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary-600 mb-4" />
                                    <p className="text-slate-600 dark:text-slate-400">Carregando templates...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6">
                                    <FileText className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                                    <p className="text-amber-800 dark:text-amber-400 font-medium mb-2">{error}</p>
                                    <button
                                        onClick={fetchTemplates}
                                        className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Tentar Novamente
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templates.map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleSelectTemplate(template)}
                                            className="group relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-850 rounded-xl p-6 text-left hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 border-transparent hover:border-primary-500 overflow-hidden"
                                        >
                                            {/* Gradient Accent */}
                                            <div
                                                className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getTemplateGradient(template.type)}`}
                                            ></div>

                                            {/* Global/Cabinet Badge */}
                                            <div className="absolute top-4 right-4">
                                                {isGlobalTemplate(template) ? (
                                                    <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />
                                                        Global
                                                    </div>
                                                ) : (
                                                    <div className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                        <Building2 className="w-3 h-3" />
                                                        Meu Gabinete
                                                    </div>
                                                )}
                                            </div>

                                            {/* Icon */}
                                            <div className="text-5xl mb-4">{getTemplateIcon(template.type)}</div>

                                            {/* Content */}
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors pr-20">
                                                {template.title}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                                {template.type}
                                            </p>

                                            {/* File Info */}
                                            <div className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                                                <FileText className="w-3 h-3" />
                                                Arquivo DOCX pronto
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: Metadata Form */}
                    {step === 'metadata' && selectedTemplate && (
                        <div className="space-y-6">
                            {/* Selected Template Info */}
                            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-4 border-2 border-primary-200 dark:border-primary-800">
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">{getTemplateIcon(selectedTemplate.type)}</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                            {selectedTemplate.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {selectedTemplate.type}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Number */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        Número
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={number}
                                        onChange={(e) => setNumber(e.target.value)}
                                        placeholder="001"
                                        disabled={loading}
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-800 dark:text-white disabled:opacity-50"
                                        autoFocus
                                    />
                                </div>

                                {/* Year */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        Ano
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        placeholder="2025"
                                        disabled={loading}
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-800 dark:text-white disabled:opacity-50"
                                    />
                                </div>

                                {/* Recipient (Optional) */}
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        Destinatário (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                        placeholder="Ex: Secretaria de Obras"
                                        disabled={loading}
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-800 dark:text-white disabled:opacity-50"
                                    />
                                </div>

                                {/* Subject (Optional) */}
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        Assunto (Opcional)
                                    </label>
                                    <textarea
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Breve descrição do documento..."
                                        rows={3}
                                        disabled={loading}
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none text-slate-800 dark:text-white disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-400">
                                <p className="font-bold mb-1 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Como funciona:
                                </p>
                                <ul className="space-y-1 ml-6 list-disc">
                                    <li>O template DOCX será copiado para seu gabinete</li>
                                    <li>OnlyOffice abrirá automaticamente</li>
                                    <li>Edite o documento livremente (já está formatado)</li>
                                    <li>Salvamento automático ativado</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                    {step === 'metadata' ? (
                        <>
                            <button
                                onClick={handleBack}
                                disabled={loading}
                                className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading || !number || !year}
                                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Criar e Abrir Editor
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="ml-auto px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateFromTemplateModal;
