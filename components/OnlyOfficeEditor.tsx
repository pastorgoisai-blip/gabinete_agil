import React, { useEffect, useState } from 'react';
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface OnlyOfficeEditorProps {
    fileId: string; // The path in storage, e.g., "cabinet_id/filename.docx"
    fileName: string;
    fileExt: string;
    documentServerUrl?: string; // Default to configured env or hardcoded
    onClose?: () => void;
}

const OnlyOfficeEditor: React.FC<OnlyOfficeEditorProps> = ({
    fileId,
    fileName,
    fileExt,
    documentServerUrl = "https://office.gabineteonline.online",
    onClose
}) => {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            try {
                // Call Supabase Edge Function to get signed config
                const { data, error } = await supabase.functions.invoke('onlyoffice-auth', {
                    body: {
                        file_id: fileId,
                        file_name: fileName,
                        file_ext: fileExt
                    }
                });

                if (error) throw error;
                setConfig(data);
            } catch (err: any) {
                console.error("OnlyOffice Auth Error:", err);
                setError("Erro ao autenticar com o editor de documentos.");
            } finally {
                setLoading(false);
            }
        };

        if (fileId) {
            fetchConfig();
        }
    }, [fileId, fileName, fileExt]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-4" />
                <p className="text-slate-600">Preparando editor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-red-50 p-6 rounded-lg text-center">
                <p className="text-red-600 font-bold mb-2">Não foi possível carregar o editor.</p>
                <p className="text-red-500 text-sm">{error}</p>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50">
                    Fechar
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[600px] bg-white relative">
            <DocumentEditor
                id="docxEditor"
                documentServerUrl={documentServerUrl}
                config={config}
                events_onDocumentReady={() => console.log("Document Ready")}
                events_onError={(err) => console.error("Editor Error:", err)}
            />
        </div>
    );
};

export default OnlyOfficeEditor;
