import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, X, Minimize2, Bot, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

// Helper para gerar IDs seguros mesmo em contextos não-seguros (HTTP)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// 🔧 CONFIGURE: Atualize esta URL com o webhook do seu n8n
const N8N_WEBHOOK_URL = 'https://n8n.gabineteonline.online/webhook-test/copilot-gabinete';

// Quick actions pré-configurados
const QUICK_ACTIONS = [
  { label: '📊 Resumo do dia', prompt: 'Faça um resumo das atividades do dia' },
  { label: '📋 Demandas Pendentes', prompt: 'Quais demandas estão pendentes?' },
  { label: '👥 Total Eleitores', prompt: 'Quantos eleitores temos cadastrados?' },
  { label: '🔍 Buscar Eleitor', prompt: 'Buscar eleitor por nome: ' },
];

const CopilotWidget: React.FC = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      text: 'Olá! Sou o Copilot Ágil do Gabinete. Estou conectado a toda sua base de dados. Pergunte sobre eleitores, demandas, homenageados ou agenda! 🤖',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Session ID único para manter contexto da conversa
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem('copilot_session_id');
    if (stored) return stored;
    const newId = generateUUID();
    sessionStorage.setItem('copilot_session_id', newId);
    return newId;
  });

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    // Foca no input quando abre
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        type: 'bot',
        text: 'Conversa reiniciada. Como posso ajudar?',
        timestamp: new Date()
      }
    ]);
    // Gera novo session ID
    const newId = generateUUID();
    sessionStorage.setItem('copilot_session_id', newId);
  };

  const handleSend = useCallback(async (customMessage?: string) => {
    const messageToSend = customMessage || input.trim();
    if (!messageToSend) return;

    const userMsg = messageToSend;
    setMessages(prev => [...prev, { type: 'user', text: userMsg, timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);

    try {
      // Payload enriquecido com contexto
      const payload = {
        message: userMsg,
        cabinet_id: profile?.cabinet_id,
        user_name: profile?.name || 'Usuário',
        session_id: sessionId,
        context: {
          current_page: window.location.pathname,
          timestamp: new Date().toISOString(),
          user_role: profile?.role
        }
      };

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Copilot Response:', data);

      // Tratamento robusto para diferentes formatos de resposta
      let responseObj = data;
      if (Array.isArray(data) && data.length > 0) {
        responseObj = data[0];
      }

      // Propriedades comuns de retorno
      const botResponse =
        responseObj.text ||
        responseObj.output ||
        responseObj.message ||
        responseObj.response ||
        (typeof responseObj === 'string' ? responseObj : null);

      if (botResponse) {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: botResponse,
          timestamp: new Date()
        }]);
      } else {
        // Fallback se não encontrar resposta esperada
        setMessages(prev => [...prev, {
          type: 'bot',
          text: "Recebi sua mensagem, mas não consegui processar a resposta corretamente. Tente reformular sua pergunta.",
          timestamp: new Date()
        }]);
        console.warn('Formato de resposta inesperado:', data);
      }

    } catch (error) {
      console.error("Erro Copilot:", error);

      let errorMessage = "Ocorreu um erro ao processar sua solicitação.";

      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      } else if (error instanceof Error && error.message.includes('HTTP')) {
        errorMessage = "O serviço está temporariamente indisponível. Tente novamente em alguns instantes.";
      }

      setMessages(prev => [...prev, {
        type: 'bot',
        text: `⚠️ ${errorMessage}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, profile, sessionId]);

  const handleQuickAction = (prompt: string) => {
    if (prompt.endsWith(': ')) {
      // Se termina com ": ", coloca no input para o usuário completar
      setInput(prompt);
      inputRef.current?.focus();
    } else {
      // Envia diretamente
      handleSend(prompt);
    }
  };

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K para abrir/fechar
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleOpen();
      }
      // Escape para fechar
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  return (
    <>
      {/* Floating Button (FAB) */}
      <button
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 z-50 p-0 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${isOpen
          ? 'bg-slate-800 text-slate-400 rotate-90'
          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white animate-bounce-slow'
          }`}
        title="Abrir Copilot (Ctrl+K)"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-7 h-7" />}
      </button>

      {/* Slide-over Chat Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-96 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-slate-700 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="h-16 bg-gradient-to-r from-indigo-600 to-purple-700 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Bot className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-sm leading-tight">Copilot Ágil</h3>
              <p className="text-[10px] opacity-80 font-medium">IA Integrada ao Gabinete</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearConversation}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Limpar conversa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleOpen}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Minimizar (Esc)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.type === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-bl-sm'
                  }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className={`text-[10px] mt-1 ${msg.type === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}>
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-sm border border-gray-200 dark:border-slate-700 flex gap-2 items-center shadow-sm">
                <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-sm text-slate-500">Processando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 shrink-0">
          {/* Quick Actions Chips */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
              className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white resize-none h-12 max-h-32 disabled:opacity-50"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            IA conectada ao seu gabinete • Ctrl+K para abrir
          </p>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default CopilotWidget;