import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Search, Filter, Plus, MapPin, Edit,
  Trash2, FileSpreadsheet, Share2, UserCheck, MessageCircle,
  Tag, Clock, Instagram, Sparkles
} from 'lucide-react';
import Modal from '../components/Modal';
import ImportVotersModal from '../components/ImportVotersModal';
import VoterForm from '../components/VoterForm';

interface Voter {
  id: number;
  name: string;
  cpf: string;
  address: string;
  phone: string;
  category: string;
  tags?: string[];
  engagement?: number;
  last_contact?: string;
  status: 'active' | 'inactive';
  email?: string;
  indicated_by?: string;
}

const Voters: React.FC = () => {
  const { profile } = useAuth();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas as categorias');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);

  const fetchVoters = async () => {
    if (!profile?.cabinet_id) {
      // Se ainda não temos o ID do gabinete, não podemos buscar.
      // Mas se a autenticação já terminou e não temos gabinete, paramos o load.
      // (Isso deve ser tratado via Redirect no App.tsx, mas por segurança aqui:)
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('voters')
        .select('*')
        .eq('cabinet_id', profile.cabinet_id) // Forçar filtro explícito por segurança extra
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedVoters = data.map(v => ({
        ...v,
        tags: v.tags || [],
        engagement: v.engagement || 50
      }));

      setVoters(formattedVoters);
    } catch (error) {
      console.error('Erro ao buscar eleitores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, [profile?.cabinet_id]);

  const filteredVoters = useMemo(() => {
    return voters.filter(voter => {
      const matchesSearch =
        voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (voter.cpf && voter.cpf.includes(searchTerm)) ||
        (voter.address && voter.address.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'Todas as categorias' || voter.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [voters, searchTerm, categoryFilter]);

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

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
          <div className="w-full md:w-64">
            <div className="relative">
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
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Carregando eleitores...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredVoters.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200 border-dashed">
              <p className="text-gray-500">Nenhum eleitor encontrado.</p>
              <button onClick={() => setIsImportOpen(true)} className="mt-2 text-blue-600 font-bold hover:underline">Importar agora</button>
            </div>
          ) : filteredVoters.map((voter) => (
            <div key={voter.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:border-primary-400 transition-all group relative">
              <div className="flex flex-col lg:flex-row items-start gap-5 pl-3">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border border-slate-200">
                    {getInitial(voter.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate">{voter.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                      {voter.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {voter.address}</span>}
                      {voter.indicated_by && <span className="text-xs bg-gray-100 px-2 rounded-full">Ind: {voter.indicated_by}</span>}
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase">{voter.category}</span>
                      {voter.email && <span className="text-xs px-2 py-0.5 text-gray-500">{voter.email}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-500 hover:text-green-600 bg-slate-50 hover:bg-green-50 rounded-lg border border-slate-200">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
        onSuccess={() => { setIsImportOpen(false); fetchVoters(); }}
      />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedVoter ? "Editar Eleitor" : "Novo Eleitor"} footer={null}>
        <VoterForm
          voter={selectedVoter}
          onSuccess={() => { setIsFormOpen(false); fetchVoters(); }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

    </div>
  );
};

export default Voters;