import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MapPin, 
  Phone,
  Edit,
  Trash2,
  Eye,
  FileSpreadsheet,
  Share2,
  UserCheck,
  Map,
  User,
  Camera,
  RotateCcw,
  Upload,
  Copy,
  AlertTriangle,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Tag,
  Clock,
  Zap,
  Instagram,
  Heart
} from 'lucide-react';
import Modal from '../components/Modal';

// --- Interfaces Avançadas ---

interface Voter {
  id: number;
  name: string;
  cpf: string;
  address: string;
  phone: string;
  initial: string;
  category: string; // Categoria macro (Liderança, etc)
  tags: string[]; // Interesses específicos (Saúde, Educação, Bairro)
  engagement: number; // 0 a 100 (Termômetro)
  lastContact: string; // Data relativa
  lastChannel: 'WhatsApp' | 'Email' | 'Presencial' | 'Telefone' | 'Instagram';
  status: 'active' | 'inactive';
  socialStats?: {
    instagram: { isFollowing: boolean; interactions: number }; // Likes + Comentários
    whatsapp: { status: 'opt-in' | 'opt-out'; msgCount: number };
  };
}

// --- Mock Data Enriquecido ---

const initialVoters: Voter[] = [
  {
    id: 1,
    name: 'ABRAAO ALVES DE BRITO',
    cpf: '874.879.457-15',
    address: 'Rua Angelo Teles, Alvorada',
    phone: '(62) 99154-9173',
    initial: 'A',
    category: 'Apoiador',
    tags: ['Educação', 'Jovens'],
    engagement: 75,
    lastContact: 'Há 2 dias',
    lastChannel: 'WhatsApp',
    status: 'active',
    socialStats: {
      instagram: { isFollowing: true, interactions: 42 },
      whatsapp: { status: 'opt-in', msgCount: 15 }
    }
  },
  {
    id: 2,
    name: 'ADELTO PEREIRA DE REZENDE',
    cpf: 'Não informado',
    address: 'RUA PP 14, Parque pirineus',
    phone: '(62) 99258-2801',
    initial: 'A',
    category: 'Liderança',
    tags: ['Infraestrutura', 'Mobilização', 'Igreja'],
    engagement: 98,
    lastContact: 'Ontem',
    lastChannel: 'Presencial',
    status: 'active',
    socialStats: {
      instagram: { isFollowing: true, interactions: 156 },
      whatsapp: { status: 'opt-in', msgCount: 89 }
    }
  },
  {
    id: 3,
    name: 'ADIEL ACSON BATISTA FARIAS',
    cpf: '875.875.487-54',
    address: 'Rua Corumbá, Polocentro 1ª etapa',
    phone: '(62) 99329-4065',
    initial: 'A',
    category: 'Voluntário',
    tags: ['Saúde', 'Esporte'],
    engagement: 45,
    lastContact: 'Há 20 dias',
    lastChannel: 'Instagram',
    status: 'inactive',
    socialStats: {
      instagram: { isFollowing: false, interactions: 2 },
      whatsapp: { status: 'opt-in', msgCount: 0 }
    }
  },
];

const Voters: React.FC = () => {
  const [voters, setVoters] = useState<Voter[]>(initialVoters);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas as categorias');
  
  // Modals & AI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAIMessageOpen, setIsAIMessageOpen] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  
  // Selection
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const filteredVoters = useMemo(() => {
    return voters.filter(voter => {
      const matchesSearch = 
        voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.cpf.includes(searchTerm) ||
        voter.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        voter.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Todas as categorias' || voter.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [voters, searchTerm, categoryFilter]);

  const openNewVoter = () => { setIsEditing(false); setSelectedVoter(null); setIsFormOpen(true); };
  const openEditVoter = (voter: Voter) => { setIsEditing(true); setSelectedVoter(voter); setIsFormOpen(true); };
  const openViewVoter = (voter: Voter) => { setSelectedVoter(voter); setIsViewOpen(true); };
  
  // --- AI Logic ---
  const generateAIMessage = (voter: Voter) => {
    setSelectedVoter(voter);
    // Simulação de IA gerando texto baseado nas tags
    const interest = voter.tags[0] || 'nossa cidade';
    const baseMsg = `Olá ${voter.name.split(' ')[0]}! Aqui é da equipe do Vereador. \n\nSabemos do seu interesse por *${interest}* e gostaríamos de compartilhar nossas novas propostas para essa área no bairro ${voter.address.split(',')[1] || 'sue bairro'}. \n\nPodemos agendar uma rápida conversa?`;
    setGeneratedMessage(baseMsg);
    setIsAIMessageOpen(true);
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-green-400';
    if (score >= 50) return 'bg-gradient-to-r from-yellow-500 to-orange-400';
    return 'bg-gradient-to-r from-gray-400 to-gray-300';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 pb-0">
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600 text-white rounded-lg shadow-lg shadow-primary-600/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Base de Eleitores (CRM 360°)</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gerenciamento inteligente de relacionamento e segmentação.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <button 
              onClick={openNewVoter}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary-600/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Novo Eleitor
            </button>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> Importar
            </button>
            <button className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
              <Share2 className="w-4 h-4" /> Link de Cadastro
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, tag, CPF ou bairro..." 
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
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* User Stats Banner */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-t-lg p-4 flex flex-col sm:flex-row justify-between items-center text-white shadow-inner">
          <div className="mb-2 sm:mb-0">
            <p className="text-xs uppercase opacity-80 font-bold tracking-wider">Base Total</p>
            <p className="font-black text-3xl">{voters.length}</p>
          </div>
          <div className="flex gap-8 text-center">
             <div>
                <p className="text-xs opacity-80 font-semibold">Hoje</p>
                <p className="font-bold text-xl">+0</p>
             </div>
             <div>
                <p className="text-xs opacity-80 font-semibold">Engajados</p>
                <p className="font-bold text-xl">{(voters.filter(v => v.engagement > 70).length / voters.length * 100).toFixed(0)}%</p>
             </div>
             <div>
                <p className="text-xs opacity-80 font-semibold">Sem Contato</p>
                <p className="font-bold text-xl">1</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredVoters.map((voter) => (
          <div key={voter.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 transition-all group relative overflow-hidden">
            {/* Status Line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${voter.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
            
            <div className="flex flex-col lg:flex-row items-start gap-5 pl-3">
              
              {/* Avatar & Basic Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300 font-bold text-xl border-2 border-white dark:border-slate-600 shadow-sm">
                    {voter.initial}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5">
                     <div className={`w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${voter.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg cursor-pointer hover:text-primary-600 transition-colors truncate" onClick={() => openViewVoter(voter)}>
                      {voter.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        voter.category === 'Liderança' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                        voter.category === 'Voluntário' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                        'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {voter.category}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {voter.address}
                    </div>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      CPF: {voter.cpf}
                    </div>
                  </div>

                  {/* Tags Row */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {voter.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        <Tag className="w-3 h-3 opacity-50" /> {tag}
                      </span>
                    ))}
                    <button className="text-[10px] text-primary-600 hover:underline px-1">+ tag</button>
                  </div>

                  {/* Digital Footprint / Social Stats */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dashed border-gray-100 dark:border-slate-700/50 w-full max-w-md">
                    <div className="flex items-center gap-2" title="Interações no Instagram">
                      <div className={`p-1 rounded-full ${voter.socialStats?.instagram.isFollowing ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-500'}`}>
                        <Instagram className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{voter.socialStats?.instagram.interactions || 0} interações</span>
                      </div>
                    </div>
                    <div className="w-px h-6 bg-gray-200 dark:bg-slate-700"></div>
                    <div className="flex items-center gap-2" title="Conversas no WhatsApp">
                      <div className={`p-1 rounded-full ${voter.socialStats?.whatsapp.status === 'opt-in' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-500'}`}>
                        <MessageCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{voter.socialStats?.whatsapp.msgCount || 0} mensagens</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement & Actions Column */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-4 w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-700 pt-4 lg:pt-0 lg:pl-4">
                
                {/* Engagement Meter */}
                <div className="w-full">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Engajamento</span>
                    <span className="font-bold text-slate-700 dark:text-white">{voter.engagement}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getEngagementColor(voter.engagement)} transition-all duration-500`} style={{ width: `${voter.engagement}%` }}></div>
                  </div>
                </div>

                {/* Last Contact Info */}
                <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>Último: {voter.lastContact} ({voter.lastChannel})</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 w-full mt-auto">
                   <button 
                    onClick={() => generateAIMessage(voter)}
                    className="flex-1 lg:flex-none px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-sm text-xs font-bold flex items-center justify-center gap-1.5 transition-all group-hover:shadow-md"
                    title="Gerar mensagem com IA"
                   >
                     <Sparkles className="w-3.5 h-3.5" />
                     <span className="lg:hidden">IA Msg</span>
                   </button>
                   <button className="p-2 text-slate-500 hover:text-green-600 bg-slate-50 dark:bg-slate-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors border border-slate-200 dark:border-slate-600" title="WhatsApp">
                     <MessageCircle className="w-4 h-4" />
                   </button>
                   <button onClick={() => openEditVoter(voter)} className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-slate-200 dark:border-slate-600">
                     <Edit className="w-4 h-4" />
                   </button>
                   <button onClick={() => { setSelectedVoter(voter); setIsDeleteOpen(true); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Simplified Modal Logic for brevity - Keeping structure ready for full implementation */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={isEditing ? "Editar Eleitor" : "Cadastro de Eleitor"} footer={<button onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold">Salvar</button>}>
         <div className="p-4 text-center text-slate-500">Formulário de cadastro padrão...</div>
      </Modal>

      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Detalhes do Eleitor" footer={<button onClick={() => setIsViewOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg text-sm font-bold">Fechar</button>}>
         <div className="p-4 text-center">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedVoter?.name}</h3>
            <p className="text-primary-600">{selectedVoter?.category}</p>
         </div>
      </Modal>

      {/* AI Message Modal */}
      <Modal
        isOpen={isAIMessageOpen}
        onClose={() => setIsAIMessageOpen(false)}
        title="Assistente de Mensagem (IA)"
        footer={
          <>
            <button onClick={() => setIsAIMessageOpen(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium">Cancelar</button>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-600/20">
              <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold mb-2 text-sm">
              <Sparkles className="w-4 h-4" /> Sugestão Inteligente
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
              Baseado nos interesses em: <strong>{selectedVoter?.tags.join(', ')}</strong>
            </p>
            <textarea 
              value={generatedMessage}
              onChange={(e) => setGeneratedMessage(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button className="text-xs px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-gray-200 transition-colors">Mais Formal</button>
            <button className="text-xs px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-gray-200 transition-colors">Mais Curto</button>
            <button className="text-xs px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-gray-200 transition-colors">Adicionar Emoji</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Voters;