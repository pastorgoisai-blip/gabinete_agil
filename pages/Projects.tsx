import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  File,
  AlertTriangle,
  Clock
} from 'lucide-react';
import Modal from '../components/Modal';
import { useProjects } from '../hooks/useProjects';
import ProjectForm from '../components/ProjectForm';
import { Project } from '../types';

const Projects: React.FC = () => {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects();

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

  // State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
    if (!deadline || status === 'Finalizado' || status === 'Arquivado') return null;

    // Normalize dates to handle timezones
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setDate(deadlineDate.getDate() + 1); // fix off-by-one from string parse if needed or use date lib

    // Simple diff
    const diffTime = new Date(deadline).getTime() - new Date().getTime();
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

  // CRUD Actions
  const openNewProject = () => {
    setIsEditing(false);
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const openEditProject = (project: Project) => {
    setIsEditing(true);
    setSelectedProject(project);
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

  const handleSave = async (data: Partial<Project>) => {
    if (isEditing && selectedProject) {
      await updateProject(selectedProject.id, data);
    } else {
      await createProject({
        type: data.type!,
        number: data.number!,
        year: data.year!,
        author: data.author!,
        summary: data.summary!,
        status: data.status as any,
        deadline: data.deadline,
        document_url: data.document_url
      });
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProject) {
      await deleteProject(selectedProject.id);
      setIsDeleteOpen(false);
      setSelectedProject(null);
    }
  };

  const handleDownload = (project: Project) => {
    if (project.document_url) {
      window.open(project.document_url, '_blank');
    } else {
      alert("Nenhum documento anexado a este projeto.");
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Finalizado':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'Em Tramitação':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'Arquivado':
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading && projects.length === 0) {
    return <div className="p-8 text-center text-slate-500">Carregando projetos...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 text-white p-2 rounded-xl shadow-lg shadow-primary-600/30">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Projetos Legislativos</h1>
        </div>
        <button
          onClick={openNewProject}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Projeto
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Situação</label>
            <select
              className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-700 dark:text-slate-200 outline-none py-2 px-3"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option>Todas</option>
              <option>Finalizado</option>
              <option>Em Tramitação</option>
              <option>Arquivado</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tipo</label>
            <select
              className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-700 dark:text-slate-200 outline-none py-2 px-3"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option>Todos</option>
              <option>Projeto de Decreto Legislativo</option>
              <option>Projeto de Lei</option>
              <option>Requerimento</option>
              <option>Moção</option>
              <option>Ofício</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ano</label>
            <select
              className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-700 dark:text-slate-200 outline-none py-2 px-3"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            >
              <option>Todos</option>
              <option>{new Date().getFullYear()}</option>
              <option>{new Date().getFullYear() - 1}</option>
              <option>{new Date().getFullYear() - 2}</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Buscar</label>
            <div className="relative">
              <input
                className="w-full bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg text-sm pl-10 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-700 dark:text-slate-200 outline-none"
                placeholder="Buscar projeto..."
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* List Header */}
      <div className="flex justify-between items-end">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Lista de Projetos</h2>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
            <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhum projeto encontrado</h3>
            <p className="text-slate-500 dark:text-slate-400">Tente ajustar seus filtros de busca.</p>
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
                        <FileText className="w-3 h-3" /> {project.document_url ? 'Documento Anexado' : 'Sem anexos'}
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
                        disabled={!project.document_url}
                        className={`p-1.5 transition-colors flex items-center gap-1 text-xs font-medium ${!project.document_url ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-green-600 dark:hover:text-green-400'}`}
                        title={project.document_url ? "Baixar / Visualizar URL" : "Sem URL"}
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Final</span>
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

      {/* Modal - via Component */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Projeto" : "Novo Projeto Legislativo"}
      >
        <ProjectForm
          initialData={selectedProject}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Excluir Projeto"
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
            Você está prestes a excluir o projeto:
          </p>
          <p className="font-medium text-slate-800 dark:text-white bg-gray-50 dark:bg-slate-700 px-3 py-1 rounded mb-4">
            {selectedProject?.type} Nº {selectedProject?.number}/{selectedProject?.year}
          </p>
          <p className="text-sm text-slate-500">
            Esta ação removerá o projeto permanentemente.
          </p>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Detalhes do Projeto"
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

            {selectedProject.document_url && (
              <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Documento</h4>
                <a href={selectedProject.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                  {selectedProject.document_url}
                </a>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
              <button onClick={() => { setIsViewOpen(false); openEditProject(selectedProject); }} className="text-blue-600 hover:underline text-sm font-medium">Editar Projeto</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Projects;