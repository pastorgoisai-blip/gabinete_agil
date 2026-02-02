import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  AlertCircle,
  Timer,
  Smile,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Mic,
  Send,
  Check,
  CheckCheck,
  ArrowLeft,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AgentConversation, AgentMessage, AgentConfiguration } from '../types';

const Agent: React.FC = () => {
  const { profile } = useAuth();
  const [config, setConfig] = useState<AgentConfiguration | null>(null);
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AgentConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Load Config
  useEffect(() => {
    if (profile?.cabinet_id) {
      fetchConfig();
      fetchConversations();
      subscribeToConversations();
    }
  }, [profile?.cabinet_id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch Messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      subscribeToMessages(selectedConversation.id);
      setIsMobileChatOpen(true);
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConfig = async () => {
    const { data } = await supabase.from('agent_configurations').select('*').eq('cabinet_id', profile?.cabinet_id).single();
    if (data) setConfig(data);
  };

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('cabinet_id', profile?.cabinet_id)
      .order('last_message_at', { ascending: false });
    if (data) setConversations(data);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel('agent_conversations_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_conversations', filter: `cabinet_id=eq.${profile?.cabinet_id}` },
        () => fetchConversations()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`agent_messages_${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as AgentMessage]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    // Optimistic Update
    const tempId = 'temp-' + Date.now();
    const tempMsg: AgentMessage = {
      id: tempId,
      conversation_id: selectedConversation.id,
      sender_type: 'agent', // Human agent (user)
      content: newMessage,
      created_at: new Date().toISOString()
    };

    // We don't add optimistic here because subscription will catch it fast enough usually, 
    // or we can add it and dedup later. For simplicity let's rely on DB response or Sub.

    setNewMessage('');

    const { error } = await supabase.from('agent_messages').insert({
      conversation_id: selectedConversation.id,
      sender_type: 'agent', // Acting as the agent/human
      content: tempMsg.content
    });

    if (error) console.error('Error sending:', error);

    // Update last_message_at for conversation
    await supabase.from('agent_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', selectedConversation.id);
  };

  const toggleAgentActive = async () => {
    if (!config) return;
    const newState = !config.is_active;
    setConfig({ ...config, is_active: newState });
    await supabase.from('agent_configurations').update({ is_active: newState }).eq('id', config.id);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(c =>
    c.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.external_id.includes(searchTerm)
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4 animate-fade-in">
      {/* Header Stats - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
        <div className="bg-white dark:bg-card/60 backdrop-blur-sm p-4 rounded-xl border border-gray-200 dark:border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Ativas</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{conversations.length}</p>
          </div>
          <MessageSquare className="w-8 h-8 text-primary-200 dark:text-primary-900" />
        </div>
        <div className="bg-white dark:bg-card/60 backdrop-blur-sm p-4 rounded-xl border border-gray-200 dark:border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Status IA</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-3 h-3 rounded-full ${config?.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium dark:text-white">{config?.is_active ? 'Online' : 'Pausado'}</span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={config?.is_active || false} onChange={toggleAgentActive} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
          </label>
        </div>
        {/* Placeholder Stats */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hidden md:flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Tempo Médio</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">1.2m</p>
          </div>
          <Timer className="w-8 h-8 text-orange-200" />
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hidden md:flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">Satisfação</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">4.9</p>
          </div>
          <Smile className="w-8 h-8 text-yellow-200" />
        </div>
      </div>

      {/* Main Console Area */}
      <div className="flex-1 bg-white dark:bg-background/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-border shadow-xl overflow-hidden flex relative">

        {/* Sidebar (Conversations List) */}
        <div className={`w-full md:w-[350px] lg:w-[400px] border-r border-gray-200 dark:border-slate-700 flex flex-col ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          {/* Sidebar Header */}
          <div className="p-4 bg-gray-50 dark:bg-card border-b border-gray-200 dark:border-border flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.name}&background=random`} className="w-10 h-10 rounded-full" alt="Profile" />
              <span className="font-bold text-slate-700 dark:text-white truncate max-w-[150px]">{profile?.name}</span>
            </div>
            <div className="flex gap-2 text-slate-500">
              <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"><MessageSquare className="w-5 h-5" /></button>
              <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"><MoreVertical className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar conversa..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-green-500 dark:text-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-100 dark:border-slate-800 transition-colors ${selectedConversation?.id === conv.id ? 'bg-gray-100 dark:bg-slate-800' : ''}`}
              >
                <div className="relative">
                  <img src={`https://ui-avatars.com/api/?name=${conv.user_name || 'User'}&background=random`} className="w-12 h-12 rounded-full" alt="User" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{conv.user_name || conv.external_id}</h3>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{formatTime(conv.last_message_at)}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    {/* Mocking read receipt for now */}
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                    {conv.platform === 'whatsapp' ? 'Via WhatsApp' : 'Via Web'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className={`flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] ${isMobileChatOpen ? 'flex' : 'hidden md:flex'} absolute inset-0 md:static z-20`}>

            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-card border-b border-gray-200 dark:border-border shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileChatOpen(false)} className="md:hidden text-slate-600 dark:text-white">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <img src={`https://ui-avatars.com/api/?name=${selectedConversation.user_name || 'User'}&background=random`} className="w-10 h-10 rounded-full" alt="Avatar" />
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-white">{selectedConversation.user_name || selectedConversation.external_id}</h2>
                  <p className="text-xs text-slate-500">online hoje às {formatTime(selectedConversation.last_message_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <Search className="w-5 h-5 cursor-pointer hover:text-slate-700" />
                <Paperclip className="w-5 h-5 cursor-pointer hover:text-slate-700" />
                <MoreVertical className="w-5 h-5 cursor-pointer hover:text-slate-700" />
              </div>
            </div>

            {/* Messages Background */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 relative" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode: 'overlay' }}>
              <div className="absolute inset-0 bg-[#efeae2] dark:bg-[#0b141a] opacity-90 -z-10 bg-repeat"></div>

              {messages.map((msg, idx) => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] sm:max-w-[60%] rounded-lg px-3 py-2 text-sm shadow-sm relative group
                                ${msg.sender_type === 'agent'
                      ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-tl-none'}`}
                  >
                    <p className="mb-1 leading-relaxed">{msg.content}</p>
                    <div className="flex justify-end items-center gap-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-300">{formatTime(msg.created_at)}</span>
                      {msg.sender_type === 'agent' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Footer / Input */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800 flex items-end gap-2">
              <button className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><Smile className="w-6 h-6" /></button>
              <button className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><Paperclip className="w-6 h-6" /></button>
              <div className="flex-1 bg-white dark:bg-slate-700 rounded-lg px-4 py-2 border border-gray-200 dark:border-slate-600 focus-within:ring-1 focus-within:ring-green-500">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Digite uma mensagem"
                  className="w-full max-h-32 bg-transparent border-none focus:ring-0 resize-none text-sm dark:text-white"
                  rows={1}
                />
              </div>
              {newMessage.trim() ? (
                <button onClick={handleSendMessage} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-transform hover:scale-105">
                  <Send className="w-5 h-5 pl-0.5" />
                </button>
              ) : (
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                  <Mic className="w-6 h-6" />
                </button>
              )}
            </div>

          </div>
        ) : (
          /* Empty State */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-background border-b-8 border-green-500">
            <div className="max-w-md text-center p-8">
              <div className="w-64 h-64 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8 flex items-center justify-center animate-pulse">
                <Phone className="w-32 h-32 text-slate-400 dark:text-slate-500 opacity-50" />
              </div>
              <h1 className="text-3xl font-light text-slate-700 dark:text-slate-200 mb-4">Gabinete Ágil Web</h1>
              <p className="text-slate-500 dark:text-slate-400">
                Envie e receba mensagens sem precisar manter seu celular conectado.
                <br />
                Use o Gabinete Ágil em até 4 dispositivos simultaneamente.
              </p>
              <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-sm">
                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                Protegido com criptografia de ponta a ponta
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agent;