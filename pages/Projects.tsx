import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Filter,
  File,
  AlertTriangle,
  Clock,
  Calendar,
  Upload,
  X,
  Paperclip,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface Project {
  id: number;
  type: string;
  number: string;
  year: string;
  author: string;
  summary: string;
  attachments: number;
  status: 'Finalizado' | 'Em Tramitação' | 'Arquivado' | 'Importado';
  deadline?: string; // Data limite para tramitação
  originalUrl?: string; // Link para o PDF original do sistema antigo
}

// Helper para datas dinâmicas no mock
const today = new Date();
const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 5);
const pastDate = new Date(); pastDate.setDate(today.getDate() - 15);

const initialProjects: Project[] = [
  {
    id: 1,
    type: 'Projeto de Decreto Legislativo',
    number: 'SN',
    year: '2024',
    author: 'Wederson Lopes',
    summary: 'Cidadão Benemérito Sebastião',
    attachments: 1,
    status: 'Finalizado'
  },
  {
    id: 2,
    type: 'Projeto de Decreto Legislativo',
    number: '695',
    year: '2015',
    author: 'Wederson Lopes',
    summary: 'Título de Cidadania ao Pastor Francisco Jacob de Oliveira Filho',
    attachments: 1,
    status: 'Finalizado'
  },
  {
    id: 3,
    type: 'Projeto de Decreto Legislativo',
    number: '963',
    year: '2025',
    author: 'Wederson Lopes',
    summary: 'Título de Cidadania ao senhor Márcio Cândido da Silva',
    attachments: 0,
    status: 'Em Tramitação',
    deadline: nextWeek.toISOString().split('T')[0] // Vence em breve
  },
  {
    id: 4,
    type: 'Projeto de Decreto Legislativo',
    number: '57',
    year: '2024',
    author: 'Wederson Lopes',
    summary: 'Cidadão Benemérito Sebastião Donizete Ferreira',
    attachments: 1,
    status: 'Finalizado'
  },
  {
    id: 5,
    type: 'Projeto de Lei',
    number: '721',
    year: '2016',
    author: 'Wederson Lopes',
    summary: 'Dispõe sobre a obrigatoriedade de instalação de brinquedos adaptados',
    attachments: 1,
    status: 'Em Tramitação',
    deadline: pastDate.toISOString().split('T')[0] // Atrasado
  }
];

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [filters, setFilters] = useState({
    status: 'Todas',
    type: 'Todos',
    year: 'Todos',
    search: ''
  });
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    type: 'Projeto de Lei',
    number: '',
    year: new Date().getFullYear().toString(),
    author: 'Wederson Lopes',
    summary: '',
    status: 'Em Tramitação' as const,
    deadline: '',
    files: [] as File[]
  });

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesStatus = filters.status === 'Todas' || project.status === filters.status;
      const matchesType = filters.type === 'Todos' || project.type === filters.type;
      const matchesYear = filters.year === 'Todos' || project.year === filters.year;
      const matchesSearch = 
        project.summary.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.number.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.type.toLowerCase().includes(filters.search.toLowerCase());

      return matchesStatus && matchesType && matchesYear && matchesSearch;
    });
  }, [projects, filters]);

  const getDeadlineAlert = (deadline?: string, status?: string) => {
    if (!deadline || status === 'Finalizado' || status === 'Arquivado' || status === 'Importado') return null;
    
    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        type: 'overdue', 
        label: `Atrasado ${Math.abs(diffDays)} dias`, 
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' 
      };
    }
    if (diffDays <= 7) {
      return { 
        type: 'urgent', 
        label: `Vence em ${diffDays} dias`, 
        className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' 
      };
    }
    return null;
  };

  const openNewProject = () => {
    setIsEditing(false);
    setSelectedProject(null);
    setFormData({
       type: 'Projeto de Lei',
       number: '',
       year: new Date().getFullYear().toString(),
       author: 'Wederson Lopes',
       summary: '',
       status: 'Em Tramitação',
       deadline: '',
       files: []
    });
    setIsModalOpen(true);
  };

  const openEditProject = (project: Project) => {
    setIsEditing(true);
    setSelectedProject(project);
    setFormData({
       type: project.type,
       number: project.number,
       year: project.year,
       author: project.author,
       summary: project.summary,
       status: project.status as any,
       deadline: project.deadline || '',
       files: [] // In a real app, this would load existing files
    });
    setIsModalOpen(true);
  };

  const openDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  const openViewProject = (project: Project) => {
    setSelectedProject(project);
    setIsViewOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));
    }
  };

  // --- Lógica de Importação (JSON, CSV, XLSX) ---
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // --- Lógica de Exportação (XLSX) ---
  const handleExportData = () => {
    const exportData = filteredProjects.map(p => ({
      "ID": p.id,
      "Tipo": p.type,
      "Número": p.number,
      "Ano": p.year,
      "Autor": p.author,
      "Ementa": p.summary,
      "Status": p.status,
      "Anexos": p.attachments,
      "Link Original": p.originalUrl || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projetos Filtrados");
    XLSX.writeFile(wb, `projetos_export_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Processa dados brutos e normaliza para o formato do sistema
  const processImportData = (data: any[]) => {
    return data.map((item: any) => {
      // Tenta encontrar campos pelo nome do CSV/JSON ou variações comuns
      const id = item.ID || item.id || Date.now() + Math.random();
      const type = item['Tipo de Matéria Legislativa/Descrição'] || item.tipo__descricao || item.Tipo || 'Outros';
      const number = item['Número'] || item.numero || item.Numero || 'SN';
      const year = item['Ano'] || item.ano || new Date().getFullYear().toString();
      const author = item['Autorias'] || item.autoria || item.Autor || 'Desconhecido';
      const summary = item['Ementa'] || item.ementa || 'Sem descrição';
      const originalUrl = item['Texto Original'] || item.texto_original || '';

      return {
        id: typeof id === 'number' ? id : parseInt(id) || Date.now(),
        type,
        number: String(number),
        year: String(year),
        author,
        summary,
        attachments: originalUrl ? 1 : 0,
        status: 'Importado',
        originalUrl
      } as Project;
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
            const newProjects = processImportData(data.results);
            setProjects(prev => [...newProjects, ...prev]);
            alert(`${newProjects.length} projetos importados via JSON!`);
          } else {
            alert('JSON inválido. Esperado formato { results: [...] }');
          }
        } catch (err) {
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
            const newProjects = processImportData(results.data);
            setProjects(prev => [...newProjects, ...prev]);
            alert(`${newProjects.length} projetos importados via CSV!`);
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
          const newProjects = processImportData(jsonData);
          setProjects(prev => [...newProjects, ...prev]);
          alert(`${newProjects.length} projetos importados via Excel!`);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Formato não suportado. Use JSON, CSV ou XLSX.');
    }
    
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProject = () => {
    if (!formData.number || !formData.summary) return;

    const baseAttachments = (isEditing && selectedProject) ? selectedProject.attachments : 0;
    const totalAttachments = baseAttachments + formData.files.length;

    const projectData = {
        type: formData.type,
        number: formData.number,
        year: formData.year,
        author: formData.author,
        summary: formData.summary,
        status: formData.status,
        deadline: formData.deadline,
        attachments: totalAttachments
    };

    if (isEditing && selectedProject) {
      const updatedProjects = projects.map(p => 
        p.id === selectedProject.id 
          ? { ...p, ...projectData } 
          : p
      );
      setProjects(updatedProjects);
    } else {
      const projectToAdd: Project = {
        id: projects.length + 1,
        ...projectData,
      };
      setProjects([projectToAdd, ...projects]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (selectedProject) {
      setProjects(projects.filter(p => p.id !== selectedProject.id));
      setIsDeleteOpen(false);
      setSelectedProject(null);
    }
  };

  const handleDownload = (project: Project) => {
    if (project.originalUrl) {
      window.open(project.originalUrl, '_blank');
      return;
    }
    // Lógica dummy de download
    alert(`Baixando documento ${project.number}/${project.year}...`);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Finalizado':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'Em Tramitação':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'Arquivado':
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      case 'Importado':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 text-white p-2 rounded-xl shadow-lg shadow-primary-600/30">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Matérias Legislativas</h1>
        </div>
        
        <div className="flex gap-2">
          {/* Botão de Importação */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.csv,.xlsx,.xls"
            className="hidden"
          />
          <button 
            onClick={handleImportClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            title="Importar dados (JSON, CSV, Excel)"
          >
            <UploadCloud className="w-5 h-5" />
            <span className="hidden sm:inline">Importar</span>
          </button>

          {/* Botão de Exportação */}
          <button 
            onClick={handleExportData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            title="Exportar dados filtrados (Excel)"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button 
            onClick={openNewProject}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nova Matéria
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Situação</label>
            <select 
              className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-700 dark:text-slate-200 outline-none py-2 px-3"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option>Todas</option>
              <option>Finalizado</option>
              <option>Em Tramitação</option>
              <option>Arquivado</option>
              <option>Importado</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tipo</label>
            <select 
              className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-700 dark:text-slate-200 outline-none py-2 px-3"
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              <option>Todos</option>
              <option>Projeto de Decreto Legislativo</option>
              <option>Projeto de Lei</option>
              <option>Requerimento</option>
              <option>Indicação</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ano</label>
            <select 
              className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-700 dark:text-slate-200 outline-none py-2 px-3"
              value={filters.year}
              onChange={(e) => setFilters({...filters, year: e.target.value})}
            >
              <option>Todos</option>
              <option>2025</option>
              <option>2024</option>
              <option>2023</option>
              <option>2016</option>
              <option>2015</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Buscar</label>
            <div className="relative">
              <input 
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg text-sm pl-10 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-700 dark:text-slate-200 outline-none" 
                placeholder="Buscar matéria..." 
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* List Header */}
      <div className="flex justify-between items-end">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Lista de Matérias</h2>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline">
          Mostrar mais antigos
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
            <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhum projeto encontrado</h3>
            <p className="text-slate-500 dark:text-slate-400">Tente ajustar seus filtros de busca ou importar dados.</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const alert = getDeadlineAlert(project.deadline, project.status);
            return (
              <div 
                key={project.id} 
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-slate-800 dark:text-white text-base">
                        {project.type} - Nº {project.number}/{project.year}
                      </h3>
                      {alert && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${alert.className}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {alert.label}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      <p><span className="font-medium text-slate-900 dark:text-slate-200">Autor:</span> {project.author}</p>
                      <p><span className="font-medium text-slate-900 dark:text-slate-200">Ementa:</span> {project.summary}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Anexos: {project.attachments > 0 ? `${project.attachments} arquivo(s)` : 'Nenhum'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusStyles(project.status)}`}>
                      {project.status}
                    </span>
                    
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                      <button 
                        onClick={() => handleDownload(project)}
                        className="p-1.5 text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1 text-xs font-medium" 
                        title={project.originalUrl ? "Baixar Original" : "Baixar Final"}
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                      <button 
                        onClick={() => openViewProject(project)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" 
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEditProject(project)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openDeleteProject(project)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" 
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* ... (Restante dos modais mantidos, apenas o file input e handler foram alterados no topo) */}
      
      {/* Modal Novo/Editar Projeto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Matéria" : "Nova Matéria Legislativa"}
        footer={
          <>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveProject}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
            >
              {isEditing ? "Salvar Alterações" : "Salvar Matéria"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
           {/* Form content remains the same */}
           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option>Projeto de Lei</option>
                <option>Projeto de Decreto Legislativo</option>
                <option>Requerimento</option>
                <option>Moção</option>
                <option>Indicação</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número</label>
              <input 
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                placeholder="Ex: 123"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ano</label>
              <input 
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="Em Tramitação">Em Tramitação</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Arquivado">Arquivado</option>
                <option value="Importado">Importado</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Autor</label>
              <input 
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prazo / Vencimento</label>
              <div className="relative">
                <input 
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ementa / Resumo</label>
            <textarea 
              rows={4}
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              placeholder="Descreva o resumo da matéria..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Anexos (PDF, DOC)</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors relative group">
              <input 
                type="file" 
                multiple 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept=".pdf,.doc,.docx"
              />
              <div className="flex flex-col items-center gap-1 pointer-events-none">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary-500 transition-colors" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Clique ou arraste arquivos aqui</p>
              </div>
            </div>
            
            {formData.files.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{file.name}</span>
                    </div>
                    <button 
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-500 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Modal - Kept same */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Excluir Matéria"
        footer={
          <>
            <button 
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Sim, Excluir
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
            Você está prestes a excluir a matéria:
          </p>
          <p className="font-medium text-slate-800 dark:text-white bg-gray-50 dark:bg-slate-700 px-3 py-1 rounded mb-4">
            {selectedProject?.type} Nº {selectedProject?.number}/{selectedProject?.year}
          </p>
          <p className="text-sm text-slate-500">
            Esta ação removerá a matéria permanentemente.
          </p>
        </div>
      </Modal>

      {/* View Modal - Kept same */}
       <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Detalhes da Matéria"
        footer={
          <button 
            onClick={() => setIsViewOpen(false)}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        }
      >
        {selectedProject && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700">
               <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{selectedProject.type}</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Nº {selectedProject.number}/{selectedProject.year}</h2>
               </div>
               <span className={`px-3 py-1 text-sm font-bold rounded-full border ${getStatusStyles(selectedProject.status)}`}>
                 {selectedProject.status}
               </span>
            </div>
            
            {selectedProject.deadline && selectedProject.status === 'Em Tramitação' && (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800 flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Prazo de Tramitação</p>
                  <p className="text-xs text-orange-700 dark:text-orange-400">Data limite: {selectedProject.deadline.split('-').reverse().join('/')}</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Autor</h4>
                <p className="text-slate-700 dark:text-slate-200">{selectedProject.author}</p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
               <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Ementa</h4>
               <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                 {selectedProject.summary}
               </p>
            </div>

            {selectedProject.originalUrl && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">Documento Original (Migrado)</h4>
                <a href={selectedProject.originalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all">
                  {selectedProject.originalUrl}
                </a>
              </div>
            )}
            
             <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button onClick={() => { setIsViewOpen(false); openEditProject(selectedProject); }} className="text-blue-600 hover:underline text-sm font-medium">Editar Matéria</button>
             </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Projects;