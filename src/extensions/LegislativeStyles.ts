import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

export interface LegislativeStylesOptions {
    types: string[];
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        legislativeStyles: {
            setLegislativeStyle: (style: string) => ReturnType;
            toggleArticleNumbering: () => ReturnType;
        };
    }
}

export const LegislativeStyles = Extension.create<LegislativeStylesOptions>({
    name: 'legislativeStyles',

    addOptions() {
        return {
            types: ['paragraph', 'heading'],
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    legislativeStyle: {
                        default: null,
                        parseHTML: element => element.getAttribute('data-legislative-style'),
                        renderHTML: attributes => {
                            if (!attributes.legislativeStyle) {
                                return {};
                            }

                            return {
                                'data-legislative-style': attributes.legislativeStyle,
                                class: `legislative-style-${attributes.legislativeStyle}`,
                            };
                        },
                    },
                    articleNumber: {
                        default: null,
                        parseHTML: element => element.getAttribute('data-article-number'),
                        renderHTML: attributes => {
                            if (!attributes.articleNumber) {
                                return {};
                            }

                            return {
                                'data-article-number': attributes.articleNumber,
                            };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setLegislativeStyle: (style: string) => ({ commands }) => {
                return commands.updateAttributes('paragraph', { legislativeStyle: style });
            },

            toggleArticleNumbering: () => ({ chain }) => {
                return chain()
                    .updateAttributes('paragraph', { legislativeStyle: 'artigo' })
                    .run();
            },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-Shift-a': () => this.editor.commands.toggleArticleNumbering(),
        };
    },
});
