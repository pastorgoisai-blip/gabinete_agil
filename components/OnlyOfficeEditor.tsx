import React, { useEffect, useState } from 'react';
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface OnlyOfficeEditorProps {
    fileId: string; // The path in storage, e.g., "cabinet_id/filename.docx"
    fileName: string;
    fileExt: string;
    documentServerUrl?: string;
    onClose?: () => void;
    onSave?: () => void;
}

const OnlyOfficeEditor: React.FC<OnlyOfficeEditorProps> = ({
    fileId,
    fileName,
    fileExt,
    documentServerUrl = "https://office.gabineteonline.online",
    onClose,
    onSave
}) => {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const fetchConfig = async (retries = 3) => {
        setLoading(true);
        setError(null);

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                console.log(`Fetching OnlyOffice config (attempt ${attempt + 1}/${retries})...`);

                // Call Supabase Edge Function to get signed config
                const { data, error } = await supabase.functions.invoke('onlyoffice-auth', {
                    body: {
                        file_id: fileId,
                        file_name: fileName,
                        file_ext: fileExt
                    }
                });

                if (error) {
                    console.error("OnlyOffice Auth Error:", error);
                    throw new Error(error.message || "Erro ao autenticar");
                }

                if (!data) {
                    throw new Error("Resposta vazia do servidor");
                }

                console.log("OnlyOffice config loaded successfully:", data);
                setConfig(data);
                setLoading(false);
                return;

            } catch (err: any) {
                console.error(`Attempt ${attempt + 1} failed:`, err);

                if (attempt === retries - 1) {
                    // Last attempt failed
                    setError(err.message || "Não foi possível conectar com o editor. Verifique sua conexão e tente novamente.");
                    setLoading(false);
                    return;
                }

                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    };

    useEffect(() => {
        if (fileId && fileName && fileExt) {
            fetchConfig();
        } else {
            setError("Parâmetros inválidos: fileId, fileName ou fileExt ausente");
            setLoading(false);
        }
    }, [fileId, fileName, fileExt]);

    const handleRetry = () => {
        setRetryCount(retryCount + 1);
        fetchConfig();
    };

    const handleDocumentReady = () => {
        console.log("📄 OnlyOffice: Document is ready");
    };

    const handleError = (event: any) => {
        console.error("📛 OnlyOffice Error:", event);
        let errorMessage = "Erro desconhecido";
        if (event && event.data) {
            if (typeof event.data === 'object') {
                errorMessage = JSON.stringify(event.data);
            } else {
                errorMessage = event.data;
            }
        }
        setError(`Erro no editor: ${errorMessage}`);
    };

    // Loading State
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600 mb-4" />
                <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">
                    Preparando editor colaborativo...
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Conectando ao OnlyOffice Document Server
                </p>
                <div className="mt-6 flex gap-2">
                    <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse delay-150"></div>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px] bg-red-50 dark:bg-red-900/20 p-8 rounded-xl text-center border-2 border-red-200 dark:border-red-800">
                <div className="bg-red-100 dark:bg-red-900/40 p-4 rounded-full mb-4">
                    <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
                    Não foi possível carregar o editor
                </h3>
                <p className="text-red-600 dark:text-red-400 text-sm mb-6 max-w-md">
                    {error}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={handleRetry}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all transform hover:scale-105"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Tentar Novamente
                    </button>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            Fechar
                        </button>
                    )}
                </div>

                <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-800 text-left">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        💡 Possíveis causas:
                    </p>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <li>• OnlyOffice Document Server offline</li>
                        <li>• Arquivo não encontrado no storage</li>
                        <li>• Permissões insuficientes</li>
                        <li>• Problema de rede ou firewall</li>
                    </ul>
                </div>
            </div>
        );
    }

    // Editor State
    return (
        <div className="w-full h-full min-h-[700px] bg-white dark:bg-slate-900 relative rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700">
            {/* Header Info Bar */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                        Editando: <span className="font-bold">{fileName}</span>
                    </span>
                </div>
                <div className="text-xs opacity-90">
                    Salvamento automático ativado
                </div>
            </div>

            {/* OnlyOffice Editor */}
            {/* OnlyOffice Editor */}
            {config && config.document && (
                <div key={config.document.key} className="w-full h-full">
                    <DocumentEditor
                        id="onlyoffice-editor"
                        documentServerUrl={documentServerUrl}
                        config={config}
                        events_onDocumentReady={handleDocumentReady}
                        events_onError={handleError}
                        width="100%"
                        height="calc(100vh - 200px)"
                    />
                </div>
            )}

            {/* Footer Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <span>
                        🔐 Modo Colaborativo | Supabase Storage
                    </span>
                    <span>
                        OnlyOffice Document Server v8.x
                    </span>
                </div>
            </div>
        </div>
    );
};

export default OnlyOfficeEditor;
