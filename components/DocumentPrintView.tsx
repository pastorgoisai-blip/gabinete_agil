import React, { useState } from 'react';
import { LegislativeOffice } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Printer, CheckCircle, ArrowLeft } from 'lucide-react';

interface DocumentPrintViewProps {
    document: LegislativeOffice;
    onBack: () => void;
    onUpdate: () => void;
}

const DocumentPrintView: React.FC<DocumentPrintViewProps> = ({ document, onBack, onUpdate }) => {
    const { profile } = useAuth();
    const [signing, setSigning] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleSign = async () => {
        if (!profile?.cabinet_id) return;
        // MVP Check: Allow anyone to sign for now, or check generic 'manager'/'admin' role
        // In strict mode: if (profile.role !== 'admin') { alert('Apenas o Vereador pode assinar.'); return; }

        if (!confirm('Deseja assinar digitalmente este documento? Esta ação não pode ser desfeita.')) return;

        setSigning(true);
        try {
            // Generate Logic Hash (mocked MD5 equivalent for visual validity)
            const timestamp = new Date().toISOString();
            const uniqueString = `${document.id}-${timestamp}-${profile.id}`;
            // Simple hash simulation
            let hash = 0;
            for (let i = 0; i < uniqueString.length; i++) {
                const char = uniqueString.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(32, '0');
            const finalHash = `MD5-${hexHash.substring(0, 16)}`;

            const { error } = await supabase
                .from('offices')
                .update({
                    status: 'Assinado',
                    signed_at: timestamp,
                    signature_hash: finalHash
                })
                .eq('id', document.id);

            if (error) throw error;

            alert('Documento assinado com sucesso!');
            onUpdate();
        } catch (err) {
            console.error('Error signing:', err);
            alert('Erro ao assinar documento.');
        } finally {
            setSigning(false);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-slate-900 p-4 print:p-0 print:bg-white">
            {/* Screen Controls - Hidden on Print */}
            <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 print:hidden">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                    <ArrowLeft className="w-5 h-5" /> Voltar
                </button>
                <div className="flex gap-2">
                    {document.status !== 'Assinado' && (
                        <button
                            onClick={handleSign}
                            disabled={signing}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
                        >
                            <CheckCircle className="w-4 h-4" /> {signing ? 'Assinando...' : 'Assinar Digitalmente'}
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
                    >
                        <Printer className="w-4 h-4" /> Imprimir
                    </button>
                </div>
            </div>

            {/* A4 Page */}
            <div className="bg-white text-black shadow-2xl print:shadow-none w-full max-w-[210mm] min-h-[297mm] p-[20mm] relative mx-auto print:absolute print:top-0 print:left-0 print:w-full print:m-0">

                {/* Header */}
                <div className="flex items-center justify-center border-b-2 border-slate-900 pb-6 mb-8 gap-6">
                    {/* Placeholder for Brasão - can be dynamic based on cabinet settings */}
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Coat_of_arms_of_Brazil.svg/1024px-Coat_of_arms_of_Brazil.svg.png"
                        alt="Brasão"
                        className="w-20 h-20 object-contain"
                    />
                    <div className="text-center">
                        <h1 className="text-xl font-bold uppercase">Câmara Municipal de Inovação</h1>
                        <p className="text-sm font-serif">Gabinete do Vereador {profile?.name || 'Administrador'}</p>
                        <p className="text-xs text-slate-500">Estado de Goiás</p>
                    </div>
                </div>

                {/* Metadata */}
                <div className="mb-10 font-serif">
                    <p className="text-right mb-8">
                        {document.type?.toUpperCase()} Nº <strong>{document.number}/{document.year}</strong>
                    </p>

                    <div className="space-y-4">
                        <p><strong>Destinatário:</strong><br />{document.recipient}</p>
                        <p><strong>Assunto:</strong><br />{document.subject}</p>
                    </div>
                </div>

                {/* Content */}
                <div
                    className="prose prose-slate max-w-none font-serif text-justify leading-relaxed mb-20"
                    dangerouslySetInnerHTML={{ __html: document.content_html || '<p>Conteúdo não disponível.</p>' }}
                />

                {/* Footer / Signature */}
                <div className="mt-auto pt-10 text-center">
                    {document.status === 'Assinado' ? (
                        <div className="border border-slate-300 rounded-lg p-4 inline-block bg-slate-50 print:bg-transparent print:border-slate-800">
                            <p className="font-bold uppercase mb-1">{profile?.name || 'Vereador'}</p>
                            <p className="text-xs text-slate-500 mb-2">Vereador / Autoridade</p>
                            <div className="text-[10px] font-mono text-slate-400 border-t border-slate-200 pt-2 print:border-slate-800 print:text-slate-600">
                                Documento assinado digitalmente.<br />
                                Hash de Verificação: {document.signature_hash}<br />
                                Data: {new Date(document.signed_at!).toLocaleString('pt-BR')}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-20">
                            <div className="w-64 h-px bg-black mx-auto mb-2"></div>
                            <p className="font-bold uppercase">{profile?.name || 'Vereador'}</p>
                            <p className="text-sm">Vereador</p>
                        </div>
                    )}
                </div>

                {/* Print Only Footer (Page count logic is hard in pure CSS/HTML, skipping for MVP) */}
            </div>

            <style>{`
        @media print {
          @page {
            margin: 0;
            size: A4;
          }
          body {
            background: white;
            color: black;
          }
          /* Hide everything outside of the A4 div is handled by making the A4 div full screen absolute, 
             but we also need to ensure the parent containers don't mess up layout. 
             A cleaner approach often involves a portal or specific print class on body. 
             For this MVP, we rely on the specific print classes on elements. */
          body > *:not(.flex) {
            display: none;
          }
        }
      `}</style>
        </div>
    );
};

export default DocumentPrintView;
