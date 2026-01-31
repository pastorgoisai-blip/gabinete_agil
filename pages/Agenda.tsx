import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Settings,
  MapPin,
  AlertCircle,
  Edit,
  Trash2,
  Bot,
  Send,
  Zap,
  MessageCircle,
  BellRing,
  Share2,
  CheckCircle2,
  X,
  Mic,
  Smartphone,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import Modal from '../components/Modal';
import { useAgenda, AgendaEvent, EventFormData } from '../hooks/useAgenda';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';

// --- Interfaces para Chat (Ainda mockado/memory-only por enquanto) ---
interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  text: string;
}

const Agenda: React.FC = () => {
  // Hook de Dados Reais
  const { events, loading, createEvent, updateEvent, deleteEvent } = useAgenda();
  const { syncEvent } = useGoogleCalendar();

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Selection & Editing
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Assistant State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { id: 1, sender: 'bot', text: 'Olá! Sou o assistente da agenda conectado ao n8n. Posso gerenciar compromissos integrados ao Google Calendar e WhatsApp.' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Form State
  const initialFormState: EventFormData = {
    title: '',
    type: 'Sessão Ordinária',
    date: new Date().toISOString().split('T')[0],
    location: '',
    start_time: '08:00',
    end_time: '09:00',
    responsible: '',
    description: '',
    notes: '',
    notify_politician: true,
    notify_media: true,
    notify_staff: true,
    source: 'app',
    status: 'agendado'
  };

  const [formData, setFormData] = useState<EventFormData>(initialFormState);

  // --- Helpers ---

  const showNotification = (msg: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, msg]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== msg));
    }, 4000);
  };

  const getStatusColor = (statusLabel?: string) => {
    switch (statusLabel) {
      case 'hoje': return 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
      case 'chegando': return 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
      case 'distante': return 'border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800';
      case 'concluido': return 'border-l-4 border-l-gray-300 bg-gray-50 dark:bg-slate-900 opacity-60';
      default: return 'bg-white dark:bg-slate-800';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp':
        return (
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800" title="Criado via WhatsApp (n8n)">
            <MessageCircle className="w-3 h-3" /> WhatsApp
          </div>
        );
      case 'telegram':
        return (
          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800" title="Criado via Telegram (n8n)">
            <Send className="w-3 h-3" /> Telegram
          </div>
        );
      case 'google_calendar':
        return (
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600" title="Sincronizado com Google Calendar">
            <CalendarIcon className="w-3 h-3" /> Google
          </div>
        );
      default: return null;
    }
  };

  // --- Assistant Logic ---

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatHistory(prev => [...prev, { id: Date.now(), sender: 'user', text: chatInput }]);
    const currentInput = chatInput;
    setChatInput('');

    // Mock response for now
    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: `Entendido: "${currentInput}". Ainda estou aprendendo a manipular o banco de dados diretamente, mas em breve poderei agendar isso para você!`
      }]);
    }, 800);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAssistantOpen]);

  // --- CRUD Handlers ---

  const openNewEvent = () => {
    setIsEditing(false);
    setSelectedEvent(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditEvent = (event: AgendaEvent) => {
    setIsEditing(true);
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      type: event.type,
      date: event.date,
      location: event.location,
      start_time: event.start_time,
      end_time: event.end_time || '',
      responsible: event.responsible || '',
      description: event.description || '',
      notes: event.notes || '',
      notify_politician: event.notify_politician,
      notify_media: event.notify_media,
      notify_staff: event.notify_staff,
      source: event.source,
      status: event.status
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) return;

    if (formData.notify_media) showNotification("📢 Disparando aviso no Grupo de Mídia (WhatsApp)...");

    let result;
    if (isEditing && selectedEvent) {
      result = await updateEvent(selectedEvent.id, formData);
    } else {
      result = await createEvent(formData);
    }

    if (result.success) {
      showNotification(isEditing ? "✅ Evento atualizado!" : "✅ Evento criado com sucesso!");

      // Google Sync
      const eventIdToSync = isEditing && selectedEvent ? selectedEvent.id : (result as any).data?.id; // Cast needed as create returns object
      if (eventIdToSync) {
        showNotification("🔄 Sincronizando com Google...");
        syncEvent(eventIdToSync.toString(), isEditing ? 'update' : 'create')
          .then(() => showNotification("☁️ Sincronizado com Google Calendar"))
          .catch(() => showNotification("⚠️ Falha ao sincronizar com Google"));
      }

      setIsModalOpen(false);
    } else {
      alert("Erro ao salvar: " + result.error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedEvent) {
      if (selectedEvent.source === 'google_calendar' || selectedEvent.google_event_id) showNotification("🗑️ Solicitando remoção no Google Calendar...");

      // Sync Delete FIRST (while event exists in DB)
      if (selectedEvent.google_event_id) {
        await syncEvent(selectedEvent.id.toString(), 'delete');
      }

      const result = await deleteEvent(selectedEvent.id);

      if (result.success) {
        showNotification("🗑️ Evento excluído.");
        setIsDeleteOpen(false);
        setSelectedEvent(null);
      } else {
        alert("Erro ao excluir: " + result.error);
      }
    }
  };

  const handleSyncSimulate = () => {
    setIsSyncModalOpen(false);
    showNotification("🔄 Buscando eventos no Google Calendar (n8n)...");
    setTimeout(() => {
      showNotification("✅ Agenda sincronizada com sucesso!");
    }, 2000);
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative animate-fade-in">

      {/* Toast Notifications */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((note, idx) => (
          <div key={idx} className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in-up">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">{note}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-600 text-white rounded-lg shadow-lg shadow-primary-600/30">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Agenda Oficial Integrada</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Conectado ao Supabase
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            title="Configurar Integração"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 border shadow-sm
              ${isAssistantOpen
                ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/30'
                : 'bg-white dark:bg-slate-800 text-purple-600 border-purple-200 dark:border-purple-900 hover:bg-purple-50 dark:hover:bg-purple-900/20'}
            `}
          >
            <Bot className="w-5 h-5" />
            {isAssistantOpen ? 'Fechar Assistente' : 'Assistente IA'}
          </button>
          <button
            onClick={openNewEvent}
            className="flex-1 md:flex-none px-4 py-2 text-sm text-white font-bold bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
          >
            <Plus className="w-5 h-5" /> Novo Evento
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Timeline */}
        <div className="flex-1 space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhum evento agendado.</p>
              <button onClick={openNewEvent} className="text-primary-600 font-bold mt-2 hover:underline">Criar primeiro evento</button>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className={`group relative bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all ${getStatusColor(event.statusLabel)}`}>
                <div className="flex flex-col md:flex-row gap-4 justify-between">

                  {/* Time */}
                  <div className="flex md:flex-col items-center md:items-start gap-2 md:w-32 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-700 pb-3 md:pb-0 md:pr-4">
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{event.start_time?.substring(0, 5)}</span>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-medium uppercase">{event.displayDate}</span>
                      <span className="text-xs text-slate-400">até {event.end_time?.substring(0, 5)}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            {event.title}
                            {event.statusLabel === 'hoje' && <span className="animate-pulse w-2 h-2 rounded-full bg-blue-500"></span>}
                          </h3>
                          {getSourceIcon(event.source)}
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {event.type}
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditEvent(event)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-primary-600"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedEvent(event); setIsDeleteOpen(true); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {event.location || 'Local não definido'}
                      </div>
                      {event.responsible && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-slate-400" />
                          Resp: {event.responsible}
                        </div>
                      )}
                    </div>

                    {/* Automation Badges */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Disparos:</span>
                      {event.notify_politician && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs border border-blue-100 dark:border-blue-800" title="Vereador Notificado">
                          <BellRing className="w-3 h-3" /> Vereador
                        </div>
                      )}
                      {event.notify_media && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs border border-green-100 dark:border-green-800" title="Grupo de Mídia Avisado">
                          <MessageCircle className="w-3 h-3" /> Mídia
                        </div>
                      )}
                      {event.notify_staff && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs border border-purple-100 dark:border-purple-800" title="Gabinete Avisado">
                          <Share2 className="w-3 h-3" /> Gabinete
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Assistant */}
        {isAssistantOpen && (
          <div className="w-full lg:w-80 shrink-0 animate-slide-in-right">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/30 overflow-hidden flex flex-col h-[600px] sticky top-24">
              <div className="bg-purple-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  <span className="font-bold">Agente n8n</span>
                </div>
                <button onClick={() => setIsAssistantOpen(false)} className="hover:bg-purple-700 p-1 rounded transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-purple-50/50 dark:bg-slate-900/50">
                {chatHistory.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                      }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                <div className="relative">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ex: Cancelar evento hoje..."
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-100 dark:bg-slate-900 border-0 rounded-full text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:text-white"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="absolute right-1 top-1 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 flex justify-center gap-2">
                  <button className="text-xs text-slate-400 hover:text-purple-600 flex items-center gap-1"><Mic className="w-3 h-3" /> Gravar Áudio</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sync Settings Modal */}
      <Modal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        title="Configurar Integração n8n & Google"
        footer={
          <>
            <button
              onClick={() => setIsSyncModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSyncSimulate}
              className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Salvar e Sincronizar
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
            <p>
              <strong>Como funciona:</strong> O n8n gerencia as conversas no WhatsApp/Telegram. Quando um evento é confirmado lá, ele envia um Webhook para o Supabase.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Google Calendar ID (Vereador)</label>
            <div className="relative">
              <input
                defaultValue="vereador.wederson@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
              <CalendarIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Event Modal (Form) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Evento" : "Novo Evento Integrado"}
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
              className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isEditing ? "Salvar Alterações" : <><Zap className="w-4 h-4" /> Criar e Disparar Avisos</>}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Section 1: Event Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">Detalhes do Evento</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Título</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Ex: Inauguração Escola"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option>Sessão Ordinária</option>
                  <option>Evento Externo</option>
                  <option>Reunião de Gabinete</option>
                  <option>Audiência Pública</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Local</label>
                <input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Início</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Fim</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Automation */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Automação e Comunicação
            </h4>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-slate-700">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded text-green-600 dark:text-green-400"><MessageCircle className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Avisar Grupo de Mídia (WhatsApp)</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notify_media}
                  onChange={(e) => setFormData({ ...formData, notify_media: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
              <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400"><BellRing className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Avisar Vereador</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notify_politician}
                  onChange={(e) => setFormData({ ...formData, notify_politician: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
              <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-600 dark:text-purple-400"><Share2 className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Notificar Gabinete (Painel/Email)</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notify_staff}
                  onChange={(e) => setFormData({ ...formData, notify_staff: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
            </div>
            <p className="text-xs text-slate-500 italic px-1">
              * Evento será enviado ao n8n para distribuição automática nos canais selecionados.
            </p>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Excluir Evento"
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
              Sim, Excluir e Notificar
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center p-4">
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Tem certeza?</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-1">
            Você está prestes a excluir o evento:
          </p>
          <p className="font-medium text-slate-800 dark:text-white bg-gray-50 dark:bg-slate-700 px-3 py-1 rounded mb-4">
            {selectedEvent?.title}
          </p>
          {selectedEvent?.source !== 'app' && (
            <p className="text-sm text-red-500 font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded">
              Atenção: Este evento foi sincronizado via {selectedEvent?.source}. A exclusão aqui tentará removê-lo na origem via n8n.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Agenda;