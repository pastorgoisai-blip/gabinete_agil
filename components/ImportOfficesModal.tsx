import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from './Modal';
import { Upload, AlertTriangle, CheckCircle, FileSpreadsheet, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportOfficesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ImportOfficesModal: React.FC<ImportOfficesModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { profile } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, error: 0 });
    const [importLog, setImportLog] = useState<{ status: 'success' | 'error', msg: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = async (fileToParse: File) => {
        setLoading(true);
        const fileExt = fileToParse.name.split('.').pop()?.toLowerCase();

        try {
            if (fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'csv') {
                const data = await fileToParse.arrayBuffer();
                const workbook = XLSX.read(data);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Filter was removed to allow all types (Ofícios, Requerimentos, Moções, etc.)
                // as requested by the user. "confeccionados nesta página também"

                const dataToImport = jsonData;

                if (dataToImport.length === 0) {
                    alert("Nenhum dado encontrado no arquivo.");
                }

                setPreviewData(dataToImport);
                setStep('preview');
            } else {
                alert('Formato não suportado. Use Excel (.xlsx, .xls) ou CSV.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao ler arquivo.');
        } finally {
            setLoading(false);
        }
    };

    const processImport = async () => {
        if (!profile?.cabinet_id) return;

        setLoading(true);
        setStep('importing');
        setProgress({ current: 0, total: previewData.length, success: 0, error: 0 });
        setImportLog([]);

        let successCount = 0;
        let errorCount = 0;

        // Process in batches
        const BATCH_SIZE = 50;
        for (let i = 0; i < previewData.length; i += BATCH_SIZE) {
            const batch = previewData.slice(i, i + BATCH_SIZE);

            const toInsert = batch.map(row => ({
                cabinet_id: profile.cabinet_id,
                type: row.Tipo || row.tipo || 'Ofício', // Default to Ofício if missing
                number: (row.Número || row.numero || row.Numero || '').toString(),
                year: (row.Ano || row.ano || new Date().getFullYear()).toString(),
                recipient: row.Destinatário || row.destinatario || 'A quem possa interessar',
                subject: row.Assunto || row.assunto || 'Sem assunto',
                status: row.Situação === 'Arquivado' ? 'Respondido' : (row.Situação === 'Em Tramitação' ? 'Enviado' : 'Pendente'),
                document_url: ''
            }));

            const { error } = await supabase.from('offices').insert(toInsert);

            if (error) {
                console.error("Batch insert error:", error);
                errorCount += batch.length;
                setImportLog(prev => [...prev, { status: 'error', msg: `Erro lote ${i}: ${error.message}` }]);
            } else {
                successCount += batch.length;
            }

            setProgress({
                current: Math.min(i + BATCH_SIZE, previewData.length),
                total: previewData.length,
                success: successCount,
                error: errorCount
            });
        }

        setLoading(false);
        setStep('result');
        onSuccess();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importar Ofícios">
            <div className="space-y-6">
                {step === 'upload' && (
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                        />
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Clique para selecionar Excel ou CSV</p>
                        <p className="text-xs text-slate-400 mt-1">Colunas esperadas: Tipo (Ofício), Número, Ano, Assunto, Situação</p>
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                            <FileText className="text-blue-600" />
                            <div>
                                <p className="font-bold text-blue-900">{previewData.length} registros encontrados</p>
                                <p className="text-sm text-blue-700">Verifique os dados abaixo antes de confirmar.</p>
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto border rounded text-xs">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Tipo</th>
                                        <th className="px-3 py-2 text-left">Ano</th>
                                        <th className="px-3 py-2 text-left">Número</th>
                                        <th className="px-3 py-2 text-left">Assunto</th>
                                        <th className="px-3 py-2 text-left">Situação</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {previewData.slice(0, 10).map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-2">{row.Tipo || row.tipo}</td>
                                            <td className="px-3 py-2">{row.Ano || row.ano}</td>
                                            <td className="px-3 py-2">{row.Número || row.numero}</td>
                                            <td className="px-3 py-2 truncate max-w-xs">{row.Assunto || row.assunto}</td>
                                            <td className="px-3 py-2">{row.Situação || row.situacao}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setStep('upload')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Voltar</button>
                            <button onClick={processImport} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Importar Ofícios</button>
                        </div>
                    </div>
                )}

                {step === 'importing' && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="font-medium text-lg">Importando...</p>
                        <p className="text-gray-500">{progress.success} salvos de {progress.total}</p>
                    </div>
                )}

                {step === 'result' && (
                    <div className="text-center py-6 space-y-4">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <h3 className="text-xl font-bold text-gray-900">Sucesso!</h3>
                        <p>{progress.success} ofícios importados.</p>
                        <button onClick={onClose} className="w-full bg-blue-600 text-white py-2 rounded-lg">Fechar</button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ImportOfficesModal;
