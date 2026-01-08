import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Download, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Edit, 
  Trash2, 
  Columns, 
  List,
  MoreVertical,
  User,
  Tag
} from 'lucide-react';
import Modal from '../components/Modal';
import { useProfile } from '../contexts/ProfileContext';

interface Demand {
  id: number;
  title: string;
  description: string;
  beneficiary: string;
  author: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluída';
  category: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  obs?: string;
  alert?: string;
  deadline?: string;
}

const initialDemands: Demand[] = [
  {
    id: 1,
    title: 'Exame de ressonância',
    description: 'Pediu auxílio para agilizar o exame de ressonância da mãe.',
    beneficiary: 'Ariele Pereira',
    author: 'Miriam Generoso',
    status: 'Concluída',
    category: 'Saúde',
    priority: 'Média',
    obs: 'Conseguimos para 05/12/2025'
  },
  {
    id: 2,
    title: 'Transporte para Pirenópolis',
    description: 'Solicitação viabilizada via gabinete para paciente.',
    beneficiary: 'Alessandra Francalino',
    author: 'Miriam Generoso',
    status: 'Pendente',
    category: 'Outros',
    priority: 'Média',
    alert: 'Atrasado 2 dias'
  },
  {
    id: 3,
    title: 'Ponto comercial em feira',
    description: 'Solicitação de um ponto comercial na feira do bairro.',
    beneficiary: 'Cezarina Anselmo',
    author: 'Judiel Batista',
    status: 'Em Andamento',
    category: 'Infraestrutura',
    priority: 'Alta',
    deadline: '20/12/2025'
  }
];

const Demands: React.FC = () => {
  const { profile } = useProfile(); // Acesso ao perfil logado
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [demands, setDemands] = useState<Demand[]>(initialDemands);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    beneficiary: '',
    category: 'Saúde',
    priority: 'Média',
    status: 'Pendente',
    obs: ''
  });

  // Lista de categorias padrão para sugestão
  const defaultCategories = ['Saúde', 'Infraestrutura', 'Educação', 'Segurança', 'Social', 'Esporte', 'Cultura', 'Outros'];

  const openNewDemand = () => {
    setIsEditing(false);
    setSelectedDemand(null);
    setFormData({
      title: '', description: '', beneficiary: '', category: 'Saúde', priority: 'Média', status: 'Pendente', obs: ''
    });
    setIsFormOpen(true);
  };

  const handleSaveDemand = () => {
    if (!formData.title) return;
    
    if (isEditing && selectedDemand) {
      // Na edição, mantemos o autor original, a menos que se deseje mudar
      setDemands(demands.map(d => d.id === selectedDemand.id ? { ...d, ...formData } as Demand : d));
    } else {
      // Na criação, o autor é o usuário logado (profile.name)
      setDemands([{ 
        id: Date.now(), 
        ...formData, 
        author: profile.name || 'Usuário Atual' // Pega do contexto
      } as Demand, ...demands]);
    }
    setIsFormOpen(false);
  };

  const deleteDemand = () => {
    if (selectedDemand) {
      setDemands(demands.filter(d => d.id !== selectedDemand.id));
      setIsDeleteOpen(false);
    }
  };

  const KanbanColumn = ({ title, status, items, color }: any) => (
    <div className="flex-1 min-w-[300px] bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 flex flex-col h-full border border-gray-200 dark:border-slate-700">
      <div className={`flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-slate-700 ${color}`}>
        <h3 className="font-bold text-slate-700 dark:text-slate-200">{title}</h3>
        <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
        {items.map((item: Demand) => (
          <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md hover:border-primary-400 dark:hover:border-primary-600 transition-all cursor-grab active:cursor-grabbing group">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide
                ${item.category === 'Saúde' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 
                  item.category === 'Infraestrutura' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : 
                  'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                {item.category}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setSelectedDemand(item); setIsEditing(true); setFormData(item as any); setIsFormOpen(true); }} className="text-slate-400 hover:text-primary-600 p-1">
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-2">{item.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{item.description}</p>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold" title={`Beneficiário: ${item.beneficiary}`}>
                  {item.beneficiary.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{item.beneficiary.split(' ')[0]}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-400" title={`Responsável: ${item.author}`}>
                <User className="w-3 h-3" />
                <span className="text-[10px] truncate max-w-[70px]">{item.author.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        ))}
        <button 
          onClick={() => {
             setFormData(prev => ({...prev, status: status as any}));
             openNewDemand();
          }}
          className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-slate-400 hover:border-primary-500 hover:text-primary-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-600 text-white rounded-lg shadow-lg shadow-primary-600/30">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Demandas</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Fluxo de trabalho e acompanhamento de solicitações.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
           <button 
             onClick={() => setViewMode('list')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
           >
             <List className="w-4 h-4" /> Lista
           </button>
           <button 
             onClick={() => setViewMode('kanban')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
           >
             <Columns className="w-4 h-4" /> Quadro Ágil
           </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 mb-6 shrink-0">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" 
            placeholder="Buscar demandas..." 
          />
        </div>
        <button 
          onClick={openNewDemand}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-primary-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Demanda
        </button>
      </div>

      {/* Content Area */}
      {viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 h-full min-w-[1000px]">
            <KanbanColumn 
              title="A Fazer / Pendente" 
              status="Pendente"
              items={demands.filter(d => d.status === 'Pendente')} 
              color="border-l-4 border-l-yellow-400"
            />
            <KanbanColumn 
              title="Em Execução" 
              status="Em Andamento"
              items={demands.filter(d => d.status === 'Em Andamento')} 
              color="border-l-4 border-l-blue-400"
            />
            <KanbanColumn 
              title="Concluído / Entregue" 
              status="Concluída"
              items={demands.filter(d => d.status === 'Concluída')} 
              color="border-l-4 border-l-green-400"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Beneficiário</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Prioridade</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {demands.map(demand => (
                <tr key={demand.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{demand.title}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                      <Tag className="w-3 h-3" /> {demand.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{demand.beneficiary}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs text-slate-600 dark:text-slate-300">
                      <User className="w-3 h-3" />
                    </div>
                    {demand.author}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold
                      ${demand.status === 'Concluída' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                        demand.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                      {demand.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-xs font-medium
                      ${demand.priority === 'Alta' ? 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400' : 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300'}`}>
                      {demand.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedDemand(demand); setIsEditing(true); setFormData(demand as any); setIsFormOpen(true); }} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"><Edit className="w-4 h-4"/></button>
                      <button onClick={() => { setSelectedDemand(demand); setIsDeleteOpen(true); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        title={isEditing ? "Editar Demanda" : "Nova Demanda Ágil"}
        footer={
          <>
            <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
            <button onClick={handleSaveDemand} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm">Salvar</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">O que precisa ser feito?</label>
            <input 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Tapa buraco na Rua X"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Categoria (Tipo)</label>
              {/* Uso de datalist para permitir seleção ou digitação livre */}
              <input 
                list="category-options"
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                placeholder="Selecione ou digite..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              />
              <datalist id="category-options">
                {defaultCategories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              >
                <option value="Pendente">A Fazer</option>
                <option value="Em Andamento">Em Execução</option>
                <option value="Concluída">Feito</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Beneficiário / Eleitor</label>
              <input 
                value={formData.beneficiary} 
                onChange={e => setFormData({...formData, beneficiary: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
              <select 
                value={formData.priority} 
                onChange={e => setFormData({...formData, priority: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              >
                <option>Baixa</option>
                <option>Média</option>
                <option>Alta</option>
              </select>
            </div>
          </div>

          {/* Exibe quem está criando (apenas visualização na criação) */}
          {!isEditing && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-300">
                Responsável pelo cadastro: <strong>{profile.name}</strong>
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Detalhes</label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirmar Exclusão" footer={<><button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200">Cancelar</button><button onClick={deleteDemand} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg">Excluir</button></>}>
        <p className="text-slate-600 dark:text-slate-300">Tem certeza que deseja remover esta demanda?</p>
      </Modal>
    </div>
  );
};

export default Demands;