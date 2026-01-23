import React, { useState, useEffect, useMemo } from 'react';
import OnlyOfficeEditor from '../components/OnlyOfficeEditor';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import Modal from '../components/Modal';
import ImportLegislativeModal from '../components/ImportLegislativeModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Interface matching Supabase 'legislative_matters' table + UI helpers
interface Project {
  id: number;
  cabinet_id: string;
  type: string; // Mapped to 'type_description'
  number: string;
  year: string;
  author: string; // Mapped to 'authors'
  summary: string; // Mapped to 'description'
  attachments: number; // Placeholder, or count from storage
  status: string;
  deadline?: string; // Optional, only if table has it (not in current schema, keeping internal)
  originalUrl?: string; // Mapped to 'pdf_url'
  created_at?: string;
}

const Projects: React.FC = () => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'Todas',
    type: 'Todos',
    year: 'Todos',
    search: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<{ id: string; name: string; ext: string } | null>(null);

  const handleEditDocument = (project: Project) => {
    if (!project.originalUrl) {
      alert("Nenhum documento anexado.");
      return;
    }

    try {
      const urlObj = new URL(project.originalUrl);
      const pathParts = urlObj.pathname.split('legislative-documents/');
      if (pathParts.length < 2) {
        alert("Não foi possível identificar o arquivo para edição.");
        return;
      }
      const fileId = decodeURIComponent(pathParts[1]);
      const ext = fileId.split('.').pop() || 'docx';

      setEditingFile({
        id: fileId,
        name: `${project.type} ${project.number}/${project.year}`,
        ext: ext
      });
      setIsEditorOpen(true);
    } catch (e) {
      console.error(e);
      alert("Erro ao abrir editor.");
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    type: 'Projeto de Lei',
    number: '',
    year: new Date().getFullYear().toString(),
    author: 'Wederson Lopes', // Default author
    summary: '',
    status: 'Em Tramitação',
    deadline: '',
    files: [] as File[],
    pdf_url: ''
  });

  // --- Data Fetching ---
  const fetchProjects = async () => {
    if (!profile?.cabinet_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('legislative_projects')
        .select('*')
        .eq('cabinet_id', profile.cabinet_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Transform DB data to UI Project interface
        const loadedProjects: Project[] = data.map((item: any) => ({
          id: item.id,
          cabinet_id: item.cabinet_id,
          type: item.type_description || item.type || 'Outros',
          number: item.number?.toString() || 'SN',
          year: item.year?.toString() || new Date().getFullYear().toString(),
          author: item.authors || 'Gabinete',
          summary: item.description || '',
          attachments: item.pdf_url ? 1 : 0,
          status: item.status || 'Em Tramitação',
          originalUrl: item.pdf_url,
          created_at: item.created_at,
          deadline: '' // Not in schema yet
        }));
        setProjects(loadedProjects);
      }
    } catch (error) {
      console.error('Erro ao carregar matérias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [profile]);

  // --- Filtering ---
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesStatus = filters.status === 'Todas' || project.status === filters.status;
      const matchesType = filters.type === 'Todos' || project.type === filters.type;
      const matchesYear = filters.year === 'Todos' || project.year === filters.year;
      const matchesSearch =
        (project.summary || '').toLowerCase().includes(filters.search.toLowerCase()) ||
        (project.number || '').toLowerCase().includes(filters.search.toLowerCase()) ||
        (project.type || '').toLowerCase().includes(filters.search.toLowerCase());

      return matchesStatus && matchesType && matchesYear && matchesSearch;
    });
  }, [projects, filters]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const currentProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Dynamic Filters Choices
  const availableTypes = Array.from(new Set(projects.map(p => p.type))).sort();
  const availableYears = Array.from(new Set(projects.map(p => p.year))).sort((a, b) => parseInt(b) - parseInt(a));

  // --- CRUD Operations ---

  const handleSaveProject = async () => {
    if (!formData.number || !formData.summary || !profile?.cabinet_id) return;

    let finalPdfUrl = formData.pdf_url;

    // Upload file if present
    if (formData.files.length > 0) {
      const file = formData.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.cabinet_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('legislative-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('legislative-documents')
          .getPublicUrl(fileName);

        finalPdfUrl = publicUrl;
      } catch (error) {
        console.error('Erro no upload:', error);
        alert('Erro ao fazer upload do arquivo. Tente novamente.');
        return;
      }
    }

    // Construct payload for legislative_projects table
    const payload = {
      cabinet_id: profile.cabinet_id,
      type_description: formData.type,
      type_acronym: formData.type.substring(0, 3).toUpperCase(),
      number: parseInt(formData.number) || 0,
      year: parseInt(formData.year) || new Date().getFullYear(),
      authors: formData.author,
      description: formData.summary,
      status: formData.status,
      pdf_url: finalPdfUrl
    };

    try {
      if (isEditing && selectedProject) {
        const { error } = await supabase
          .from('legislative_projects')
          .update(payload)
          .eq('id', selectedProject.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('legislative_projects')
          .insert([payload]);

        if (error) throw error;
      }

      await fetchProjects();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar matéria:', error);
      alert('Erro ao salvar matéria. Verifique o console.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedProject) {
      try {
        const { error } = await supabase
          .from('legislative_projects')
          .delete()
          .eq('id', selectedProject.id);

        if (error) throw error;

        await fetchProjects();
        setIsDeleteOpen(false);
        setSelectedProject(null);
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir matéria.');
      }
    }
  };

  // --- UI Handlers ---

  const openNewProject = () => {
    setIsEditing(false);
    setSelectedProject(null);
    setFormData({
      type: 'Projeto de Lei',
      number: '',
      year: new Date().getFullYear().toString(),
      author: profile?.name || 'Gabinete',
      summary: '',
      status: 'Em Tramitação',
      deadline: '',
      files: [],
      pdf_url: ''
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
      status: project.status,
      deadline: project.deadline || '',
      files: [],
      pdf_url: project.originalUrl || ''
    });
    setIsModalOpen(true);
  };

  const openDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  const handleDownload = (project: Project) => {
    if (project.originalUrl) {
      window.open(project.originalUrl, '_blank');
    } else {
      alert('Nenhum documento anexado ou link disponível.');
    }
  };

  // --- File Handlers (UI Only for now) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ ...prev, files: [...prev.files, ...Array.from(e.target.files || [])] }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Finalizado': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'Em Tramitação': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'Arquivado': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
          <button
            onClick={fetchProjects}
            className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <UploadCloud className="w-5 h-5" /> <span className="hidden sm:inline">Importar</span>
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
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Buscar</label>
            <div className="relative">
              <input
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg text-sm pl-10 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-700 dark:text-slate-200 outline-none"
                placeholder="Busque por ementa, número..."
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tipo</label>
            <select
              className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none py-2 px-3"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="Todos">Todos</option>
              {availableTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          {/* Add more filters if needed */}
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-4" />
            <p className="text-slate-500">Carregando...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhuma matéria encontrada</h3>
            <p className="text-slate-500 dark:text-slate-400">Tente ajustar seus filtros ou cadastrar um novo item.</p>
          </div>
        ) : (
          currentProjects.map((project) => (
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
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusStyles(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    <p><span className="font-medium text-slate-900 dark:text-slate-200">Autor:</span> {project.author}</p>
                    <p className="line-clamp-2"><span className="font-medium text-slate-900 dark:text-slate-200">Ementa:</span> {project.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* ONLYOFFICE EDIT BUTTON */}
                  {project.originalUrl && (
                    <button
                      onClick={() => handleEditDocument(project)}
                      className="p-2 text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                      title="Editar no OnlyOffice"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-bold hidden sm:inline">Editar</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDownload(project)}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Baixar ou Visualizar Link"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditProject(project)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openDeleteProject(project)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filteredProjects.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> até <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredProjects.length)}</span> de <span className="font-medium">{filteredProjects.length}</span> resultados
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Simple logic to show window of pages, can be improved for many pages
                let pNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pNum = currentPage - 2 + i;
                  if (pNum > totalPages) pNum = totalPages - (4 - i);
                }

                return (
                  <button
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pNum
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    {pNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Novo/Editar */}
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
              {isEditing ? "Salvar Alterações" : "Salvar"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option>Projeto de Lei</option>
                <option>Projeto de Decreto Legislativo</option>
                <option>Requerimento</option>
                <option>Moção</option>
                <option>Indicação</option>
                <option>Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número</label>
              <input
                type="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ano</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option>Em Tramitação</option>
                <option>Finalizado</option>
                <option>Arquivado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Autor(es)</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ementa / Descrição</label>
            <textarea
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          {/* Dummy File Upload for now */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Anexos</label>
            <div className="border border-dashed border-gray-300 p-4 rounded text-center text-sm text-gray-500">
              Upload de arquivos será habilitado em breve.
            </div>
          </div>
        </div>
      </Modal>

      {/* OnlyOffice Editor Modal (Full Screen) */}
      {isEditorOpen && editingFile && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-white shadow-md">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="font-bold">{editingFile.name}</span>
            </div>
            <button
              onClick={() => { setIsEditorOpen(false); setEditingFile(null); }}
              className="p-1 hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 bg-slate-100 relative">
            <OnlyOfficeEditor
              fileId={editingFile.id}
              fileName={editingFile.name}
              fileExt={editingFile.ext}
              onClose={() => { setIsEditorOpen(false); setEditingFile(null); }}
            />
          </div>
        </div>
      )}



      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Excluir Matéria"
        footer={
          <>
            <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={handleDeleteConfirm} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg">Excluir</button>
          </>
        }
      >
        <p className="text-slate-600 text-center">Tem certeza que deseja excluir esta matéria?</p>
      </Modal>


      {/* View Modal */}
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
              <button onClick={() => { setIsViewOpen(false); if (selectedProject) openEditProject(selectedProject); }} className="text-blue-600 hover:underline text-sm font-medium">Editar Matéria</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Import Modal */}
      <ImportLegislativeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          fetchProjects();
        }}
      />

    </div>
  );
};

export default Projects;