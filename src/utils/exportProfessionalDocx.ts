import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Header,
    Footer,
    AlignmentType,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    ImageRun,
    convertInchesToTwip,
    ExternalHyperlink,
} from 'docx';
import { saveAs } from 'file-saver';

interface ExportOptions {
    html: string;
    headerUrl?: string;
    footerUrl?: string;
    filename?: string;
    metadata?: {
        title?: string;
        subject?: string;
        creator?: string;
        keywords?: string[];
    };
}

/**
 * Converte HTML do Tiptap para DOCX nativo editável
 */
export async function exportToProfessionalDocx(options: ExportOptions): Promise<void> {
    const {
        html,
        headerUrl,
        footerUrl,
        filename = 'documento-legislativo.docx',
        metadata = {},
    } = options;

    try {
        // 1. Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 2. Converter elementos para estrutura docx
        const children = await htmlToDocxElements(doc.body);

        // 3. Criar header e footer (se tiverem URLs)
        const headerContent = headerUrl ? await createImageHeader(headerUrl) : undefined;
        const footerContent = footerUrl ? await createImageFooter(footerUrl) : undefined;

        // 4. Criar documento
        const docxDocument = new Document({
            creator: metadata.creator || 'Gabinete Ágil',
            title: metadata.title || 'Documento Legislativo',
            subject: metadata.subject || '',
            keywords: (metadata.keywords || ['legislativo', 'ofício']).join(', '),
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: convertInchesToTwip(1.18), // 3cm
                                right: convertInchesToTwip(0.59), // 1.5cm
                                bottom: convertInchesToTwip(0.79), // 2cm
                                left: convertInchesToTwip(1.18), // 3cm (padrão ABNT)
                            },
                        },
                    },
                    headers: headerContent ? {
                        default: new Header({
                            children: [headerContent],
                        }),
                    } : undefined,
                    footers: footerContent ? {
                        default: new Footer({
                            children: [footerContent],
                        }),
                    } : undefined,
                    children,
                },
            ],
        });

        // 5. Gerar e baixar
        const blob = await Packer.toBlob(docxDocument);
        saveAs(blob, filename);
    } catch (error) {
        console.error('Erro ao exportar DOCX:', error);
        throw new Error('Falha ao gerar documento. Verifique a formatação.');
    }
}

/**
 * Converte elementos HTML para paragraphs do docx
 */
async function htmlToDocxElements(element: HTMLElement): Promise<Paragraph[]> {
    const paragraphs: Paragraph[] = [];

    for (const child of Array.from(element.children)) {
        const tagName = child.tagName.toLowerCase();

        // Parágrafos
        if (tagName === 'p') {
            const runs = extractTextRuns(child as HTMLElement);
            const alignment = getAlignment(child as HTMLElement);
            const legislativeStyle = (child as HTMLElement).getAttribute('data-legislative-style');

            paragraphs.push(
                new Paragraph({
                    children: runs,
                    alignment,
                    spacing: {
                        before: 120, // 6pt
                        after: 120,
                        line: 360, // 1.5 line spacing (240 = single, 360 = 1.5, 480 = double)
                    },
                    indent: legislativeStyle === 'paragrafo' ? {
                        firstLine: convertInchesToTwip(0.98), // 2.5cm
                    } : legislativeStyle === 'inciso' ? {
                        left: convertInchesToTwip(0.79), // 2cm
                    } : legislativeStyle === 'alinea' ? {
                        left: convertInchesToTwip(1.57), // 4cm
                    } : undefined,
                    style: legislativeStyle === 'artigo' ? 'Heading2' : undefined,
                })
            );
        }

        // Títulos
        else if (tagName.match(/^h[1-6]$/)) {
            const level = parseInt(tagName[1]) as 1 | 2 | 3 | 4 | 5 | 6;
            const runs = extractTextRuns(child as HTMLElement);

            paragraphs.push(
                new Paragraph({
                    children: runs,
                    heading: getHeadingLevel(level),
                    spacing: { before: 240, after: 120 },
                })
            );
        }

        // Listas
        else if (tagName === 'ul' || tagName === 'ol') {
            const listItems = child.querySelectorAll('li');
            listItems.forEach((li, index) => {
                const runs = extractTextRuns(li as HTMLElement);
                paragraphs.push(
                    new Paragraph({
                        children: runs,
                        bullet: tagName === 'ul' ? { level: 0 } : undefined,
                        numbering: tagName === 'ol' ? {
                            reference: 'default-numbering',
                            level: 0,
                        } : undefined,
                        spacing: { before: 60, after: 60 },
                    })
                );
            });
        }

        // Tabelas (básico)
        else if (tagName === 'table') {
            // Implementação simplificada de tabelas
            // Para tabelas complexas, expandir esta função
            const tableRows = child.querySelectorAll('tr');
            const docxRows: TableRow[] = [];

            tableRows.forEach((tr) => {
                const cells = tr.querySelectorAll('td, th');
                const docxCells: TableCell[] = [];

                cells.forEach((cell) => {
                    const runs = extractTextRuns(cell as HTMLElement);
                    docxCells.push(
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: runs,
                                }),
                            ],
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                                left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                                right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                            },
                        })
                    );
                });

                docxRows.push(new TableRow({ children: docxCells }));
            });

            // Adicionar tabela como parágrafo especial
            // (docx library precisa de wrapper, aqui simplificado)
        }

        // Linha horizontal
        else if (tagName === 'hr') {
            paragraphs.push(
                new Paragraph({
                    border: {
                        bottom: {
                            color: '000000',
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                    },
                    spacing: { before: 240, after: 240 },
                })
            );
        }

        // Quebra de página
        else if ((child as HTMLElement).classList.contains('page-break')) {
            paragraphs.push(
                new Paragraph({
                    children: [],
                    pageBreakBefore: true,
                })
            );
        }
    }

    return paragraphs;
}

/**
 * Extrai TextRuns com formatação (negrito, itálico, etc.)
 */
function extractTextRuns(element: HTMLElement): TextRun[] {
    const runs: TextRun[] = [];

    function traverse(node: Node, formatting: {
        bold?: boolean;
        italics?: boolean;
        underline?: boolean;
        color?: string;
        highlight?: string;
        subscript?: boolean;
        superscript?: boolean;
    } = {}) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            if (text.trim()) {
                runs.push(
                    new TextRun({
                        text,
                        bold: formatting.bold,
                        italics: formatting.italics,
                        underline: formatting.underline ? {} : undefined,
                        color: formatting.color,
                        highlight: formatting.highlight,
                        subScript: formatting.subscript,
                        superScript: formatting.superscript,
                        font: 'Times New Roman',
                        size: 24, // 12pt (half-points)
                    })
                );
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const newFormatting = { ...formatting };

            // Detectar formatação
            if (el.tagName === 'STRONG' || el.tagName === 'B') newFormatting.bold = true;
            if (el.tagName === 'EM' || el.tagName === 'I') newFormatting.italics = true;
            if (el.tagName === 'U') newFormatting.underline = true;
            if (el.tagName === 'SUB') newFormatting.subscript = true;
            if (el.tagName === 'SUP') newFormatting.superscript = true;

            // Detectar cor
            const style = el.style;
            if (style.color) {
                newFormatting.color = style.color.replace('#', '');
            }
            if (style.backgroundColor || el.tagName === 'MARK') {
                newFormatting.highlight = 'yellow';
            }

            // Recursão
            el.childNodes.forEach((child) => traverse(child, newFormatting));
        }
    }

    traverse(element);
    return runs;
}

/**
 * Converte alinhamento HTML para DOCX
 */
function getAlignment(element: HTMLElement) {
    const align = element.style.textAlign || element.getAttribute('align');

    switch (align) {
        case 'center':
            return AlignmentType.CENTER;
        case 'right':
            return AlignmentType.RIGHT;
        case 'justify':
            return AlignmentType.JUSTIFIED;
        default:
            return AlignmentType.LEFT;
    }
}

/**
 * Converte nível de heading HTML para DOCX
 */
function getHeadingLevel(level: number) {
    const levels: Record<number, any> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
    };
    return levels[level] || HeadingLevel.HEADING_1;
}

/**
 * Cria header com imagem
 */
async function createImageHeader(imageUrl: string): Promise<Paragraph> {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        return new Paragraph({
            children: [
                new ImageRun({
                    data: arrayBuffer,
                    transformation: {
                        width: 300,
                        height: 100,
                    },
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
        });
    } catch (error) {
        console.warn('Não foi possível carregar imagem do header:', error);
        return new Paragraph({ children: [] });
    }
}

/**
 * Cria footer com imagem
 */
async function createImageFooter(imageUrl: string): Promise<Paragraph> {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        return new Paragraph({
            children: [
                new ImageRun({
                    data: arrayBuffer,
                    transformation: {
                        width: 250,
                        height: 80,
                    },
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240 },
        });
    } catch (error) {
        console.warn('Não foi possível carregar imagem do footer:', error);
        return new Paragraph({ children: [] });
    }
}
