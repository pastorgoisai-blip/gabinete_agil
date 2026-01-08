import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Bot,
  Send,
  Zap,
  MessageCircle,
  BellRing,
  Share2,
  CheckCircle2,
  X,
  Mic,
  MapPin,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import Modal from '../components/Modal';
import { useAgenda } from '../hooks/useAgenda';
import EventForm from '../components/EventForm';
import { Event } from '../types';

interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  action?: 'create' | 'cancel' | 'consult';
}

const Agenda: React.FC = () => {
  const { events, loading, createEvent, updateEvent, deleteEvent } = useAgenda();

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Selection & Editing
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Assistant State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { id: 1, sender: 'bot', text: 'Olá! Sou o assistente da agenda. Posso marcar, cancelar ou consultar compromissos para você. Tente dizer: "Marcar visita na escola amanhã às 14h".' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---

  const showNotification = (msg: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, msg]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== msg));
    }, 4000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hoje': return 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
      case 'chegando': return 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
      case 'distante': return 'border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800';
      case 'concluido': return 'border-l-4 border-l-gray-300 bg-gray-50 dark:bg-slate-900 opacity-60';
      default: return 'bg-white dark:bg-slate-800';
    }
  };

  // --- Assistant Logic ---
  const processAssistantCommand = (text: string) => {
    const lowerText = text.toLowerCase();
    let responseText = '';

    // 1. Comando: Cancelar
    if (lowerText.includes('cancelar') || lowerText.includes('desmarcar')) {
      const eventToCancel = events.find(e => lowerText.includes(e.title.toLowerCase()));
      if (eventToCancel) {
        deleteEvent(eventToCancel.id); // Call hook directly
        responseText = `Entendido. Cancelei o evento "${eventToCancel.title}" e notifiquei as equipes envolvidas.`;
        showNotification(`🚫 Evento cancelado via IA: ${eventToCancel.title}`);
      } else {
        responseText = 'Não encontrei um evento com esse nome exato para cancelar. Pode verificar o nome?';
      }
    }
    // 2. Comando: Consultar
    else if (lowerText.includes('hoje') || lowerText.includes('agenda')) {
      // NOTE: comparing dates might be tricky with timezone if not normalized, using simple string match from hook
      const todayString = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(e => e.status === 'hoje' || e.date === todayString);
      if (todayEvents.length > 0) {
        responseText = `Você tem ${todayEvents.length} eventos hoje: ${todayEvents.map(e => e.title).join(', ')}.`;
      } else {
        responseText = 'Sua agenda está livre por enquanto hoje.';
      }
    }
    // 3. Comando: Criar
    else if (lowerText.includes('marcar') || lowerText.includes('agendar') || lowerText.includes('nova')) {
      const newEventTitle = text.replace(/marcar|agendar|nova|novo|visita|reunião/gi, '').trim() || "Nova Reunião";
      const todayString = new Date().toISOString().split('T')[0];

      const newEventPayload: Partial<Event> = {
        title: newEventTitle.charAt(0).toUpperCase() + newEventTitle.slice(1),
        type: 'Reunião',
        date: todayString,
        startTime: '14:00',
        endTime: '15:00',
        location: 'Gabinete (Agendado via IA)',
        notifyPolitician: true,
        notifyMedia: false,
        notifyStaff: true
      };

      createEvent(newEventPayload);
      responseText = `Agendei "${newEventPayload.title}" para hoje às 14h. O gabinete já foi notificado.`;
      showNotification(`🤖 Evento criado via IA`);
    }
    else {
      responseText = 'Desculpe, ainda estou aprendendo. Tente "Marcar visita", "Cancelar evento X" ou "O que tenho hoje?".';
    }

    setChatHistory(prev => [...prev, { id: Date.now(), sender: 'bot', text: responseText }]);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatHistory(prev => [...prev, { id: Date.now(), sender: 'user', text: chatInput }]);
    const currentInput = chatInput;
    setChatInput('');
    setTimeout(() => {
      processAssistantCommand(currentInput);
    }, 800);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAssistantOpen]);

  // --- CRUD Handlers ---

  const openNewEvent = () => {
    setIsEditing(false);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const openEditEvent = (event: Event) => {
    setIsEditing(true);
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Partial<Event>) => {
    if (data.notifyMedia) showNotification("📢 Disparando aviso no Grupo de Mídia (WhatsApp)...");
    if (data.notifyPolitician) showNotification("📱 Notificando Vereador (Push/SMS)...");

    // Status calc
    const todayString = new Date().toISOString().split('T')[0];
    const status = data.date === todayString ? 'hoje' : 'distante';
    const payload = { ...data, status: status as any };

    if (isEditing && selectedEvent) {
      await updateEvent(selectedEvent.id, payload);
    } else {
      await createEvent(payload);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedEvent) {
      await deleteEvent(selectedEvent.id);
      if (selectedEvent.notifyStaff) showNotification("🗑️ Gabinete avisado do cancelamento.");
      setIsDeleteOpen(false);
      setSelectedEvent(null);
    }
  };

  if (loading && events.length === 0) {
    return <div className="p-8 text-center text-slate-500">Carregando agenda...</div>;
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Sincronização automática com Mídia, Gabinete e Político.</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
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

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Timeline / Event List */}
        <div className="flex-1 space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhum evento agendado.</p>
            </div>
          ) : (
            events
              .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime())
              .map((event) => (
                <div key={event.id} className={`group relative bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all ${getStatusColor(event.status)}`}>
                  <div className="flex flex-col md:flex-row gap-4 justify-between">

                    {/* Time & Date Column */}
                    <div className="flex md:flex-col items-center md:items-start gap-2 md:w-32 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-700 pb-3 md:pb-0 md:pr-4">
                      <span className="text-2xl font-bold text-slate-800 dark:text-white">{event.startTime}</span>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 font-medium uppercase">{event.displayDate}</span>
                        <span className="text-xs text-slate-400">até {event.endTime}</span>
                      </div>
                    </div>

                    {/* Details Column */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            {event.title}
                            {event.status === 'hoje' && <span className="animate-pulse w-2 h-2 rounded-full bg-blue-500"></span>}
                          </h3>
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
                          {event.location}
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Notificações:</span>
                        {event.notifyPolitician && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs border border-blue-100 dark:border-blue-800" title="Vereador Notificado">
                            <BellRing className="w-3 h-3" /> Vereador
                          </div>
                        )}
                        {event.notifyMedia && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs border border-green-100 dark:border-green-800" title="Grupo de Mídia Avisado">
                            <MessageCircle className="w-3 h-3" /> Mídia
                          </div>
                        )}
                        {event.notifyStaff && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs border border-purple-100 dark:border-purple-800" title="Gabinete Avisado">
                            <Share2 className="w-3 h-3" /> Gabinete
                          </div>
                        )}
                        {!event.notifyPolitician && !event.notifyMedia && !event.notifyStaff && (
                          <span className="text-xs text-slate-400 italic">Nenhuma automação ativa</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* AI Assistant Sidebar */}
        {isAssistantOpen && (
          <div className="w-full lg:w-80 shrink-0 animate-slide-in-right">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/30 overflow-hidden flex flex-col h-[600px] sticky top-24">
              <div className="bg-purple-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  <span className="font-bold">Assistente de Agenda</span>
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

      {/* Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Evento" : "Novo Evento Integrado"}
      >
        <EventForm
          initialData={selectedEvent}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirmar Exclusão"
        footer={
          <>
            <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
            <button onClick={handleDeleteConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm">Sim, Excluir</button>
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
        </div>
      </Modal>
    </div>
  );
};

export default Agenda;