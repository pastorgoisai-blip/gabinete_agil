
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from './Modal';
import { Upload, AlertTriangle, CheckCircle, FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportVotersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportVotersModal({ isOpen, onClose, onSuccess }: ImportVotersModalProps) {
    const { profile } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ total: 0, current: 0, errors: 0 });
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
    const [importLog, setImportLog] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        const reader = new FileReader();

        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setPreviewData(results.data.slice(0, 5)); // Preview first 5
                    setStep('preview');
                },
            });
        } else {
            reader.onload = (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet);
                setPreviewData(json.slice(0, 5));
                setStep('preview');
            };
            reader.readAsBinaryString(file);
        }
    };

    const processImport = async () => {
        if (!file) {
            alert('Por favor, selecione um arquivo.');
            return;
        }
        if (!profile?.cabinet_id) {
            alert('Erro: Perfil de usuário sem Gabinete vinculado. Recarregue a página.');
            return;
        }

        setLoading(true);
        setStep('importing');
        setImportLog([]);
        setProgress({ total: 0, current: 0, errors: 0 });

        const reader = new FileReader();
        const processRow = async (row: any) => {
            // Mapeamento simples baseado nos headers da planilha do usuário
            // Tenta encontrar colunas compatíveis
            const name = row['Nome'] || row['nome'] || row['Name'];
            const cpf = row['CPF'] || row['cpf'];
            const phone = row['Telefone'] || row['phone'] || row['Celular'];
            const address = row['Endereço'] || row['Endereco'] || row['address'];
            const neighborhood = row['Bairro'] || row['bairro'];
            const email = row['Email'] || row['email'];
            const birth_dateRaw = row['Data de Nascimento'] || row['nascimento'];
            const indicated_by = row['Usuário'] || row['User'] || row['indicated_by'];
            const category = row['Categoria'] || 'Indeciso';

            if (!name) return { status: 'skipped', msg: 'Sem nome' };

            // Sanitização básica
            let birth_date = null;
            if (birth_dateRaw) {
                // Tentar converter data excel ou string
                // TODO: Melhorar parse de data
            }

            const { error } = await supabase.from('voters').insert({
                cabinet_id: profile.cabinet_id,
                name,
                cpf: String(cpf || '').replace(/\D/g, ''),
                phone: String(phone || ''),
                address: address || '',
                neighborhood: neighborhood || '',
                email: email || '',
                indicated_by: indicated_by || '',
                category,
                source: 'Importação',
                status: 'active'
            });

            if (error) return { status: 'error', msg: error.message };
            return { status: 'success' };
        };

        const runBatch = async (rows: any[]) => {
            let successCount = 0;
            let errorCount = 0;
            const total = rows.length;

            // Processar em lotes pequenos ou um a um para ter feedback
            // Para demo, vamos um a um
            for (let i = 0; i < total; i++) {
                const result = await processRow(rows[i]);
                if (result.status === 'success') successCount++;
                if (result.status === 'error') {
                    errorCount++;
                    setImportLog(prev => [...prev, `Erro na linha ${i + 2}: ${result.msg}`]);
                }
                setProgress({ total, current: i + 1, errors: errorCount });
            }

            setStep('result');
            setLoading(false);
            onSuccess();
        };


        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => runBatch(results.data),
            });
        } else {
            reader.onload = (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet);
                runBatch(json);
            };
            reader.readAsBinaryString(file);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importar Eleitores" footer={null}>
            <div className="p-4">

                {step === 'upload' && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600 font-medium">Clique para selecionar ou arraste um arquivo</p>
                        <p className="text-xs text-gray-500 mt-1">Suporta .xlsx ou .csv</p>
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-4">
                        <h4 className="font-bold text-sm text-gray-700">Pré-visualização (5 primeiros registros)</h4>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-xs">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {previewData.length > 0 && Object.keys(previewData[0]).slice(0, 5).map(key => (
                                            <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {previewData.map((row, idx) => (
                                        <tr key={idx}>
                                            {Object.values(row).slice(0, 5).map((val: any, i) => (
                                                <td key={i} className="px-3 py-2 whitespace-nowrap text-gray-700">{String(val)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setStep('upload')} className="px-4 py-2 text-gray-600 text-sm">Cancelar</button>
                            <button
                                onClick={processImport}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-green-700 flex items-center gap-2"
                            >
                                {loading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                Confirmar Importação
                            </button>
                        </div>
                    </div>
                )}

                {step === 'importing' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <h3 className="text-lg font-bold text-gray-900">Importando...</h3>
                        <p className="text-gray-500 mb-4">{progress.current} de {progress.total} processados</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                        </div>
                        {progress.errors > 0 && <p className="text-red-500 text-sm">{progress.errors} erros encontrados</p>}
                    </div>
                )}

                {step === 'result' && (
                    <div className="text-center py-6">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Importação Concluída!</h3>
                        <p className="text-gray-600 mb-6">
                            Processamos {progress.total} registros. <br />
                            <span className="text-green-600 font-bold">{progress.total - progress.errors} sucessos</span> e
                            <span className="text-red-600 font-bold ml-1">{progress.errors} erros</span>.
                        </p>

                        {importLog.length > 0 && (
                            <div className="text-left bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto mb-6 text-xs font-mono text-red-600 border border-gray-200">
                                {importLog.map((log, i) => <div key={i}>{log}</div>)}
                            </div>
                        )}

                        <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                            Fechar
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
