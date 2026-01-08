import React, { useState } from 'react';
import { 
  CheckCheck, 
  Search, 
  MoreHorizontal, 
  CloudDownload, 
  Calendar, 
  AlertTriangle, 
  Banknote, 
  ClipboardList, 
  ChevronDown 
} from 'lucide-react';

const Notifications: React.FC = () => {
  const [filter, setFilter] = useState('Todas');

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="max-w-5xl mx-auto w-full flex flex-col min-h-full">
        
        {/* Page Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-6 border-b border-gray-200 dark:border-slate-700 mb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Notificações</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">Fique por dentro das últimas atualizações da campanha em tempo real.</p>
          </div>
          <button className="shrink-0 flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-bold shadow-sm transition-all">
            <CheckCheck className="w-5 h-5" />
            <span className="truncate">Marcar todas como lidas</span>
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-slate-950/95 backdrop-blur-sm py-4 border-b border-gray-200/50 dark:border-slate-700/50 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input 
                className="w-full h-11 pl-10 pr-4 rounded-lg border-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 shadow-sm text-sm outline-none" 
                placeholder="Buscar notificações por palavra-chave..." 
                type="text"
              />
            </div>
            {/* Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {['Todas', 'Não lidas', 'Urgente', 'Eventos'].map((item) => (
                <button 
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`
                    flex items-center justify-center px-4 h-9 rounded-full text-sm font-medium transition-colors whitespace-nowrap border
                    ${filter === item 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow' 
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  {item}
                  {item === 'Não lidas' && <span className="ml-2 bg-red-100 text-red-600 text-xs px-1.5 rounded-full font-bold">3</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex flex-col gap-3 pb-20">
          
          {/* Date Divider */}
          <div className="flex items-center gap-4 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hoje</span>
            <div className="h-px bg-gray-200 dark:bg-slate-800 flex-1"></div>
          </div>

          {/* Item 1: Unread (High Priority) */}
          <div className="group relative flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border-l-4 border-primary-600 hover:shadow-md transition-all cursor-pointer">
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary-600 dark:text-primary-400 w-12 h-12">
                  <CloudDownload className="w-6 h-6" />
                </div>
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
              </div>
              <div className="flex flex-1 flex-col justify-center pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-slate-900 dark:text-white text-base font-bold leading-snug">Importação de eleitores concluída</p>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Sucesso</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-relaxed">A lista de eleitores da Zona Sul (24.500 registros) foi importada e validada com sucesso.</p>
                <p className="text-primary-600 dark:text-primary-400 text-xs font-medium mt-2">2 horas atrás</p>
              </div>
            </div>
          </div>

          {/* Item 2: Unread (Event) */}
          <div className="group relative flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border-l-4 border-primary-600 hover:shadow-md transition-all cursor-pointer">
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="flex items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 w-12 h-12">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
              </div>
              <div className="flex flex-1 flex-col justify-center pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-slate-900 dark:text-white text-base font-bold leading-snug">Novo comício agendado</p>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-relaxed">Um novo evento "Comício da Vitória" foi adicionado para Sábado às 14:00 na Praça da Sé.</p>
                <div className="flex items-center gap-3 mt-3">
                  <button className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-700 px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Ver detalhes</button>
                  <p className="text-slate-400 text-xs font-medium">4 horas atrás</p>
                </div>
              </div>
            </div>
          </div>

          {/* Item 3: Unread (Alert) */}
          <div className="group relative flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border-l-4 border-primary-600 hover:shadow-md transition-all cursor-pointer">
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="flex items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 w-12 h-12">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
              </div>
              <div className="flex flex-1 flex-col justify-center pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-slate-900 dark:text-white text-base font-bold leading-snug">Orçamento de Marketing Crítico</p>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">Atenção</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-relaxed">O orçamento para anúncios no Facebook atingiu 90% do limite mensal.</p>
                <p className="text-primary-600 dark:text-primary-400 text-xs font-medium mt-2">5 horas atrás</p>
              </div>
            </div>
          </div>

          {/* Date Divider */}
          <div className="flex items-center gap-4 py-2 mt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ontem</span>
            <div className="h-px bg-gray-200 dark:bg-slate-800 flex-1"></div>
          </div>

          {/* Item 4: Read (Money) */}
          <div className="group relative flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-transparent dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer opacity-80 hover:opacity-100">
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 w-12 h-12">
                  <Banknote className="w-6 h-6" />
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-slate-700 dark:text-slate-300 text-base font-medium leading-snug">Meta de doações diária atingida!</p>
                </div>
                <p className="text-slate-500 dark:text-slate-500 text-sm font-normal leading-relaxed">Parabéns equipe! A meta de R$ 50.000,00 foi alcançada ontem.</p>
                <p className="text-slate-400 text-xs font-medium mt-2">Ontem, 19:30</p>
              </div>
            </div>
          </div>

          {/* Item 5: Read (Task) */}
          <div className="group relative flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-transparent dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer opacity-80 hover:opacity-100">
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 w-12 h-12">
                  <ClipboardList className="w-6 h-6" />
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-slate-700 dark:text-slate-300 text-base font-medium leading-snug">Nova tarefa de canvassing</p>
                </div>
                <p className="text-slate-500 dark:text-slate-500 text-sm font-normal leading-relaxed">Ricardo Silva atribuiu uma nova rota de visitas para você no bairro Centro.</p>
                <p className="text-slate-400 text-xs font-medium mt-2">Ontem, 14:15</p>
              </div>
            </div>
          </div>

          {/* Load More */}
          <div className="flex justify-center pt-4">
            <button className="text-primary-600 hover:text-primary-700 dark:hover:text-primary-400 font-medium text-sm flex items-center gap-1 transition-colors">
              Carregar notificações antigas
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Notifications;
