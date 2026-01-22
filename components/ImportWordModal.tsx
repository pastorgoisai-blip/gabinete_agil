import React, { useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { convertDocxToHtml } from '../src/utils/wordToHtml';

interface ImportWordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (html: string) => void;
}

const ImportWordModal: React.FC<ImportWordModalProps> = ({ isOpen, onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            if (selected.name.endsWith('.docx')) {
                setFile(selected);
                setError(null);
            } else {
                setError('Por favor, selecione um arquivo .docx válido.');
                setFile(null);
            }
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        try {
            const html = await convertDocxToHtml(file);
            onImport(html);
            onClose();
        } catch (err) {
            console.error(err);
            setError('Erro ao processar arquivo. Verifique se é um .docx válido.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Importar do Word
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Selecione um arquivo .docx para converter em um template editável.
                    </p>

                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center transition-colors hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 group cursor-pointer relative">
                        <input
                            type="file"
                            accept=".docx"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        {file ? (
                            <div className="flex flex-col items-center">
                                <div className="bg-blue-100 text-blue-600 p-3 rounded-full mb-3">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-slate-700 dark:text-slate-200">{file.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                                <p className="text-xs text-blue-600 mt-2 font-bold hover:underline">Clique para trocar</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="bg-gray-100 dark:bg-slate-700 text-gray-400 group-hover:text-primary-500 p-3 rounded-full mb-3 transition-colors">
                                    <UploadCloud className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-slate-700 dark:text-slate-200">Clique ou arraste um arquivo</p>
                                <p className="text-xs text-slate-500 mt-1">Apenas arquivos .docx</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mt-4">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleProcess}
                            disabled={!file || loading}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>Processando...</>
                            ) : (
                                <>Processar Arquivo</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportWordModal;
