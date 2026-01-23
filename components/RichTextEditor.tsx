import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { saveAs } from 'file-saver';
import { exportToProfessionalDocx } from '../src/utils/exportProfessionalDocx';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import GapCursor from '@tiptap/extension-gapcursor';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import Focus from '@tiptap/extension-focus';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import AbntParagraph from '../src/extensions/AbntParagraph';
import { LegislativeStyles } from '../src/extensions/LegislativeStyles';
import EditorRuler from './EditorRuler';
import {
    Bold, Italic, Underline as UnderlineIcon,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Minus, FileText, Scissors, Save,
    Table as TableIcon,
    Trash2, Highlighter, Subscript as SubIcon,
    Superscript as SupIcon, Type
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    headerUrl?: string;
    footerUrl?: string;
    onSaveTemplate?: () => void;
}

const LEGISLATIVE_STYLES = [
    { value: 'normal', label: 'Normal' },
    { value: 'artigo', label: 'Artigo' },
    { value: 'paragrafo', label: 'Parágrafo' },
    { value: 'inciso', label: 'Inciso (I, II, III)' },
    { value: 'alinea', label: 'Alínea (a, b, c)' },
    { value: 'item', label: 'Item (1, 2, 3)' },
];

const FONT_FAMILIES = [
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Calibri', label: 'Calibri' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Courier New', label: 'Courier New' },
];

const FONT_SIZES = [
    { value: '10pt', label: '10' },
    { value: '11pt', label: '11' },
    { value: '12pt', label: '12' },
    { value: '14pt', label: '14' },
    { value: '16pt', label: '16' },
    { value: '18pt', label: '18' },
    { value: '20pt', label: '20' },
    { value: '24pt', label: '24' },
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onChange,
    headerUrl,
    footerUrl,
    onSaveTemplate
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState('#000000');

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                paragraph: false,
            }),
            AbntParagraph,
            LegislativeStyles.configure({
                types: ['paragraph', 'heading'],
            }),
            GapCursor,
            Underline,
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            FontFamily.configure({
                types: ['textStyle'],
            }),
            Subscript,
            Superscript,
            CharacterCount,
            Placeholder.configure({
                placeholder: 'Digite o conteúdo do documento legislativo...',
            }),
            Focus.configure({
                className: 'has-focus',
                mode: 'all',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'legislative-table',
                },
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[29.7cm] p-[2.5cm] bg-white shadow-2xl w-[21cm] relative legislative-editor',
            },
        },
    });

    if (!editor) {
        return null;
    }

    const ToolbarButton = ({
        onClick,
        isActive = false,
        icon: Icon,
        label,
        disabled = false,
    }: {
        onClick: () => void;
        isActive?: boolean;
        icon: React.ElementType;
        label: string;
        disabled?: boolean;
    }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={`p-2 rounded-lg transition-all ${isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    const handleExportDocx = async () => {
        if (!editor) return;

        try {
            await exportToProfessionalDocx({
                html: editor.getHTML(),
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

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-slate-900">
            {/* TOOLBAR STICKY - FIXO NO TOPO */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 shadow-lg z-50">
                <div className="max-w-[210mm] mx-auto space-y-2">
                    {/* Linha 1: Formatação de Texto */}
                    <div className="flex flex-wrap items-center gap-1">
                        {/* Família de Fonte */}
                        <select
                            value={editor.getAttributes('textStyle').fontFamily || 'Times New Roman'}
                            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200"
                        >
                            {FONT_FAMILIES.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                            ))}
                        </select>

                        {/* Tamanho de Fonte */}
                        <select
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 w-16"
                        >
                            {FONT_SIZES.map(size => (
                                <option key={size.value} value={size.value}>{size.label}</option>
                            ))}
                        </select>

                        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

                        {/* Negrito, Itálico, Sublinhado */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            isActive={editor.isActive('bold')}
                            icon={Bold}
                            label="Negrito (Ctrl+B)"
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            isActive={editor.isActive('italic')}
                            icon={Italic}
                            label="Itálico (Ctrl+I)"
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            isActive={editor.isActive('underline')}
                            icon={UnderlineIcon}
                            label="Sublinhado (Ctrl+U)"
                        />

                        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

                        {/* Subscrito e Sobrescrito */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleSubscript().run()}
                            isActive={editor.isActive('subscript')}
                            icon={SubIcon}
                            label="Subscrito"
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleSuperscript().run()}
                            isActive={editor.isActive('superscript')}
                            icon={SupIcon}
                            label="Sobrescrito"
                        />

                        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

                        {/* Cor de Texto */}
                        <div className="relative">
                            <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-1"
                                title="Cor do Texto"
                            >
                                <Type className="w-4 h-4" />
                                <div
                                    className="w-4 h-1 rounded"
                                    style={{ backgroundColor: currentColor }}
                                />
                            </button>
                            {showColorPicker && (
                                <div className="absolute top-10 left-0 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-2 shadow-xl z-50">
                                    <input
                                        type="color"
                                        value={currentColor}
                                        onChange={(e) => {
                                            setCurrentColor(e.target.value);
                                            editor.chain().focus().setColor(e.target.value).run();
                                        }}
                                        className="w-32 h-8 cursor-pointer"
                                    />
                                    <div className="mt-2 grid grid-cols-5 gap-1">
                                        {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#800000', '#008000'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => {
                                                    setCurrentColor(color);
                                                    editor.chain().focus().setColor(color).run();
                                                }}
                                                className="w-6 h-6 rounded border border-gray-300"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Marca-Texto */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHighlight().run()}
                            isActive={editor.isActive('highlight')}
                            icon={Highlighter}
                            label="Marca-Texto"
                        />
                    </div>

                    {/* Linha 2: Alinhamento e Listas */}
                    <div className="flex flex-wrap items-center gap-1">
                        {/* Estilos Legislativos */}
                        <select
                            onChange={(e) => editor.chain().focus().setLegislativeStyle(e.target.value).run()}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200"
                        >
                            {LEGISLATIVE_STYLES.map(style => (
                                <option key={style.value} value={style.value}>{style.label}</option>
                            ))}
                        </select>

                        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

                        {/* Alinhamento */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            isActive={editor.isActive({ textAlign: 'left' })}
                            icon={AlignLeft}
                            label="Alinhar à Esquerda"
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            isActive={editor.isActive({ textAlign: 'center' })}
                            icon={AlignCenter}
                            label="Centralizar"
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            isActive={editor.isActive({ textAlign: 'right' })}
                            icon={AlignRight}
                            label="Alinhar à Direita"
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                            isActive={editor.isActive({ textAlign: 'justify' })}
                            icon={AlignJustify}
                            label="Justificar"
                        />

                        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

                        {/* Listas */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            isActive={editor.isActive('bulletList')}
                            icon={List}
                            label="Lista com Marcadores"
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            isActive={editor.isActive('orderedList')}
                            icon={ListOrdered}
                            label="Lista Numerada"
                        />

                        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

                        {/* Tabelas */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                            icon={TableIcon}
                            label="Inserir Tabela 3x3"
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().deleteTable().run()}
                            icon={Trash2}
                            label="Excluir Tabela"
                            disabled={!editor.isActive('table')}
                        />

                        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

                        {/* Utilitários */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setHorizontalRule().run()}
                            icon={Minus}
                            label="Linha Horizontal"
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().insertContent('<div class="page-break"></div><p></p>').run()}
                            icon={Scissors}
                            label="Quebra de Página"
                        />

                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={handleExportDocx}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
                                title="Exportar para DOCX"
                            >
                                <FileText className="w-4 h-4" /> DOCX
                            </button>

                            {onSaveTemplate && (
                                <button
                                    onClick={onSaveTemplate}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors"
                                    title="Salvar como Modelo"
                                >
                                    <Save className="w-4 h-4" /> Modelo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contador de Caracteres */}
                <div className="max-w-[210mm] mx-auto mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>
                            {editor.storage.characterCount.characters()} caracteres | {editor.storage.characterCount.words()} palavras
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-bold">
                            💡 Dica: Use Ctrl+Shift+A para criar Artigo
                        </span>
                    </div>
                </div>
            </div>

            {/* ÁREA DE SCROLL - FLEXÍVEL */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="relative mx-auto w-[210mm] py-6">
                    <EditorRuler />

                    <style>{`
          /* Estilos existentes permanecem inalterados */
          .legislative-editor {
            font-family: 'Times New Roman', serif;
          }

          .legislative-style-artigo {
            font-weight: bold;
            margin-top: 1cm;
            font-size: 12pt;
          }

          .legislative-style-artigo::before {
            content: "Art. " attr(data-article-number) "º - ";
            font-weight: bold;
          }

          .legislative-style-paragrafo {
            text-indent: 2.5cm;
            text-align: justify;
          }

          .legislative-style-inciso {
            margin-left: 2cm;
            list-style-type: upper-roman;
          }

          .legislative-style-alinea {
            margin-left: 4cm;
            list-style-type: lower-alpha;
          }

          .legislative-style-item {
            margin-left: 6cm;
            list-style-type: decimal;
          }

          .legislative-table {
            border-collapse: collapse;
            width: 100%;
            margin: 1cm 0;
          }

          .legislative-table td,
          .legislative-table th {
            border: 1px solid #000;
            padding: 0.3cm;
            min-width: 1cm;
          }

          .legislative-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }

          .has-focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          .page-break {
            border-top: 2px dashed #9ca3af;
            margin: 20px 0;
            position: relative;
            page-break-after: always;
          }

          .page-break::after {
            content: 'QUEBRA DE PÁGINA';
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: #e5e7eb;
            padding: 0 10px;
            font-size: 10px;
            color: #6b7280;
          }

          .ProseMirror {
            width: 210mm;
            min-height: 297mm;
            padding: 3cm 1.5cm 2cm 3cm;
            margin: 0 auto 2rem auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            outline: none;
          }

          .ProseMirror p.is-editor-empty:first-child::before {
            color: #adb5bd;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
        `}</style>

                    {headerUrl && (
                        <div className="absolute top-[2rem] left-0 w-full flex justify-center pt-8 z-10 pointer-events-none">
                            <img src={headerUrl} alt="Header" className="max-h-[3cm] w-auto object-contain" />
                        </div>
                    )}

                    <EditorContent editor={editor} />

                    {footerUrl && (
                        <div className="absolute bottom-[2rem] left-0 w-full flex justify-center pb-8 z-10 pointer-events-none">
                            <img src={footerUrl} alt="Footer" className="max-h-[2cm] w-auto object-contain" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RichTextEditor;
