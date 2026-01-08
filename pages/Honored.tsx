import React, { useState } from 'react';
import { Award, Plus, FileSpreadsheet, Search, Clock, MapPin, Edit, Trash2, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';

interface Honoree {
  id: number;
  name: string;
  type: string;
  ceremonyDate: string;
  status: string;
  socialName?: string;
  justification?: string;
  bio?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  phone?: string;
  email?: string;
}

const initialHonorees: Honoree[] = [
  { id: 1, name: 'Dr. Roberto Campos', type: 'Titulo de Cidadão Anapolino', ceremonyDate: '2025-10-10', status: 'Indicado', location: 'Câmara Municipal', startTime: '19:00', endTime: '21:00' },
  { id: 2, name: 'Sra. Maria da Silva', type: 'Moção de Aplauso', ceremonyDate: '2025-09-15', status: 'Entregue', location: 'Teatro Municipal', startTime: '20:00', endTime: '22:00' },
  { id: 3, name: 'Pastor João Souza', type: 'Comenda', ceremonyDate: '2025-11-20', status: 'Confirmado', location: 'Igreja Central', startTime: '19:30', endTime: '21:30' }
];

const Honored: React.FC = () => {
  const [honorees, setHonorees] = useState<Honoree[]>(initialHonorees);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // State
  const [selectedHonoree, setSelectedHonoree] = useState<Honoree | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    socialName: '',
    type: 'Titulo de Cidadão Anapolino',
    justification: '',
    bio: '',
    date: '',
    location: '',
    startTime: '',
    endTime: '',
    status: 'Indicado',
    phone: '',
    email: ''
  });

  const openNewHonoree = () => {
    setIsEditing(false);
    setSelectedHonoree(null);
    setFormData({
      name: '', socialName: '', type: 'Titulo de Cidadão Anapolino', justification: '', bio: '', date: '', location: '', startTime: '', endTime: '', status: 'Indicado', phone: '', email: ''
    });
    setIsModalOpen(true);
  };

  const openEditHonoree = (honoree: Honoree) => {
    setIsEditing(true);
    setSelectedHonoree(honoree);
    setFormData({
      name: honoree.name,
      socialName: honoree.socialName || '',
      type: honoree.type,
      justification: honoree.justification || '',
      bio: honoree.bio || '',
      date: honoree.ceremonyDate,
      location: honoree.location || '',
      startTime: honoree.startTime || '',
      endTime: honoree.endTime || '',
      status: honoree.status,
      phone: honoree.phone || '',
      email: honoree.email || ''
    });
    setIsModalOpen(true);
  };

  const openDeleteHonoree = (honoree: Honoree) => {
    setSelectedHonoree(honoree);
    setIsDeleteOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    
    if (isEditing && selectedHonoree) {
      const updatedHonorees = honorees.map(h => 
        h.id === selectedHonoree.id 
          ? { ...h, ...formData, ceremonyDate: formData.date || 'Data a definir' } 
          : h
      );
      setHonorees(updatedHonorees);
    } else {
      const honoree: Honoree = {
        id: honorees.length > 0 ? Math.max(...honorees.map(h => h.id)) + 1 : 1,
        name: formData.name,
        type: formData.type,
        ceremonyDate: formData.date || 'Data a definir',
        status: formData.status,
        ...formData
      };
      setHonorees([...honorees, honoree]);
    }
    
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (selectedHonoree) {
      setHonorees(honorees.filter(h => h.id !== selectedHonoree.id));
      setIsDeleteOpen(false);
      setSelectedHonoree(null);
    }
  };

  const handleExport = () => {
    const headers = "ID,Nome,Tipo,Data,Status,Local\n";
    const csvData = honorees.map(h => 
      `${h.id},"${h.name}","${h.type}","${h.ceremonyDate}","${h.status}","${h.location || ''}"`
    ).join("\n");

    const blob = new Blob([headers + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `homenageados_export_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-primary-600/30">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Homenageados</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gestão de títulos e honrarias</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button 
          onClick={openNewHonoree}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Homenageado
        </button>
        <button 
          onClick={handleExport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
           <input 
             placeholder="Buscar por nome, tipo, justificativa..." 
             className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
           />
           <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        <div className="w-full md:w-48">
          <select className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none">
            <option>Entregue</option>
            <option>Indicado</option>
            <option>Cancelado</option>
          </select>
        </div>
        <button className="px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
          Filtrar
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 min-h-[400px] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
          <Award className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-800 dark:text-white">Homenageados</h3>
        </div>

        {honorees.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
             <p>Nenhum homenageado cadastrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 font-medium border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {honorees.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{h.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{h.type}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{h.ceremonyDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                        ${h.status === 'Confirmado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                          h.status === 'Entregue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}
                      `}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditHonoree(h)} className="p-1 text-slate-400 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => openDeleteHonoree(h)} className="p-1 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <div>Total: {honorees.length}</div>
          <div className="flex items-center gap-2">
             <button className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50" disabled>Anterior</button>
             <span>Página 1 de 1</span>
             <button className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50" disabled>Próxima</button>
             <select className="ml-2 border border-gray-300 dark:border-slate-600 rounded py-1 px-2 bg-transparent outline-none">
               <option>10/página</option>
             </select>
          </div>
        </div>
      </div>

      {/* Honoree Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Homenageado" : "Novo Homenageado"}
        footer={
          <>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
            >
              {isEditing ? "Salvar Alterações" : "Salvar"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome*</label>
            <input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Social (opcional)</label>
              <input 
                value={formData.socialName}
                onChange={(e) => setFormData({...formData, socialName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Homenagem</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option>Titulo de Cidadão Anapolino</option>
                <option>Moção de Aplauso</option>
                <option>Comenda</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Justificativa (opcional)</label>
            <textarea 
              rows={3}
              value={formData.justification}
              onChange={(e) => setFormData({...formData, justification: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Biografia Curta (opcional)</label>
            <textarea 
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data da Cerimônia</label>
              <input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Local da Cerimônia</label>
              <input 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora Início</label>
              <input 
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora Fim</label>
              <input 
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option>Indicado</option>
                <option>Confirmado</option>
                <option>Entregue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone (opcional)</label>
              <input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail (opcional)</label>
              <input 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Excluir Homenageado"
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
            Você está prestes a remover o homenageado:
          </p>
          <p className="font-medium text-slate-800 dark:text-white bg-gray-50 dark:bg-slate-700 px-3 py-1 rounded mb-4">
            {selectedHonoree?.name}
          </p>
          <p className="text-sm text-slate-500">
            Esta ação não poderá ser desfeita.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Honored;