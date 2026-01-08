import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, MessageSquare, Maximize2, Minimize2, Bot } from 'lucide-react';

interface Message {
  type: 'user' | 'bot';
  text: string;
}

const CopilotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { type: 'bot', text: 'Olá! Sou o Copilot do Gabinete. Estou conectado a toda sua base de dados. Pergunte sobre leis, demandas ou perfil de eleitores.' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setInput('');

    // Simulação de resposta da IA
    setTimeout(() => {
      let response = '';
      const lower = userMsg.toLowerCase();
      
      if (lower.includes('eleitor') || lower.includes('joão')) {
        response = 'Encontrei "João Silva" na base. É uma Liderança do bairro Jundiaí. Última interação: há 2 dias (WhatsApp). Tem interesse em "Educação".';
      } else if (lower.includes('lei') || lower.includes('projeto')) {
        response = 'O PL 123/2024 sobre "Escola Integral" está na Comissão de Constituição e Justiça. O prazo para emendas encerra amanhã.';
      } else if (lower.includes('resumo') || lower.includes('dia')) {
        response = 'Resumo do dia: 3 novos eventos na agenda, 15 demandas de infraestrutura recebidas e a meta de cadastros foi atingida (102%).';
      } else {
        response = 'Entendido. Estou analisando os dados do gabinete para te responder sobre isso...';
      }

      setMessages(prev => [...prev, { type: 'bot', text: response }]);
    }, 1000);
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* Floating Button (FAB) */}
      <button
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 z-50 p-0 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen 
            ? 'bg-slate-800 text-slate-400 rotate-90' 
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white animate-bounce-slow'
        }`}
        title="Abrir Copilot de Gabinete"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-7 h-7" />}
      </button>

      {/* Slide-over Chat Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-40 w-96 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-slate-700 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
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
          <button onClick={toggleOpen} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.type === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 shrink-0">
          
          {/* Quick Actions Chips */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            <button onClick={() => setInput('Resumo do dia')} className="whitespace-nowrap px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-800">
              Resumo do dia
            </button>
            <button onClick={() => setInput('Status PL 123')} className="whitespace-nowrap px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-800">
              Status PL
            </button>
            <button onClick={() => setInput('Buscar Eleitor')} className="whitespace-nowrap px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-800">
              Buscar Eleitor
            </button>
          </div>

          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Digite sua pergunta..."
              className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white resize-none h-12 max-h-32"
              rows={1}
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            IA treinada com dados do mandato. Pode cometer erros.
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