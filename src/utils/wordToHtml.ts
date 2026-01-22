import mammoth from 'mammoth';

export const convertDocxToHtml = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                    reject(new Error('Falha ao ler o arquivo.'));
                    return;
                }

                const result = await mammoth.convertToHtml({ arrayBuffer });

                // Mammoth often returns basic HTML. We might want to wrap it or clean it if needed.
                // For now, we return standard generated HTML.
                resolve(result.value); // The generated HTML

                // result.messages contains warnings (e.g. unknown styles)
                if (result.messages.length > 0) {
                    console.warn('Mammoth conversion warnings:', result.messages);
                }

            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
