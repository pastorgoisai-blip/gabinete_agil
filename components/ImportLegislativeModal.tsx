import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from './Modal';
import { Upload, AlertTriangle, CheckCircle, FileSpreadsheet, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportLegislativeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ImportLegislativeModal: React.FC<ImportLegislativeModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
            if (fileExt === 'json') {
                const text = await fileToParse.text();
                const json = JSON.parse(text);
                if (json.results && Array.isArray(json.results)) {
                    setPreviewData(json.results);
                    setStep('preview');
                } else if (Array.isArray(json)) {
                    setPreviewData(json);
                    setStep('preview');
                } else {
                    alert("Formato JSON inválido. Esperado array ou objeto com chave 'results'.");
                }
            } else if (fileExt === 'xlsx' || fileExt === 'xls') {
                const data = await fileToParse.arrayBuffer();
                const workbook = XLSX.read(data);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                setPreviewData(jsonData);
                setStep('preview');
            } else {
                alert('Formato não suportado. Use JSON ou XLSX.');
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

        // Process in batches of 50
        const BATCH_SIZE = 50;
        for (let i = 0; i < previewData.length; i += BATCH_SIZE) {
            const batch = previewData.slice(i, i + BATCH_SIZE);

            const toInsert = batch.map(row => ({
                cabinet_id: profile.cabinet_id,
                external_id: row.id?.toString() || row.ID?.toString(),
                year: parseInt(row.ano || row.Ano || '0'),
                number: parseInt(row.numero || row.Numero || '0'),
                type_acronym: row.tipo__sigla || row.Sigla,
                type_description: row.tipo__descricao || row.Tipo,
                authors: row.autoria || row.Autoria,
                pdf_url: row.texto_original || row.Link,
                description: row.ementa || row.Ementa || row.Descricao,
                status: 'filed'
            }));

            const { error } = await supabase.from('legislative_matters').insert(toInsert);

            if (error) {
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
        <Modal isOpen={isOpen} onClose={onClose} title="Importar Matérias Legislativas">
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
                            accept=".json,.xlsx,.xls"
                            onChange={handleFileChange}
                        />
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Clique para selecionar JSON ou Excel</p>
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                            <FileText className="text-blue-600" />
                            <div>
                                <p className="font-bold text-blue-900">{previewData.length} registros encontrados</p>
                                <p className="text-sm text-blue-700">Confira se os dados parecem corretos antes de importar.</p>
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto border rounded text-xs">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Ano</th>
                                        <th className="px-3 py-2 text-left">Número</th>
                                        <th className="px-3 py-2 text-left">Tipo</th>
                                        <th className="px-3 py-2 text-left">Ementa</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {previewData.slice(0, 10).map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-2">{row.ano || row.Ano}</td>
                                            <td className="px-3 py-2">{row.numero || row.Numero}</td>
                                            <td className="px-3 py-2">{row.tipo__sigla || row.Sigla}</td>
                                            <td className="px-3 py-2 truncate max-w-xs">{row.ementa || row.Ementa}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setStep('upload')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Voltar</button>
                            <button onClick={processImport} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirmar Importação</button>
                        </div>
                    </div>
                )}

                {step === 'importing' && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="font-medium text-lg">Processando...</p>
                        <p className="text-gray-500">{progress.success} processados de {progress.total}</p>
                    </div>
                )}

                {step === 'result' && (
                    <div className="text-center py-6 space-y-4">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <h3 className="text-xl font-bold text-gray-900">Importação Concluída!</h3>
                        <p>{progress.success} itens importados com sucesso.</p>
                        {progress.error > 0 && <p className="text-red-500">{progress.error} erros encontrados.</p>}
                        <button onClick={onClose} className="w-full bg-blue-600 text-white py-2 rounded-lg">Fechar</button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ImportLegislativeModal;
