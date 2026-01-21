import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { saveAs } from 'file-saver';
// @ts-ignore
import { asBlob } from 'html-docx-js-typescript';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import {
    Bold, Italic, Underline as UnderlineIcon,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Minus, FileText
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    headerUrl?: string; // New prop
    footerUrl?: string; // New prop
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, headerUrl, footerUrl }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
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
        <div className="rich-text-editor-container flex flex-col items-center bg-gray-100 dark:bg-slate-900 min-h-screen pt-8 pb-20">
            {/* Toolbar */}
            <div className="sticky top-4 z-50 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-gray-200 dark:border-slate-700 px-6 py-2 mb-8 flex gap-2 items-center overflow-x-auto max-w-[90vw]">
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

                {/* Insert Elements */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    icon={Minus}
                    label="Quebra de Página"
                />

                <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

                {/* Export */}
                <button
                    onClick={handleExportDocx}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-colors ml-2"
                    title="Baixar .DOCX"
                >
                    <FileText className="w-4 h-4" /> DOCX
                </button>
            </div>

            {/* Editor Area (A4) Wrapper */}
            <div className="relative shadow-2xl mb-10 w-[21cm] min-h-[29.7cm] bg-white">

                {/* Visual Identity Overlays */}
                {headerUrl && (
                    <div className="absolute top-0 left-0 w-full flex justify-center p-4 z-10 pointer-events-none">
                        <img src={headerUrl} alt="Header" className="max-h-[3cm] w-auto object-contain" />
                    </div>
                )}

                {footerUrl && (
                    <div className="absolute bottom-0 left-0 w-full flex justify-center p-4 z-10 pointer-events-none">
                        <img src={footerUrl} alt="Footer" className="max-h-[2cm] w-auto object-contain" />
                    </div>
                )}

                <div className="print:m-0 print:p-0 print:shadow-none print:w-full">
                    <style>{`
                        .ProseMirror ul {
                            list-style-type: disc;
                            padding-left: 1.5em;
                        }
                        .ProseMirror ol {
                            list-style-type: decimal;
                            padding-left: 1.5em;
                        }
                        .ProseMirror p {
                            margin-bottom: 1em;
                        }
                        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
                            margin-top: 1.5em;
                            margin-bottom: 0.5em;
                            font-weight: bold;
                        }
                        /* Page Break Visuals */
                        .ProseMirror hr {
                            border: 0;
                            border-top: 2px dashed #ccc;
                            margin: 2em 0;
                            position: relative;
                            page-break-after: always;
                        }
                        .ProseMirror hr::after {
                            content: 'Quebra de Página';
                            position: absolute;
                            top: -0.7em;
                            left: 50%;
                            transform: translateX(-50%);
                            background: white;
                            padding: 0 0.5em;
                            color: #999;
                            font-size: 0.75em;
                            font-weight: bold;
                            text-transform: uppercase;
                        }
                        /* Ensure editor content is above branding if needed, but here branding is overlay with pointer-events-none */
                        .ProseMirror {
                             min-height: 29.7cm;
                             padding: 2.5cm; /* Ensure content starts after header */
                             padding-top: ${headerUrl ? '3.5cm' : '2.5cm'};
                             padding-bottom: ${footerUrl ? '2.5cm' : '2.5cm'};
                        }
                    `}</style>
                    <EditorContent editor={editor} className="relative z-0" />
                </div>
            </div>
        </div>
    );
};

export default RichTextEditor;
