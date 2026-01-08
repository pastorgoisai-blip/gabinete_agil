import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  File, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Hash, 
  Briefcase, 
  PenTool, 
  ShieldCheck, 
  Lock, 
  Loader2, 
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Tipo definido para garantir consistência
interface Document {
  id: number;
  type: string;
  number: string;
  date: string;
  subject: string;
  status: string;
  templateId?: string;
  signedBy?: string;
  signedAt?: string;
  hash?: string;
  originalUrl?: string; // Para documentos migrados
}

// Modelos pré-definidos
const documentTemplates = [
  { id: 't1', type: 'Ofício', name: 'Ofício Padrão de Solicitação', icon: Briefcase },
  { id: 't2', type: 'Moção', name: 'Moção de Aplauso', icon: FileText },
  { id: 't3', type: 'Moção', name: 'Moção de Pesar', icon: FileText },
  { id: 't4', type: 'Projeto de Lei', name: 'Estrutura Básica de PL', icon: File },
  { id: 't5', type: 'Requerimento', name: 'Requerimento de Informação', icon: FileText },
];

const initialDocuments: Document[] = [
  { id: 1, type: 'Moção', number: 'SN/2025', date: '2025-08-13', subject: 'Moção de Pesar à Família do Senhor Reverendo Wildo dos Anjos', status: 'Assinado', signedBy: 'Wederson Lopes', signedAt: '13/08/2025 14:30', hash: '8f7d9a8s7d98a7s' },
  { id: 2, type: 'Ofício', number: '164/2025', date: '2025-08-13', subject: 'Justificativa de ausência em Comissão de Constituição', status: 'Aguardando Assinatura' },
  { id: 3, type: 'Ofício', number: '163/2025', date: '2025-08-13', subject: 'Nomeação para cargo Comissionado', status: 'Rascunho' },
];

const Legislative: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para controle dos Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  // Estados de Assinatura
  const [signingStep, setSigningStep] = useState<'input' | 'processing' | 'success'>('input');
  const [signaturePass, setSignaturePass] = useState('');

  // Ref para input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para controle de Edição/Seleção
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Estado do formulário
  const [formData, setFormData] = useState({
    type: 'Moção',
    number: '',
    date: new Date().toISOString().split('T')[0],
    subject: '',
    status: 'Em Tramitação'
  });

  // --- Handlers ---

  const openTemplateModal = () => {
    setIsTemplateModalOpen(true);
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    // Auto-sugestão de número
    const lastDocOfSameType = documents
      .filter(d => d.type === template.type && !d.number.includes('SN'))
      .sort((a, b) => parseInt(b.number) - parseInt(a.number))[0];
    
    const nextNum = lastDocOfSameType ? parseInt(lastDocOfSameType.number.split('/')[0]) + 1 : 1;
    
    setFormData({
      type: template.type,
      number: `${nextNum}/${new Date().getFullYear()}`,
      date: new Date().toISOString().split('T')[0],
      subject: '',
      status: 'Rascunho'
    });
    
    setIsTemplateModalOpen(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (doc: Document) => {
    setIsEditing(true);
    setSelectedDoc(doc);
    setFormData({
      type: doc.type,
      number: doc.number,
      date: doc.date,
      subject: doc.subject,
      status: doc.status
    });
    setIsFormModalOpen(true);
  };

  const openViewModal = (doc: Document) => {
    setSelectedDoc(doc);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (doc: Document) => {
    setSelectedDoc(doc);
    setIsDeleteModalOpen(true);
  };

  const openSignModal = (doc: Document) => {
    setSelectedDoc(doc);
    setSigningStep('input');
    setSignaturePass('');
    setIsSignModalOpen(true);
  };

  // --- Import Logic ---
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // --- Export Logic ---
  const filteredDocs = documents.filter(doc => 
    doc.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportData = () => {
    const exportData = filteredDocs.map(d => ({
      "ID": d.id,
      "Tipo": d.type,
      "Número": d.number,
      "Data": d.date,
      "Assunto": d.subject,
      "Status": d.status,
      "Assinado Por": d.signedBy || '',
      "Data Assinatura": d.signedAt || '',
      "Link Original": d.originalUrl || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Documentos Filtrados");
    XLSX.writeFile(wb, `legislativo_export_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const processImportData = (data: any[]) => {
    return data.map((item: any) => {
      const id = item.ID || item.id || Date.now() + Math.random();
      const type = item['Tipo de Matéria Legislativa/Descrição'] || item.tipo__descricao || item.Tipo || 'Outros';
      const number = item['Número'] || item.numero || item.Numero || 'SN';
      const year = item['Ano'] || item.ano || new Date().getFullYear();
      const subject = item['Ementa'] || item.ementa || 'Sem assunto';
      const originalUrl = item['Texto Original'] || item.texto_original || '';

      return {
        id: typeof id === 'number' ? id : parseInt(id) || Date.now(),
        type,
        number: `${number}/${year}`,
        date: new Date().toISOString().split('T')[0],
        subject,
        status: 'Assinado', // Default for imported legacy docs
        originalUrl
      } as Document;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          if (data.results && Array.isArray(data.results)) {
            const newDocs = processImportData(data.results);
            setDocuments(prev => [...newDocs, ...prev]);
            alert(`${newDocs.length} documentos importados via JSON!`);
          } else {
             alert('Formato JSON inválido.');
          }
        } catch (error) {
          alert('Erro ao ler JSON.');
        }
      };
      reader.readAsText(file);
    } else if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const newDocs = processImportData(results.data);
            setDocuments(prev => [...newDocs, ...prev]);
            alert(`${newDocs.length} documentos importados via CSV!`);
          }
        },
        error: () => alert('Erro ao ler CSV.')
      });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
       const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        if (jsonData && jsonData.length > 0) {
          const newDocs = processImportData(jsonData);
          setDocuments(prev => [...newDocs, ...prev]);
          alert(`${newDocs.length} documentos importados via Excel!`);
        }
      };
      reader.readAsBinaryString(file);
    } else {
       alert('Formato não suportado.');
    }

    event.target.value = '';
  };

  // --- Ações CRUD e Fluxo ---

  const handleGenerateAndSave = () => {
    if (!formData.subject) {
      alert("Por favor, preencha o assunto do documento.");
      return;
    }

    const newId = Math.max(...documents.map(d => d.id), 0) + 1;
    const docToAdd: Document = {
      id: newId,
      ...formData,
      status: 'Rascunho'
    };

    if (isEditing && selectedDoc) {
      setDocuments(documents.map(doc => doc.id === selectedDoc.id ? { ...doc, ...formData } : doc));
    } else {
      setDocuments([docToAdd, ...documents]);
    }

    // Simula download
    const fileName = `${formData.type.replace(/\s+/g, '_')}_${formData.number.replace('/', '-')}.docx`;
    const dummyContent = `MODELO EDITÁVEL DE ${formData.type.toUpperCase()}...`;
    
    const blob = new Blob([dummyContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsFormModalOpen(false);
    setSelectedTemplate(null);
  };

  const handleManualSave = () => {
     if (isEditing && selectedDoc) {
      setDocuments(documents.map(doc => doc.id === selectedDoc.id ? { ...doc, ...formData } : doc));
    } else {
      const newId = Math.max(...documents.map(d => d.id), 0) + 1;
      setDocuments([{ id: newId, ...formData }, ...documents]);
    }
    setIsFormModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (selectedDoc) {
      setDocuments(documents.filter(d => d.id !== selectedDoc.id));
      setIsDeleteModalOpen(false);
      setSelectedDoc(null);
    }
  };

  const handleUploadFile = (doc: Document) => {
    // Simula o upload de um arquivo e mudança de status
    // No mundo real, abriria o file picker
    const confirmUpload = window.confirm("Simular upload do arquivo PDF editado?");
    if (confirmUpload) {
      setDocuments(documents.map(d => 
        d.id === doc.id ? { ...d, status: 'Aguardando Assinatura' } : d
      ));
    }
  };

  const processSignature = () => {
    if (!signaturePass) return;
    
    setSigningStep('processing');
    
    // Simula delay de criptografia/API
    setTimeout(() => {
      if (selectedDoc) {
        setDocuments(documents.map(d => 
          d.id === selectedDoc.id ? { 
            ...d, 
            status: 'Assinado',
            signedBy: 'Wederson Lopes', // Pegaria do usuário logado
            signedAt: new Date().toLocaleString(),
            hash: Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7)
          } : d
        ));
      }
      setSigningStep('success');
    }, 2000);
  };

  // --- Utilitários ---

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Assinado': 
      case 'Finalizado': 
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
      case 'Aguardando Assinatura': 
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case 'Arquivado': 
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      case 'Rascunho': 
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      default: 
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 text-white p-2 rounded-full flex items-center justify-center shadow-lg shadow-primary-600/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Espaço Legislativo</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Criação, assinatura digital e gestão de documentos.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Import Button */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.csv,.xlsx,.xls"
            className="hidden"
          />
          <button 
            onClick={handleImportClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <UploadCloud className="w-5 h-5" /> <span className="hidden sm:inline">Importar</span>
          </button>

          {/* Export Button */}
          <button 
            onClick={handleExportData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
            title="Exportar documentos filtrados (Excel)"
          >
            <FileSpreadsheet className="w-5 h-5" /> <span className="hidden sm:inline">Exportar</span>
          </button>

          <button 
            onClick={openTemplateModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Novo Documento
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</label>
            <select className="w-full bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 text-slate-700 dark:text-slate-200 px-3 py-2 outline-none">
              <option>Todos</option>
              <option>Assinado</option>
              <option>Aguardando Assinatura</option>
              <option>Rascunho</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ano</label>
            <select className="w-full bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 text-slate-700 dark:text-slate-200 px-3 py-2 outline-none">
              <option>Todos</option>
              <option>2025</option>
              <option>2024</option>
            </select>
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Buscar</label>
            <div className="relative">
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-lg text-sm pl-10 px-3 py-2 focus:ring-primary-500 focus:border-primary-500 text-slate-700 dark:text-slate-200 outline-none" 
                placeholder="Buscar por assunto ou número..." 
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Documentos */}
      <div className="space-y-4">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Nenhum documento encontrado.
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 hover:border-blue-300 dark:hover:border-blue-900 transition-colors group">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">{doc.type} - Nº {doc.number}</h3>
                    {doc.status === 'Rascunho' && (
                      <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-200 dark:border-yellow-800">
                        <Clock className="w-3 h-3" /> Em Edição
                      </span>
                    )}
                    {doc.status === 'Assinado' && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800" title={`Assinado por ${doc.signedBy}`}>
                        <ShieldCheck className="w-3 h-3" /> Assinado Digitalmente
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <p><span className="font-medium text-slate-900 dark:text-slate-200">Data:</span> {doc.date}</p>
                    <p><span className="font-medium text-slate-900 dark:text-slate-200">Assunto:</span> {doc.subject}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(doc.status)} self-start sm:self-end`}>
                    {doc.status}
                  </span>
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-700/50 p-1 rounded-lg border border-gray-100 dark:border-slate-600">
                    <button 
                      onClick={() => openViewModal(doc)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors" 
                      title="Visualizar"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button 
                      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors" 
                      title={doc.originalUrl ? "Baixar Original" : "Baixar PDF"}
                      onClick={() => doc.originalUrl ? window.open(doc.originalUrl, '_blank') : null}
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    
                    {doc.status === 'Rascunho' && (
                      <button 
                        onClick={() => handleUploadFile(doc)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors" 
                        title="Upload da Versão Final para Assinatura"
                      >
                        <Upload className="w-5 h-5" />
                      </button>
                    )}

                    {doc.status === 'Aguardando Assinatura' && (
                      <button 
                        onClick={() => openSignModal(doc)}
                        className="p-1.5 text-orange-500 hover:text-orange-600 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 rounded transition-colors" 
                        title="Assinar Digitalmente"
                      >
                        <PenTool className="w-5 h-5" />
                      </button>
                    )}

                    <div className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1"></div>
                    <button 
                      onClick={() => openEditModal(doc)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" 
                      title="Editar Dados"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(doc)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" 
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ... (Modals maintained same as previous version but with update handlers) ... */}
      
      {/* Modal de Seleção de Template */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Novo Documento: Escolha o Modelo"
        footer={
          <button 
            onClick={() => setIsTemplateModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {documentTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group text-center"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 flex items-center justify-center mb-3 transition-colors">
                <template.icon className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{template.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Modelo de {template.type}</p>
            </button>
          ))}
          <button
            onClick={() => handleSelectTemplate({ type: 'Outros', name: 'Documento em Branco' })}
            className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl hover:border-slate-400 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all text-center"
          >
            <Plus className="w-8 h-8 text-slate-400 mb-2" />
            <h4 className="font-medium text-slate-600 dark:text-slate-300 text-sm">Em Branco</h4>
          </button>
        </div>
      </Modal>

      {/* Modal de Formulário (Dados e Geração) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={isEditing ? "Editar Registro" : `Novo ${selectedTemplate?.type || 'Documento'}`}
        footer={
          <div className="flex justify-between w-full">
             <button 
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <div className="flex gap-2">
              <button 
                onClick={handleManualSave}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Apenas Salvar
              </button>
              <button 
                onClick={handleGenerateAndSave}
                className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isEditing ? "Salvar e Baixar" : "Criar e Abrir no Word"}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300 flex gap-3">
            <Briefcase className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold mb-1">Numeração Automática</p>
              <p>O sistema reservará o número <strong>{formData.number}</strong> para este documento. Ao clicar em "Criar e Abrir", o arquivo será baixado com este número.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option>Moção</option>
                <option>Ofício</option>
                <option>Projeto de Lei</option>
                <option>Requerimento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número</label>
              <input 
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
              <input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Inicial</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="Rascunho">Rascunho (Em Edição)</option>
                <option value="Aguardando Assinatura">Aguardando Assinatura</option>
                <option value="Assinado">Assinado / Finalizado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assunto / Ementa (Obrigatório)</label>
            <textarea 
              rows={4}
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              placeholder="Descreva o assunto para preencher o documento..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Modal de Assinatura Digital */}
      <Modal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        title="Assinatura Digital"
        footer={null}
      >
        <div className="flex flex-col items-center">
          {signingStep === 'input' && (
            <div className="w-full space-y-6">
              <div className="flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-full mb-3 shadow-sm">
                  <ShieldCheck className="w-10 h-10 text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">Autenticação Requerida</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Você está prestes a assinar o documento <strong>{selectedDoc?.type} {selectedDoc?.number}</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Senha ou PIN de Assinatura</label>
                <div className="relative">
                  <input 
                    type="password"
                    value={signaturePass}
                    onChange={(e) => setSignaturePass(e.target.value)}
                    className="w-full pl-10 px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Digite sua senha segura..."
                  />
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 text-right">Esqueceu o PIN?</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsSignModalOpen(false)}
                  className="flex-1 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={processSignature}
                  disabled={!signaturePass}
                  className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex justify-center items-center gap-2"
                >
                  <PenTool className="w-4 h-4" /> Assinar Documento
                </button>
              </div>
            </div>
          )}

          {signingStep === 'processing' && (
            <div className="py-10 flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
              <h4 className="font-bold text-slate-800 dark:text-white">Processando Assinatura...</h4>
              <p className="text-sm text-slate-500">Criptografando hash do documento.</p>
            </div>
          )}

          {signingStep === 'success' && (
            <div className="w-full py-4 flex flex-col items-center text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Assinado com Sucesso!</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">O documento foi validado e arquivado.</p>
              </div>
              <div className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono break-all text-slate-600 dark:text-slate-400">
                Hash: {selectedDoc?.hash || 'Calculando...'}
              </div>
              <button 
                onClick={() => setIsSignModalOpen(false)}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-sm transition-colors"
              >
                Concluir
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Visualização */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalhes do Documento"
        footer={
          <button 
            onClick={() => setIsViewModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        }
      >
        {selectedDoc && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700">
              <div>
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{selectedDoc.type}</span>
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Nº {selectedDoc.number}</h2>
              </div>
              <span className={`px-3 py-1 text-sm font-bold rounded-full border ${getStatusColor(selectedDoc.status)}`}>
                {selectedDoc.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
               <div className="flex items-start gap-3">
                 <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                 <div>
                   <p className="text-sm font-medium text-slate-900 dark:text-white">Data de Emissão</p>
                   <p className="text-sm text-slate-500 dark:text-slate-400">{selectedDoc.date}</p>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <Hash className="w-5 h-5 text-slate-400 mt-0.5" />
                 <div>
                   <p className="text-sm font-medium text-slate-900 dark:text-white">Código Interno</p>
                   <p className="text-sm text-slate-500 dark:text-slate-400">#{selectedDoc.id.toString().padStart(4, '0')}</p>
                 </div>
               </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
               <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Assunto / Ementa</h4>
               <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                 {selectedDoc.subject}
               </p>
            </div>

            {selectedDoc.originalUrl && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">Documento Original (Migrado)</h4>
                <a href={selectedDoc.originalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all">
                  {selectedDoc.originalUrl}
                </a>
              </div>
            )}

            {selectedDoc.status === 'Assinado' && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800 flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Documento Autenticado</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                    Assinado por: <strong>{selectedDoc.signedBy}</strong><br/>
                    Data: {selectedDoc.signedAt}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-600/70 dark:text-emerald-500 mt-1 break-all">Hash: {selectedDoc.hash}</p>
                </div>
              </div>
            )}

            {selectedDoc.status === 'Rascunho' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-bold text-sm">Documento Pendente</span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">Este documento foi gerado mas ainda não foi finalizado. Faça o upload do arquivo assinado ou edite.</p>
                <button 
                  onClick={() => { setIsViewModalOpen(false); handleUploadFile(selectedDoc); }}
                  className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload para Assinatura
                </button>
              </div>
            )}

            {selectedDoc.status === 'Aguardando Assinatura' && (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-400">
                  <PenTool className="w-5 h-5" />
                  <span className="font-bold text-sm">Pronto para Assinar</span>
                </div>
                <p className="text-xs text-orange-700 dark:text-orange-300">O arquivo final já foi carregado. Prossiga com a assinatura digital para finalizar.</p>
                <button 
                  onClick={() => { setIsViewModalOpen(false); openSignModal(selectedDoc); }}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2"
                >
                  <PenTool className="w-4 h-4" /> Assinar Agora
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
        footer={
          <>
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Sim, Excluir Documento
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center p-4">
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Tem certeza?</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-1">
            Você está prestes a excluir o documento:
          </p>
          <p className="font-medium text-slate-800 dark:text-white bg-gray-50 dark:bg-slate-700 px-3 py-1 rounded mb-4">
            {selectedDoc?.type} {selectedDoc?.number}
          </p>
          <p className="text-sm text-slate-500">
            Esta ação não poderá ser desfeita.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Legislative;