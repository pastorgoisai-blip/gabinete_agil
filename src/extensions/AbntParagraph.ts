import Paragraph from '@tiptap/extension-paragraph';

const AbntParagraph = Paragraph.extend({
    addAttributes() {
        return {
            abnt: {
                default: false,
                parseHTML: element => element.classList.contains('abnt-indent'),
                renderHTML: attributes => {
                    if (attributes.abnt) {
                        return { class: 'abnt-indent' };
                    }
                    return {};
                },
            },
            // Keep alignment from standard configuration
            textAlign: {
                default: 'left',
                parseHTML: element => element.style.textAlign || 'left',
                renderHTML: attributes => {
                    if (attributes.textAlign !== 'left') {
                        return { style: `text-align: ${attributes.textAlign}` }
                    }
                    return {}
                },
            }
        };
    },
});

export default AbntParagraph;
