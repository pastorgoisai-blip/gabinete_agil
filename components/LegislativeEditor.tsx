import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DocTemplate, LegislativeOffice } from '../types';
import { Save, ArrowLeft, FileText, Check, LayoutTemplate, Upload } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { convertDocxToHtml } from '../src/utils/wordToHtml';

interface LegislativeEditorProps {
    onCancel: () => void;
    onSaveSuccess: () => void;
    initialData?: LegislativeOffice | null;
}

const LegislativeEditor: React.FC<LegislativeEditorProps> = ({ onCancel, onSaveSuccess, initialData }) => {
    const { profile } = useAuth();
    const [templates, setTemplates] = useState<DocTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
    const [step, setStep] = useState<'template' | 'editor'>('template');

    // Form Meta
    const [meta, setMeta] = useState({
        number: initialData?.number || '',
        year: initialData?.year || new Date().getFullYear().toString(),
        recipient: initialData?.recipient || '',
        subject: initialData?.subject || '',
        type: initialData?.type || 'Ofício'
    });

    // Branding State
    const [cabinet, setCabinet] = useState<any>(null);

    // We need a state for content to pass to RichTextEditor
    const [content, setContent] = useState(initialData?.content_html || '');

    useEffect(() => {
        const fetchCabinet = async () => {
            if (!profile?.cabinet_id) return;
            const { data } = await supabase
                .from('cabinets')
                .select('header_url, footer_url, official_name, use_letterhead')
                .eq('id', profile.cabinet_id)
                .single();
            if (data) setCabinet(data);
        };
        fetchCabinet();
    }, [profile]);

    useEffect(() => {
        if (initialData) {
            setStep('editor');
        } else {
            setStep('template');
        }
    }, [initialData]);

    useEffect(() => {
        if (selectedTemplate?.content_html) {
            setContent(selectedTemplate.content_html);
        }
    }, [selectedTemplate]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        const { data } = await supabase.from('doc_templates').select('*');
        if (data) setTemplates(data);
    };

    const handleTemplateSelect = async (template: DocTemplate) => {
        let contentToUse = template.content_html || '';

        // Se não tiver HTML mas tiver storage_path (templates antigos do OnlyOffice)
        if (!contentToUse && template.storage_path) {
            try {
                // Tenta baixar do storage. 
                // Assumindo bucket 'legislative-documents' ou outro onde o arquivo esteja.
                // O OnlyOffice salvava no 'legislative-documents'.
                const { data, error } = await supabase.storage
                    .from('legislative-documents')
                    .download(template.storage_path);

                if (error) {
                    // Fallback check: maybe it is just a path string needing correction or in another bucket?
                    // For now, simple logging.
                    console.error('Erro ao baixar template:', error);
                    throw error;
                }

                if (data) {
                    // Converter Blob para File para satisfazer a tipagem
                    const file = new File([data], "template_temp.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
                    const html = await convertDocxToHtml(file);
                    contentToUse = html;
                }
            } catch (err) {
                console.error('Erro ao converter template legado:', err);
                alert('Atenção: Não foi possível carregar o conteúdo original deste modelo antigo. O editor abrirá em branco.');
            }
        }

        setSelectedTemplate(template);
        setContent(contentToUse);
        setMeta(prev => ({ ...prev, type: template.type }));
        setStep('editor');
    };

    const handleNewTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        try {
            const html = await convertDocxToHtml(file);
            const templateName = prompt("Nome do novo Modelo (baseado no arquivo):", file.name.replace('.docx', ''));
            if (!templateName) return;

            if (!profile?.cabinet_id) return;

            const { error } = await supabase.from('doc_templates').insert([{
                title: templateName,
                type: 'Outros',
                content_html: html,
                cabinet_id: profile.cabinet_id
            }]);

            if (error) throw error;
            alert('Modelo criado com sucesso!');
            fetchTemplates();

        } catch (err) {
            console.error('Erro ao processar upload:', err);
            alert('Erro ao converter arquivo. Verifique se é um DOCX válido.');
        }
    };

    const handleSave = async () => {
        if (!profile?.cabinet_id) return;

        // Extract pure text for search/subject if needed
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const plainText = doc.body.textContent || '';
        const searchSubject = meta.subject || plainText.substring(0, 50); // Fallback if subject is empty

        const payload = {
            cabinet_id: profile.cabinet_id,
            type: meta.type,
            number: meta.number,
            year: meta.year,
            recipient: meta.recipient,
            subject: searchSubject,
            status: 'Pendente',
            content_html: content,
            updated_at: new Date().toISOString()
        } as any;

        if (!initialData?.id) {
            payload.created_at = new Date().toISOString();
        }

        let error;
        if (initialData?.id) {
            const { error: updateError } = await supabase
                .from('offices')
                .update(payload)
                .eq('id', initialData.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('offices')
                .insert([payload]);
            error = insertError;
        }

        if (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar documento.');
        } else {
            onSaveSuccess();
        }
    };

    const handleSaveTemplate = async () => {
        if (!profile?.cabinet_id) return;

        const templateName = prompt("Nome do novo Modelo:");
        if (!templateName) return;

        try {
            const { error } = await supabase.from('doc_templates').insert([{
                title: templateName,
                type: 'Outros', // Default or could also prompt
                content_html: content,
                cabinet_id: profile.cabinet_id
            }]);

            if (error) throw error;
            alert('Modelo salvo com sucesso! Ele aparecerá na lista de escolha.');
            fetchTemplates(); // Refresh local list if needed
        } catch (err) {
            console.error('Error saving template:', err);
            alert('Erro ao salvar modelo.');
        }
    };

    if (step === 'template') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-slate-700">
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <h2 className="text-xl font-bold dark:text-white">Escolha um Modelo</h2>
                    </div>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".docx"
                            onChange={handleNewTemplateUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="Carregar arquivo DOCX"
                        />
                        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors">
                            <Upload className="w-4 h-4" /> Importar Novo Modelo (DOCX)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {templates.map(tmpl => (
                        <div
                            key={tmpl.id}
                            onClick={() => handleTemplateSelect(tmpl)}
                            className="border border-gray-200 dark:border-slate-700 rounded-xl p-6 cursor-pointer hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10 transition-all bg-white dark:bg-slate-800 group"
                        >
                            <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 p-3 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                                <LayoutTemplate className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{tmpl.title}</h3>
                            <p className="text-sm text-slate-500">{tmpl.type}</p>
                            {tmpl.storage_path && !tmpl.content_html && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-2 inline-block">
                                    Legado (DOCX)
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in flex flex-col h-screen">
            {/* Top Bar - Fixed */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 pb-4 bg-white dark:bg-slate-900 sticky top-0 z-40 px-4 pt-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setStep('template')} className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-slate-700">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Novo {meta.type}</h2>
                        <p className="text-xs text-slate-500">Preencha os dados e edite o conteúdo</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-primary-500/20"
                >
                    <Save className="w-4 h-4" /> Salvar Documento
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6 px-4 pb-10 flex-1 overflow-hidden">
                {/* Metadata Form - Sidebar */}
                <div className="col-span-12 lg:col-span-3 space-y-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700 h-fit overflow-y-auto">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Número</label>
                        <input
                            value={meta.number}
                            onChange={e => setMeta({ ...meta, number: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded p-2 text-sm"
                            placeholder="001"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ano</label>
                        <input
                            value={meta.year}
                            onChange={e => setMeta({ ...meta, year: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded p-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Destinatário</label>
                        <input
                            value={meta.recipient}
                            onChange={e => setMeta({ ...meta, recipient: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded p-2 text-sm"
                            placeholder="Ex: Prefeito Municipal"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Assunto</label>
                        <textarea
                            value={meta.subject}
                            onChange={e => setMeta({ ...meta, subject: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded p-2 text-sm min-h-[100px]"
                            placeholder="Resumo do conteúdo..."
                        />
                    </div>
                </div>

                {/* Editor Area */}
                <div className="col-span-12 lg:col-span-9 overflow-y-auto h-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-900 relative">
                    <RichTextEditor
                        content={content}
                        onChange={setContent}
                        headerUrl={cabinet?.use_letterhead ? cabinet.header_url : undefined}
                        footerUrl={cabinet?.use_letterhead ? cabinet.footer_url : undefined}
                        onSaveTemplate={handleSaveTemplate}
                    />
                </div>
            </div>
        </div>
    );
};

export default LegislativeEditor;
