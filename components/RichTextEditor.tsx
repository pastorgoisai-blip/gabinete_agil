import React, { useEffect, useRef, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    AccessibilityHelp,
    Alignment,
    Autoformat,
    Autosave,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    BlockQuote,
    Essentials,
    Heading,
    Indent,
    List,
    Paragraph,
    Table,
    TableToolbar,
    PageBreak,
    FileRepository
} from 'ckeditor5';

import { MyCustomUploadAdapterPlugin } from '../src/utils/ckeditorUploadAdapter';
import { exportToProfessionalDocx } from '../src/utils/exportProfessionalDocx';
import 'ckeditor5/ckeditor5.css';
import './RichTextEditor.css';
import { Save, FileText, Download, Printer, AlertTriangle } from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    headerUrl?: string;
    footerUrl?: string;
    onSaveTemplate?: () => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onChange,
    headerUrl,
    footerUrl,
    onSaveTemplate
}) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const [editorError, setEditorError] = useState<string | null>(null);

    useEffect(() => {
        setIsLayoutReady(true);
        return () => setIsLayoutReady(false);
    }, []);

    const editorConfig = {
        toolbar: {
            items: [
                'undo', 'redo', '|',
                'heading', '|',
                'bold', 'italic', 'underline', 'strikethrough', '|',
                'alignment', 'outdent', 'indent', '|',
                'bulletedList', 'numberedList', '|',
                'insertTable', 'blockQuote', 'pageBreak'
            ],
            shouldNotGroupWhenFull: false
        },
        plugins: [
            AccessibilityHelp,
            Alignment,
            Autoformat,
            Autosave,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            BlockQuote,
            Essentials,
            Heading,
            Indent,
            List,
            Paragraph,
            Table,
            TableToolbar,
            PageBreak,
            FileRepository,
            MyCustomUploadAdapterPlugin
        ],
        heading: {
            options: [
                { model: 'paragraph' as const, title: 'Normal', class: 'ck-heading_paragraph' },
                { model: 'heading1' as const, view: 'h1' as const, title: 'Título 1', class: 'ck-heading_heading1' },
                { model: 'heading2' as const, view: 'h2' as const, title: 'Título 2', class: 'ck-heading_heading2' },
                { model: 'heading3' as const, view: 'h3' as const, title: 'Título 3', class: 'ck-heading_heading3' }
            ]
        },
        table: {
            contentToolbar: [
                'tableColumn',
                'tableRow',
                'mergeTableCells'
            ]
        },
        licenseKey: 'GPL',
        initialData: content
    };

    const handleExportDocx = async () => {
        try {
            await exportToProfessionalDocx({
                html: content,
                headerUrl: headerUrl,
                footerUrl: footerUrl,
                filename: 'documento-legislativo.docx',
                metadata: {
                    title: 'Documento Legislativo',
                    creator: 'Gabinete Ágil',
                    keywords: ['legislativo', 'ofício', 'câmara municipal'],
                },
            });
        } catch (error) {
            console.error('Erro ao exportar:', error);
            alert('Erro ao gerar documento. Por favor, tente novamente.');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (editorError) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-red-50">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-red-700 mb-2">Erro ao carregar o Editor</h3>
                <p className="text-red-600 max-w-md bg-white p-4 rounded shadow border border-red-200">
                    {editorError}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Recarregar Página
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
            {/* Toolbar externa / Ações */}
            <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm z-20 toolbar-container">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    Editor de Documentos (Modo Seguro)
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        title="Imprimir"
                    >
                        <Printer className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-slate-200 self-center mx-1"></div>
                    <button
                        onClick={handleExportDocx}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all transform hover:-translate-y-0.5"
                        title="Exportar para DOCX"
                    >
                        <Download className="w-4 h-4" /> Exportar DOCX
                    </button>
                    {onSaveTemplate && (
                        <button
                            onClick={onSaveTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all transform hover:-translate-y-0.5"
                            title="Salvar como Modelo"
                        >
                            <Save className="w-4 h-4" /> Salvar Modelo
                        </button>
                    )}
                </div>
            </div>

            {/* Área do Editor (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-100 dark:bg-slate-950">
                <div className="page-a4">

                    {headerUrl && (
                        <div className="absolute top-[0.5cm] left-0 w-full flex justify-center z-10 pointer-events-none select-none">
                            <img src={headerUrl} alt="Header" className="max-h-[2.5cm] w-auto object-contain" />
                        </div>
                    )}

                    <div ref={editorContainerRef} className="flex-1">
                        {isLayoutReady && (
                            <CKEditor
                                editor={ClassicEditor}
                                config={editorConfig}
                                data={content}
                                onChange={(event, editor) => {
                                    const data = editor.getData();
                                    onChange(data);
                                }}
                                onError={(error, { willEditorRestart }) => {
                                    console.error('CKEditor Crashing Error:', error);
                                    setEditorError(error.message || 'Erro desconhecido no CKEditor');
                                }}
                            />
                        )}
                    </div>

                    {footerUrl && (
                        <div className="absolute bottom-[0.5cm] left-0 w-full flex justify-center z-10 pointer-events-none select-none">
                            <img src={footerUrl} alt="Footer" className="max-h-[1.5cm] w-auto object-contain" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RichTextEditor;
