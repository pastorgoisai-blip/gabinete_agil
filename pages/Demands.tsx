import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  MessageSquare,
  Plus,
  Search,
  List,
  Columns,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import Modal from '../components/Modal';
import DemandForm from '../components/DemandForm';
import { useDemands } from '../hooks/useDemands';
import { Demand } from '../types';

const Demands: React.FC = () => {
  const { demands, loading, refresh, createDemand, updateDemand, updateDemandStatus, setDemands } = useDemands();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);

  // Filter demands
  const filteredDemands = demands.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.beneficiary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      return; // Reordering within same column not prioritized for DB yet, just visual
    }

    // Optimistic UI Update
    const updatedDemands = demands.map(d => {
      if (d.id.toString() === draggableId) {
        return { ...d, status: destination.droppableId as any };
      }
      return d;
    });
    setDemands(updatedDemands);

    // Call API
    const response = await updateDemandStatus(draggableId, destination.droppableId);
    if (!response.success) {
      // Revert on error (optional implementation detail, skipping complex revert for now)
      console.error('Failed to update status');
      refresh();
    }
  };

  const handleSaveDemand = async (data: Partial<Demand>) => {
    if (selectedDemand) {
      await updateDemand(selectedDemand.id, data);
    } else {
      await createDemand(data);
    }
    setIsFormOpen(false);
    setSelectedDemand(null);
  };

  const openNewDemand = () => {
    setSelectedDemand(null);
    setIsFormOpen(true);
  };

  const openEditDemand = (demand: Demand) => {
    setSelectedDemand(demand);
    setIsFormOpen(true);
  };

  // Kanban Column Component
  const KanbanColumn = ({ title, statusId, items, colorClass, shadowClass }: any) => {
    return (
      <div className="flex-1 min-w-[320px] bg-slate-50 dark:bg-slate-900/40 rounded-xl flex flex-col h-full border border-gray-200 dark:border-slate-800">
        <div className={`p-4 border-t-4 ${colorClass} bg-white dark:bg-slate-800 rounded-t-xl flex justify-between items-center border-b border-gray-100 dark:border-slate-700 shadow-sm`}>
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {statusId === 'Pendente' && <Clock className="w-4 h-4 text-yellow-500" />}
            {statusId === 'Em Andamento' && <Clock className="w-4 h-4 text-blue-500" />}
            {statusId === 'Concluída' && <CheckCircle className="w-4 h-4 text-green-500" />}
            {title}
          </h3>
          <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-xs font-bold">
            {items.length}
          </span>
        </div>

        <Droppable droppableId={statusId}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-slate-100 dark:bg-slate-800/50' : ''}`}
            >
              {items.map((item: Demand, index: number) => (
                <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onClick={() => openEditDemand(item)}
                      style={{ ...provided.draggableProps.style }}
                      className={`
                        bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 
                        shadow-sm hover:shadow-md transition-all cursor-grab group relative
                        ${snapshot.isDragging ? 'shadow-xl ring-2 ring-primary-500 rotate-2 z-50' : ''}
                        ${shadowClass}
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide border
                            ${item.priority === 'Alta' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' :
                            item.priority === 'Média' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30' :
                              'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'}`}>
                          {item.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {item.category}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-2 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {item.title}
                      </h4>

                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Assigned To Highlight */}
                      {item.assigned_to && (
                        <div className="mb-3 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5 break-all">
                          <Briefcase className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate text-ellipsis">Resp: <strong>{item.assigned_to}</strong></span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700 mt-2">
                        <div className="flex items-center gap-2" title={`Beneficiário: ${item.beneficiary}`}>
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                            {item.beneficiary ? item.beneficiary.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[80px]">
                            {item.beneficiary?.split(' ')[0] || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[10px]" title={`Registrado por: ${item.author}`}>
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[60px]">{item.author?.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              <button
                onClick={() => {
                  openNewDemand();
                  // Optionally pre-fill status if strictly adding to this column
                }}
                className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-xl shadow-lg shadow-primary-600/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Demandas</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Kanban Interativo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'}`}
            title="Visualização em Lista"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'}`}
            title="Visualização Kanban"
          >
            <Columns className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 mb-6 shrink-0">
        <div className="flex-1 relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white shadow-sm transition-all hover:border-gray-300 dark:hover:border-slate-600"
            placeholder="Filtrar por título, responsável, categoria..."
          />
        </div>
        <button
          onClick={openNewDemand}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-slate-900/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" /> Nova Demanda
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
            Carregando demandas...
          </div>
        ) : viewMode === 'kanban' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-6 overflow-x-auto pb-4 px-1">
              <KanbanColumn
                title="Pendente"
                statusId="Pendente"
                items={filteredDemands.filter(d => d.status === 'Pendente')}
                colorClass="border-yellow-400"
                shadowClass="shadow-yellow-500/5 hover:shadow-yellow-500/10"
              />
              <KanbanColumn
                title="Em Execução"
                statusId="Em Andamento"
                items={filteredDemands.filter(d => d.status === 'Em Andamento')}
                colorClass="border-blue-400"
                shadowClass="shadow-blue-500/5 hover:shadow-blue-500/10"
              />
              <KanbanColumn
                title="Concluído"
                statusId="Concluída"
                items={filteredDemands.filter(d => d.status === 'Concluída')}
                colorClass="border-green-400"
                shadowClass="shadow-green-500/5 hover:shadow-green-500/10"
              />
            </div>
          </DragDropContext>
        ) : (
          /* List View Implementation (Simplified for brevity, can be fully unified with Table logic if needed) */
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm h-full overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-bold">Título</th>
                  <th className="px-6 py-4 font-bold">Responsável</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Prioridade</th>
                  <th className="px-6 py-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredDemands.map(demand => (
                  <tr key={demand.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => openEditDemand(demand)}>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {demand.title}
                      <div className="text-xs text-slate-500 mt-0.5">{demand.category}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {demand.assigned_to ? (
                        <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded w-fit text-xs font-bold">
                          {demand.assigned_to}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                          ${demand.status === 'Concluída' ? 'bg-green-100 text-green-700' :
                          demand.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'}`}>
                        {demand.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {demand.priority}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary-600 font-bold hover:underline">Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedDemand ? 'Editar Demanda' : 'Nova Demanda'}
        footer={null} // Footer managed by form
      >
        <DemandForm
          initialData={selectedDemand}
          onSave={handleSaveDemand}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Demands;