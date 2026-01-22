import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { saveAs } from 'file-saver';
// @ts-ignore
import { asBlob } from 'html-docx-js-typescript';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import GapCursor from '@tiptap/extension-gapcursor';
import AbntParagraph from '../src/extensions/AbntParagraph';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import EditorRuler from './EditorRuler';
import {
    Bold, Italic, Underline as UnderlineIcon,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Minus, FileText, Scissors, Save,
    Indent as IndentIcon, Outdent as OutdentIcon, Table as TableIcon,
    Trash2, Columns, Rows
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    headerUrl?: string;
    footerUrl?: string;
    onSaveTemplate?: () => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, headerUrl, footerUrl, onSaveTemplate }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                paragraph: false, // We use custom AbntParagraph
            }),
            AbntParagraph,
            GapCursor,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Table.configure({
                resizable: true,
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
                // Modified padding to 2.5cm and reduced reliance on margin for printing
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[29.7cm] p-[2.5cm] bg-white shadow-2xl w-[21cm] relative',
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
        label
    }: {
        onClick: () => void;
        isActive?: boolean;
        icon: React.ElementType;
        label: string;
    }) => (
        <button
            onClick={onClick}
            aria-label={label}
            title={label}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${isActive ? 'bg-gray-300 dark:bg-slate-600' : ''
                }`}
        >
            <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
    );

    // Export Function
    const handleExportDocx = () => {
        if (!editor) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        font-size: 12pt;
                        line-height: 1.5;
                        margin: 2.5cm;
                    }
                    div.header {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        text-align: center;
                    }
                     div.footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        text-align: center;
                    }
                    img.branding {
                        max-width: 100%;
                        height: auto;
                    }
                </style>
            </head>
            <body>
                 ${headerUrl ? `<div class="header"><img src="${headerUrl}" class="branding" style="max-height: 3cm;" /></div>` : ''}
                 
                 <!-- Content spacer if header exists to avoid overlap in Word (though Word handles fixed differently, this is a best effort) -->
                 ${headerUrl ? '<br /><br /><br />' : ''}

                 ${editor.getHTML()}

                 ${footerUrl ? '<br /><br /><br />' : ''}
                 ${footerUrl ? `<div class="footer"><img src="${footerUrl}" class="branding" style="max-height: 2cm;" /></div>` : ''}
            </body>
            </html>
        `;

        asBlob(htmlContent).then((blob: Blob) => {
            saveAs(blob, 'documento.docx');
        });
    };

    return (
        <div className="rich-text-editor-container flex flex-col items-center bg-gray-100 dark:bg-slate-900 min-h-screen pt-8 pb-20 overflow-auto">
            {/* Toolbar */}
            <div className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-2 mb-8 flex flex-wrap gap-1 items-center w-full shadow-sm">
                {/* Formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    icon={Bold}
                    label="Negrito"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    icon={Italic}
                    label="Itálico"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    icon={UnderlineIcon}
                    label="Sublinhado"
                />

                <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

                {/* Alignment */}
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

                {/* Lists */}
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

                {/* Indent / ABNT */}
                <ToolbarButton
                    onClick={() => {
                        const isAbnt = editor.isActive('paragraph', { abnt: true });
                        editor.chain().focus().updateAttributes('paragraph', { abnt: !isAbnt }).run();
                    }}
                    icon={IndentIcon}
                    label="Parágrafo ABNT (2.5cm)"
                    isActive={editor.isActive('paragraph', { abnt: true })}
                />
                {/* Tables */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    icon={TableIcon}
                    label="Inserir Tabela 3x3"
                />
                <div className="flex flex-col gap-0.5">
                    <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="p-1 hover:bg-gray-200 rounded" title="Add Coluna"><Columns className="w-3 h-3" /></button>
                    <button onClick={() => editor.chain().focus().addRowAfter().run()} className="p-1 hover:bg-gray-200 rounded" title="Add Linha"><Rows className="w-3 h-3" /></button>
                </div>
                <ToolbarButton
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    icon={Trash2}
                    label="Excluir Tabela"
                />

                <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />
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

                <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

                <button
                    onClick={handleExportDocx}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-colors ml-2"
                    title="Baixar .DOCX"
                >
                    <FileText className="w-4 h-4" /> DOCX
                </button>

                {onSaveTemplate && (
                    <button
                        onClick={onSaveTemplate}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-colors ml-2"
                        title="Salvar como Modelo"
                    >
                        <Save className="w-4 h-4" /> Modelo
                    </button>
                )}
            </div>

            {/* Page Container Wrapper for Positioning */}
            <div className="relative mx-auto w-[210mm]">
                {/* Ruler Component */}
                <EditorRuler />

                <style>{`
                    .ProseMirror {
                        width: 210mm;
                        min-height: 297mm;
                        padding: 3cm 1.5cm 2cm 3cm; /* Margens Oficiais */
                        margin: 0 auto 2rem auto; /* Removed top margin as Ruler takes space */
                        background: white;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        /* Guia Visual de Páginas (Linha pontilhada a cada 297mm) */
                        background-image: linear-gradient(#e5e7eb 1px, transparent 1px);
                        background-size: 100% 297mm;
                        outline: none;
                        ${headerUrl ? 'padding-top: 3.5cm;' : ''}
                        ${footerUrl ? 'padding-bottom: 2.5cm;' : ''}
                    }
                    /* Table Styles */
                    .ProseMirror table {
                      border-collapse: collapse;
                      margin: 0;
                      overflow: hidden;
                      table-layout: fixed;
                      width: 100%;
                    }
                    .ProseMirror td, .ProseMirror th {
                      border: 1px solid #ced4da;
                      box-sizing: border-box;
                      min-width: 1em;
                      padding: 3px 5px;
                      position: relative;
                    }
                    .ProseMirror th {
                      background-color: #f1f3f5;
                      font-weight: bold;
                    }
                    .ProseMirror .selectedCell:after {
                      z-index: 2;
                      position: absolute;
                      content: "";
                      left: 0; right: 0; top: 0; bottom: 0;
                      background: rgba(200, 200, 255, 0.4);
                      pointer-events: none;
                    }
                    /* Page Break Visuals */
                    .page-break {
                        border-top: 2px dashed #9ca3af;
                        margin: 20px 0;
                        position: relative;
                        page-break-after: always; /* Visible in print */
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
                    /* Standard Tiptap lists */
                    .ProseMirror ul {
                        list-style-type: disc;
                        padding-left: 1.5em;
                    }
                    .ProseMirror ol {
                        list-style-type: decimal;
                        padding-left: 1.5em;
                    }
                     /* Signature Block Protection */
                    .signature-block {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    /* ABNT Indent */
                    .ProseMirror p.abnt-indent {
                        text-indent: 2.5cm;
                    }
                `}</style>

                {/* Visual Identity Overlays - Positioned Absolute over the Editor */}
                {headerUrl && (
                    <div className="absolute top-[2rem] left-0 w-full flex justify-center pt-8 z-10 pointer-events-none">
                        {/* top-[2rem] matches margin-top of .ProseMirror, plus pt-8 to push it down a bit inside the padding area */}
                        <img src={headerUrl} alt="Header" className="max-h-[3cm] w-auto object-contain" />
                    </div>
                )}

                <EditorContent editor={editor} />

                {footerUrl && (
                    /* Footer positioning */
                    <div className="absolute top-[calc(2rem+297mm-2.5cm)] left-0 w-full flex justify-center z-10 pointer-events-none">
                        <img src={footerUrl} alt="Footer" className="max-h-[2cm] w-auto object-contain" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RichTextEditor;
