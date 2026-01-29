import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVoters } from '../hooks/useVoters';
import {
  Search, Filter, Plus, MapPin, Edit,
  Trash2, FileSpreadsheet, UserCheck, MessageCircle,
  Eye, Calendar, ArrowUpDown
} from 'lucide-react';
import Modal from '../components/Modal';
import ImportVotersModal from '../components/ImportVotersModal';
import VoterForm from '../components/VoterForm';
import VoterProfileModal from '../components/VoterProfileModal';
import { Voter } from '../types';

const Voters: React.FC = () => {
  const { profile } = useAuth();
  const { voters, loading, refresh, deleteVoter } = useVoters();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas as categorias');
  const [sortOrder, setSortOrder] = useState<'recent' | 'az' | 'za'>('recent');
  const [showBirthdaysOnly, setShowBirthdaysOnly] = useState(false);

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);

  // Filter Logic
  const filteredVoters = useMemo(() => {
    let result = voters.filter(voter => {
      const matchesSearch =
        voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (voter.cpf && (voter.cpf.includes(searchTerm) || voter.cpf.replace(/\D/g, '').includes(searchTerm))) ||
        (voter.address && voter.address.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = categoryFilter === 'Todas as categorias' || voter.category === categoryFilter;

      let matchesBirthday = true;
      if (showBirthdaysOnly) {
        if (!voter.birth_date) matchesBirthday = false;
        else {
          const today = new Date();
          // Create date objects avoiding timezone issues for month comparison
          const birthParts = voter.birth_date.split('-'); // Assuming YYYY-MM-DD
          const birthMonth = parseInt(birthParts[1]) - 1; // 0-indexed
          matchesBirthday = birthMonth === today.getMonth();
        }
      }

      return matchesSearch && matchesCategory && matchesBirthday;
    });

    // Sort Logic
    result.sort((a, b) => {
      if (sortOrder === 'recent') {
        // Assuming ID is numeric/auto-increment or created_at logic
        // If implicit: b.id - a.id
        return Number(b.id) - Number(a.id);
      }
      if (sortOrder === 'az') return a.name.localeCompare(b.name);
      if (sortOrder === 'za') return b.name.localeCompare(a.name);
      return 0;
    });

    return result;
  }, [voters, searchTerm, categoryFilter, sortOrder, showBirthdaysOnly]);

  const handleDelete = async (voter: Voter) => {
    if (confirm(`Tem certeza que deseja excluir ${voter.name}?`)) {
      await deleteVoter(voter.id);
    }
  };

  const handleEdit = (voter: Voter) => {
    setSelectedVoter(voter);
    setIsFormOpen(true);
    setIsProfileOpen(false); // Close profile if open
  };

  const handleView = (voter: Voter) => {
    setSelectedVoter(voter);
    setIsProfileOpen(true);
  };

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 pb-0">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600 text-white rounded-lg shadow-lg shadow-primary-600/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Base de Eleitores</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gerenciamento de relacionamento e segmentação.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <button
              onClick={() => { setSelectedVoter(null); setIsFormOpen(true); }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary-600/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Novo Eleitor
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" /> Importar
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, CPF ou endereço..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {/* Category Filter */}
            <div className="relative min-w-[180px]">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none cursor-pointer"
              >
                <option>Todas as categorias</option>
                <option>Liderança</option>
                <option>Apoiador</option>
                <option>Voluntário</option>
                <option>Indeciso</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Sort Order */}
            <div className="relative min-w-[160px]">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none cursor-pointer"
              >
                <option value="recent">Mais Recentes</option>
                <option value="az">Nome (A-Z)</option>
                <option value="za">Nome (Z-A)</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Birthday Filter Toggle */}
            <button
              onClick={() => setShowBirthdaysOnly(!showBirthdaysOnly)}
              className={`px-4 py-2.5 rounded-lg border flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap ${showBirthdaysOnly
                  ? 'bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-900/20 dark:border-pink-800'
                  : 'bg-white border-gray-300 text-slate-600 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300'
                }`}
            >
              <Calendar className="w-4 h-4" />
              {showBirthdaysOnly ? 'Aniversariantes (Ativo)' : 'Aniversariantes'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Carregando eleitores...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredVoters.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 border-dashed">
              <p className="text-gray-500 dark:text-slate-400">Nenhum eleitor encontrado.</p>
              <button onClick={() => setIsImportOpen(true)} className="mt-2 text-primary-600 font-bold hover:underline">Importar agora</button>
            </div>
          ) : filteredVoters.map((voter) => (
            <div key={voter.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 transition-all group relative">
              <div className="flex flex-col lg:flex-row items-center gap-5 pl-3">

                {/* Avatar & Basic Info */}
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div
                    onClick={() => handleView(voter)}
                    className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold text-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                  >
                    {voter.avatar_url ? (
                      <img src={voter.avatar_url} alt={voter.name} className="w-full h-full rounded-full object-cover" />
                    ) : getInitial(voter.name)}
                  </div>
                  <div className="flex-1 min-w-0 pointer-events-none sm:pointer-events-auto" onClick={() => handleView(voter)}>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate cursor-pointer hover:text-primary-600 transition-colors">{voter.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                      {voter.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {voter.address}</span>}
                      {voter.indicated_by && <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 rounded-full">Ind: {voter.indicated_by}</span>}
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${voter.category === 'Liderança' ? 'bg-purple-50 text-purple-700' :
                          voter.category === 'Apoiador' ? 'bg-blue-50 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                        {voter.category}
                      </span>
                      {voter.status === 'inactive' && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600">Inativo</span>}
                    </div>
                  </div>
                </div>

                {/* Actions Buttons */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-gray-100 dark:border-slate-700 mt-2 lg:mt-0">
                  <button
                    onClick={() => handleView(voter)}
                    className="p-2 text-slate-500 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                    title="Ver Perfil"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-500 hover:text-green-600 bg-slate-50 hover:bg-green-50 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-green-900/30 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(voter)}
                    className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-blue-900/30 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(voter)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ImportVotersModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => { setIsImportOpen(false); refresh(); }}
      />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedVoter ? "Editar Eleitor" : "Novo Eleitor"} footer={null}>
        <VoterForm
          voter={selectedVoter}
          onSuccess={() => { setIsFormOpen(false); refresh(); }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <VoterProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        voter={selectedVoter}
        onEdit={handleEdit}
        onDelete={(v) => { handleDelete(v); setIsProfileOpen(false); }}
      />

    </div>
  );
};

export default Voters;