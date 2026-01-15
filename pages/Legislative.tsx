import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LegislativeOffice } from '../types';
import ImportLegislativeModal from '../components/ImportLegislativeModal';
import ImportOfficesModal from '../components/ImportOfficesModal';
import Modal from '../components/Modal';
import {
  FileText, Plus, Search, Eye, Edit, Trash2, Download, UploadCloud,
  FileSpreadsheet, RefreshCw, Calendar, Briefcase, Filter, Mail, Send
} from 'lucide-react';

const Legislative: React.FC = () => {
  const { profile } = useAuth();
  const [offices, setOffices] = useState<LegislativeOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<LegislativeOffice | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Filters
  const [filterYear, setFilterYear] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterType, setFilterType] = useState('Todos');

  // Form Data
  const [formData, setFormData] = useState({
    type: 'Ofício',
    number: '',
    year: new Date().getFullYear().toString(),
    recipient: '',
    subject: '',
    status: 'Pendente' as 'Pendente' | 'Enviado' | 'Respondido',
    document_url: ''
  });

  const fetchOffices = async () => {
    if (!profile?.cabinet_id) return;
    setLoading(true);

    // Fetch from 'offices' table
    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .eq('cabinet_id', profile.cabinet_id)
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching offices:', error);
    } else {
      setOffices(data as LegislativeOffice[] || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOffices();
  }, [profile]);

  // Filtragem
  const filteredOffices = offices.filter(o => {
    const matchesSearch =
      (o.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.number?.toString() || '').includes(searchTerm) ||
      (o.recipient || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesYear = filterYear === 'Todos' || o.year.toString() === filterYear;
    const matchesStatus = filterStatus === 'Todos' || o.status === filterStatus;
    const matchesType = filterType === 'Todos' || (o.type || 'Ofício') === filterType;

    return matchesSearch && matchesYear && matchesStatus && matchesType;
  });

  const availableYears = Array.from(new Set(offices.map(o => o.year))).sort((a, b) => parseInt(b) - parseInt(a));
  const availableTypes = Array.from(new Set(offices.map(o => o.type || 'Ofício'))).sort();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Enviado': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'Respondido': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    }
  };

  const statusOptions = ['Pendente', 'Enviado', 'Respondido'];

  // CRUD Handlers

  const handleSave = async () => {
    if (!formData.number || !formData.recipient || !profile?.cabinet_id) return;

    const payload = {
      cabinet_id: profile.cabinet_id,
      type: formData.type,
      number: formData.number,
      year: formData.year,
      recipient: formData.recipient,
      subject: formData.subject,
      status: formData.status,
      document_url: formData.document_url
    };

    try {
      if (isEditing && selectedOffice) {
        const { error } = await supabase
          .from('offices')
          .update(payload)
          .eq('id', selectedOffice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('offices')
          .insert([payload]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchOffices();
    } catch (err) {
      console.error('Error saving office:', err);
      alert('Erro ao salvar ofício.');
    }
  };

  const handleDelete = async () => {
    if (!selectedOffice) return;
    try {
      const { error } = await supabase.from('offices').delete().eq('id', selectedOffice.id);
      if (error) throw error;
      setIsDeleteOpen(false);
      fetchOffices();
    } catch (err) {
      console.error('Error deleting office:', err);
      alert('Erro ao excluir ofício.');
    }
  };

  const openNew = () => {
    setSelectedOffice(null);
    setIsEditing(false);
    setFormData({
      number: '',
      year: new Date().getFullYear().toString(),
      recipient: '',
      subject: '',
      status: 'Pendente',
      document_url: ''
    });
    setFormData(prev => ({ ...prev, type: 'Ofício' }));
    setIsModalOpen(true);
  };

  const openEdit = (office: LegislativeOffice) => {
    setSelectedOffice(office);
    setIsEditing(true);
    setFormData({
      type: office.type || 'Ofício',
      number: office.number,
      year: office.year,
      recipient: office.recipient,
      subject: office.subject,
      status: office.status as any,
      document_url: office.document_url || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 text-white p-2 rounded-full flex items-center justify-center shadow-lg shadow-primary-600/30">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Espaço Legislativo (Ofícios)</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie a expedição de ofícios e documentos oficiais.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchOffices()}
            className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            title="Atualizar Lista"
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
            onClick={openNew}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Novo Ofício
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 text-slate-700 dark:text-slate-200 px-3 py-2 outline-none"
            >
              <option value="Todos">Todos</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ano</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 text-slate-700 dark:text-slate-200 px-3 py-2 outline-none"
            >
              <option value="Todos">Todos</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 text-slate-700 dark:text-slate-200 px-3 py-2 outline-none"
            >
              <option value="Todos">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Enviado">Enviado</option>
              <option value="Respondido">Respondido</option>
            </select>
          </div>

          <div className="col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Buscar</label>
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-lg text-sm pl-10 px-3 py-2 focus:ring-primary-500 focus:border-primary-500 text-slate-700 dark:text-slate-200 outline-none"
                placeholder="Busque por destinatário, assunto ou número..."
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-4" />
            <p className="text-slate-500">Carregando ofícios...</p>
          </div>
        ) : filteredOffices.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Nenhum ofício encontrado.</p>
            <p className="text-sm text-slate-500">Crie um novo ofício para começar.</p>
          </div>
        ) : (
          filteredOffices.map((doc) => (
            <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 hover:border-blue-300 dark:hover:border-blue-900 transition-colors group">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                      {doc.type || 'Ofício'} nº {doc.number}/{doc.year}
                    </h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p className="font-medium text-slate-900 dark:text-slate-300 mb-0.5">Destinatário: {doc.recipient}</p>
                    <p className="line-clamp-2">Assunto: {doc.subject}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-700/50 p-1 rounded-lg border border-gray-100 dark:border-slate-600">
                    <button
                      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                      title="Baixar Original"
                      onClick={() => doc.document_url ? window.open(doc.document_url, '_blank') : alert('Sem link disponível')}
                      disabled={!doc.document_url}
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <div className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1"></div>
                    <button
                      onClick={() => openEdit(doc)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => { setSelectedOffice(doc); setIsDeleteOpen(true); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
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

      {/* Modal Criar/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Ofício" : "Novo Ofício"}
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg">Salvar</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Documento</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600"
            >
              <option value="Ofício">Ofício</option>
              <option value="Requerimento">Requerimento</option>
              <option value="Moção">Moção</option>
              <option value="Indicação">Indicação</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ano</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destinatário</label>
            <input
              type="text"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              placeholder="Ex: Prefeito Municipal, Secretário de Obras"
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assunto</label>
            <textarea
              rows={3}
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600"
            >
              <option value="Pendente">Pendente</option>
              <option value="Enviado">Enviado</option>
              <option value="Respondido">Respondido</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Excluir Ofício"
        footer={
          <>
            <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 text-sm text-slate-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg">Excluir</button>
          </>
        }
      >
        <p className="text-center text-slate-600">Tem certeza que deseja excluir o Ofício {selectedOffice?.number}/{selectedOffice?.year}?</p>
      </Modal>

      {/* Import Modal */}
      <ImportOfficesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          fetchOffices();
        }}
      />
    </div>
  );
};

export default Legislative;