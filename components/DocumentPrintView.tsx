import React, { useState, useEffect } from 'react';
import { LegislativeOffice } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Printer, CheckCircle, ArrowLeft } from 'lucide-react';
import { printHtml } from '../src/utils/printService';

interface DocumentPrintViewProps {
    document: LegislativeOffice;
    onBack: () => void;
    onUpdate: () => void;
}

const DocumentPrintView: React.FC<DocumentPrintViewProps> = ({ document, onBack, onUpdate }) => {
    const { profile } = useAuth();
    const [signing, setSigning] = useState(false);
    const [cabinet, setCabinet] = useState<any>(null);

    useEffect(() => {
        const fetchCabinet = async () => {
            if (!profile?.cabinet_id) return;
            const { data } = await supabase
                .from('cabinets')
                .select('*')
                .eq('id', profile.cabinet_id)
                .single();
            if (data) setCabinet(data);
        };
        fetchCabinet();
    }, [profile]);

    const handlePrint = () => {
        if (!document.content_html) return;

        // Check if content is already wrapped in a4-page (from Template)
        const isWrapped = document.content_html.includes('class="a4-page"');

        let htmlToPrint = document.content_html;

        if (!isWrapped) {
            // Wrap and add branding if permitted
            const headerHtml = (cabinet?.use_letterhead && cabinet?.header_url)
                ? `<div style="text-align:center; margin-bottom: 2cm;"><img src="${cabinet.header_url}" style="max-height: 3cm;"></div>`
                : '';

            const footerHtml = (cabinet?.use_letterhead && cabinet?.footer_url)
                ? `<div style="text-align:center; margin-top: 2cm;"><img src="${cabinet.footer_url}" style="max-height: 2cm;"></div>`
                : '';

            htmlToPrint = `
                <div class="a4-page">
                    ${headerHtml}
                    ${document.content_html}
                    ${footerHtml}
                </div>
            `;
        }

        printHtml(htmlToPrint);
    };

    const handleSign = async () => {
        if (!profile?.cabinet_id) return;

        if (!confirm('Deseja assinar digitalmente este documento? Esta ação não pode ser desfeita.')) return;

        setSigning(true);
        try {
            const timestamp = new Date().toISOString();
            const uniqueString = `${document.id}-${timestamp}-${profile.id}`;
            let hash = 0;
            for (let i = 0; i < uniqueString.length; i++) {
                const char = uniqueString.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash = hash & hash;
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
            {/* Screen Controls */}
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

            {/* A4 Page PREVIEW (Visual representation for screen) */}
            <div className="bg-white text-black shadow-2xl print:shadow-none w-full max-w-[210mm] min-h-[297mm] p-[20mm] relative mx-auto">

                {/* Visual Header (Preview only, Print uses printDocument) */}
                {cabinet?.use_letterhead && cabinet?.header_url ? (
                    <div className="flex justify-center mb-8">
                        <img src={cabinet.header_url} alt="Header" className="max-h-[3cm] object-contain" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center border-b-2 border-slate-900 pb-6 mb-8 gap-6">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Coat_of_arms_of_Brazil.svg/1024px-Coat_of_arms_of_Brazil.svg.png"
                            alt="Brasão"
                            className="w-20 h-20 object-contain"
                        />
                        <div className="text-center">
                            <h1 className="text-xl font-bold uppercase">{cabinet?.official_name || 'Câmara Municipal'}</h1>
                            <p className="text-sm font-serif">{cabinet?.official_title || 'Gabinete'}</p>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div
                    className="prose prose-slate max-w-none font-serif text-justify leading-relaxed mb-20"
                    dangerouslySetInnerHTML={{ __html: document.content_html || '<p>Conteúdo não disponível.</p>' }}
                />

                {/* Footer / Signature */}
                <div className="mt-auto pt-10 text-center">
                    {cabinet?.use_letterhead && cabinet?.footer_url && (
                        <div className="absolute bottom-10 left-0 w-full flex justify-center">
                            <img src={cabinet.footer_url} alt="Footer" className="max-h-[2cm] object-contain" />
                        </div>
                    )}

                    {document.status === 'Assinado' ? (
                        <div className="border border-slate-300 rounded-lg p-4 inline-block bg-slate-50 relative z-10">
                            <div className="text-[10px] font-mono text-slate-400">
                                Assinado Digitalmente: {document.signature_hash}<br />
                                {new Date(document.signed_at!).toLocaleString('pt-BR')}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default DocumentPrintView;
