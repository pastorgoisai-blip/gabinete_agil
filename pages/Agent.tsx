import React, { useState, useRef, useEffect } from 'react';
import {
  Save,
  MessageSquare,
  AlertCircle,
  Timer,
  Smile,
  Share2,
  MoreVertical,
  Bot,
  Plus,
  Filter,
  Construction,
  Zap,
  Activity,
  CheckCircle,
  X,
  Settings,
  Phone,
  Mail,
  Trash2,
  Send,
  User,
  Sparkles,
  Search,
  FileText,
  Users,
  Paperclip
} from 'lucide-react';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AgentConfiguration, AgentRule, AgentChannel, AgentConversation, AgentMessage } from '../types';

const Agent: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Placeholder for unimplemented features
  const handleSave = () => {
    alert('Funcionalidade sendo implementada...');
    closeModal();
  };

  // Agent Config State
  const [config, setConfig] = useState<AgentConfiguration>({
    id: '',
    cabinet_id: '',
    agent_name: 'Assistente Virtual',
    tone: 'Empático e Acolhedor',
    welcome_message: 'Olá! Como posso ajudar?',
    is_active: true
  });

  // Load Configuration
  useEffect(() => {
    if (profile?.cabinet_id) {
      fetchConfig();
    }
  }, [profile?.cabinet_id]);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('cabinet_id', profile?.cabinet_id)
        .single();

      if (data) {
        setConfig(data);
      } else if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is fine for new setup
        console.error('Error fetching config:', error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveConfig = async () => {
    if (!profile?.cabinet_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_configurations')
        .upsert({
          cabinet_id: profile.cabinet_id,
          agent_name: config.agent_name,
          tone: config.tone,
          welcome_message: config.welcome_message,
          is_active: config.is_active,
          updated_at: new Date().toISOString()
        }, { onConflict: 'cabinet_id' })
        .select()
        .single();

      if (error) throw error;
      if (data) setConfig(data);

      closeModal();
      alert('Configurações salvas com sucesso!'); // In real app use toast
    } catch (err) {
      console.error('Error saving config:', err);
      alert('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentActive = async () => {
    const newState = !config.is_active;
    setConfig(prev => ({ ...prev, is_active: newState }));

    // Auto-save toggle
    if (config.id) { // Only if exists
      await supabase
        .from('agent_configurations')
        .update({ is_active: newState })
        .eq('id', config.id);
    }
  };

  // Channels State
  const [channels, setChannels] = useState<AgentChannel[]>([]);
  const [channelForm, setChannelForm] = useState<Partial<AgentChannel>>({});

  useEffect(() => {
    if (profile?.cabinet_id) {
      fetchConfig();
      fetchRules();
      fetchChannels();
      fetchConversations();
    }
  }, [profile?.cabinet_id]);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_channels')
        .select('*')
        .eq('cabinet_id', profile?.cabinet_id);

      if (data) setChannels(data);
    } catch (err) { console.error(err); }
  };

  const handleSaveChannel = async () => {
    if (!profile?.cabinet_id || !channelForm.type) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('agent_channels')
        .upsert({
          id: channelForm.id,
          cabinet_id: profile.cabinet_id,
          type: channelForm.type,
          name: channelForm.name,
          status: 'connected', // Assume connected on save for now
          credentials: channelForm.credentials || {},
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      fetchChannels();
      closeModal();
      alert('Integração salva com sucesso!');
    } catch (err) {
      console.error('Error saving channel:', err);
      alert('Erro ao salvar integração.');
    } finally {
      setLoading(false);
    }
  };

  // Rules State
  const [rules, setRules] = useState<AgentRule[]>([]);
  const [ruleForm, setRuleForm] = useState<Partial<AgentRule>>({});

  useEffect(() => {
    // ... (This useEffect is redundant now as I merged it above, but keeping for structure if needed or removing)
  }, []); // Removing the redundant useEffect call below in logic

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_rules')
        .select('*')
        .eq('cabinet_id', profile?.cabinet_id)
        .order('created_at', { ascending: false });

      if (data) setRules(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRule = async () => {
    if (!profile?.cabinet_id || !ruleForm.keywords || !ruleForm.response_text) return;
    setLoading(true);

    // Parse keywords if string (from input) or use array
    let keywordsArray = Array.isArray(ruleForm.keywords)
      ? ruleForm.keywords
      : (ruleForm.keywords as string).split(',').map((k: string) => k.trim());

    try {
      const { data, error } = await supabase
        .from('agent_rules')
        .upsert({
          id: ruleForm.id, // If exists, update
          cabinet_id: profile.cabinet_id,
          keywords: keywordsArray,
          action_type: ruleForm.action_type || 'text_response',
          response_text: ruleForm.response_text,
          is_active: ruleForm.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;

      fetchRules(); // Refresh list
      closeModal();
      setRuleForm({});
    } catch (err) {
      console.error('Error saving rule:', err);
      alert('Erro ao salvar regra.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;

    try {
      await supabase.from('agent_rules').delete().eq('id', id);
      fetchRules();
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  // Conversations State
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [activeConversationMessages, setActiveConversationMessages] = useState<AgentMessage[]>([]);

  useEffect(() => {
    if (profile?.cabinet_id) {
      fetchConfig();
      fetchRules();
      fetchConversations();
    }
  }, [profile?.cabinet_id]);

  // Realtime subscription could be added here later

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_conversations')
        .select('*')
        .eq('cabinet_id', profile?.cabinet_id)
        .order('last_message_at', { ascending: false });

      if (data) setConversations(data);
    } catch (err) { console.error(err); }
  };

  const handleSelectConversation = async (conversation: AgentConversation) => {
    setSelectedItem(conversation);
    setActiveModal('chatDetails');
    setActiveConversationMessages([]); // Clear previous

    try {
      const { data, error } = await supabase
        .from('agent_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (data) setActiveConversationMessages(data);
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedItem?.id) return;

    // Optimistic UI update could be done here

    try {
      const { error } = await supabase
        .from('agent_messages')
        .insert({
          conversation_id: selectedItem.id,
          sender_type: 'agent', // Human agent answering via dashboard
          content: chatMessage
        });

      if (error) throw error;

      setChatMessage('');
      // Refresh messages
      const { data } = await supabase
        .from('agent_messages')
        .select('*')
        .eq('conversation_id', selectedItem.id)
        .order('created_at', { ascending: true });

      if (data) setActiveConversationMessages(data);

    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // State for Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Chat Input State (External Chat Monitor)
  const [chatMessage, setChatMessage] = useState('');

  const openModal = (modalName: string, item: any = null) => {
    setActiveModal(modalName);
    setSelectedItem(item);

    if (modalName === 'editIntegration') {
      // If editing an existing channel from the list (item is AgentChannel)
      // Or if clicking the mock "WhatsApp" button, we might need to find if it exists or create new default
      if (item && item.id) {
        setChannelForm({ ...item });
      } else {
        // Default for new/mock
        const type = item?.name?.toLowerCase().includes('whatsapp') ? 'whatsapp' : 'instagram';
        // Try to find existing channel of this type
        const existing = channels.find(c => c.type === type);
        if (existing) {
          setChannelForm({ ...existing });
        } else {
          setChannelForm({
            type: type,
            name: item?.name || 'WhatsApp',
            credentials: { api_key: '', webhook_url: 'https://api.camaramanager.com/webhook/wa' }
          });
        }
      }
    }

    // ... existing rule logic
    if (modalName === 'newRule') {
      if (item) {
        setRuleForm({ ...item });
      } else {
        setRuleForm({ keywords: [], action_type: 'text_response', response_text: '' });
      }
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
  };

  // Mock Data
  const demand1 = { title: 'Reparo Asfalto', location: 'Rua das Flores, 123 - Centro', type: 'Infraestrutura', desc: 'Relato de buraco perigoso na via principal atrapalhando o trânsito.', status: 'Pendente', priority: 'Alta' };
  const demand2 = { title: 'Falta de Remédio', location: 'UBS Vila Nova', type: 'Saúde', desc: 'Medicamento para pressão em falta há 2 semanas.', status: 'Em Análise', priority: 'Média' };

  // Mock Chat Messages
  const mockMessages = [
    { id: 1, sender: 'user', text: 'Olá, gostaria de saber sobre as propostas para a educação.', time: '12:40' },
    { id: 2, sender: 'agent', text: 'Olá! Sou o assistente virtual do vereador. Temos um projeto focado na reforma das escolas municipais e ampliação do horário integral. Gostaria de receber o PDF com detalhes?', time: '12:40' },
    { id: 3, sender: 'user', text: 'Sim, por favor. O projeto inclui a escola do bairro Vila Nova?', time: '12:41' },
    { id: 4, sender: 'agent', text: 'Sim! A Escola Municipal Vila Nova está na lista prioritária para reforma da quadra e biblioteca.', time: '12:42' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-slate-700 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Configuração do Agente 24h</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Gerencie as respostas automáticas para a população e monitore atendimentos em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={config.is_active}
              onChange={toggleAgentActive}
              className="sr-only peer"
            />
            <div className="relative w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
            <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              {config.is_active ? 'Agente Ativo' : 'Agente Pausado'}
            </span>
          </label>
          <button
            onClick={() => openModal('saveConfig')}
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-all shadow-lg shadow-primary-900/20"
          >
            <Save className="w-5 h-5" />
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Conversas Ativas</p>
            <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-slate-900 dark:text-white leading-none">124</p>
            <p className="text-green-500 text-xs font-medium mb-1">+12% hoje</p>
          </div>
        </div>
        {/* Stat 2 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Demandas Hoje</p>
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-slate-900 dark:text-white leading-none">38</p>
            <p className="text-green-500 text-xs font-medium mb-1">+5% vs. ontem</p>
          </div>
        </div>
        {/* Stat 3 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Tempo Resposta</p>
            <Timer className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-slate-900 dark:text-white leading-none">1.2s</p>
            <p className="text-orange-500 text-xs font-medium mb-1">-0.3s melhoria</p>
          </div>
        </div>
        {/* Stat 4 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Satisfação</p>
            <Smile className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-slate-900 dark:text-white leading-none">98%</p>
            <p className="text-slate-400 text-xs font-medium mb-1">estável</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Column (Config) */}
        <div className="xl:col-span-2 space-y-6 order-2 xl:order-1">

          {/* Status & Integrations */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-slate-400" />
                Status e Integrações
              </h2>
              <button
                onClick={() => openModal('addChannel')}
                className="text-xs text-primary-600 dark:text-primary-400 font-bold uppercase hover:underline"
              >
                Adicionar Canal
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {/* WhatsApp */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                    <svg fill="currentColor" height="20" viewBox="0 0 16 16" width="20"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592z"></path></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">WhatsApp Business API</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Conectado como: +55 62 99999-9999</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-400/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 ring-1 ring-inset ring-green-600/20 dark:ring-green-400/20">Online</span>
                  <button
                    onClick={() => openModal('editIntegration', { name: 'WhatsApp Business API' })}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* Instagram */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500">
                    <svg fill="currentColor" height="20" viewBox="0 0 16 16" width="20"><path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.486-.276a2.478 2.478 0 0 1-.919-.598 2.48 2.48 0 0 1-.599-.919c-.11-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.094-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Instagram Direct</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Página: @wedersonlopes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-400/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 ring-1 ring-inset ring-green-600/20 dark:ring-green-400/20">Online</span>
                  <button
                    onClick={() => openModal('editIntegration', { name: 'Instagram Direct' })}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Personality */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-slate-400" />
                Personalidade e Comportamento
              </h2>
            </div>
            <div className="p-5 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-slate-500 dark:text-slate-400 text-sm font-medium">Nome do Agente</label>
                  <input
                    className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    type="text"
                    value={config.agent_name || ''}
                    onChange={(e) => setConfig({ ...config, agent_name: e.target.value })}
                    placeholder="Ex: Assistente Virtual"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-500 dark:text-slate-400 text-sm font-medium">Tom de Voz</label>
                  <select
                    className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    value={config.tone || 'Empático e Acolhedor'}
                    onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                  >
                    <option>Empático e Acolhedor</option>
                    <option>Formal e Informativo</option>
                    <option>Energético e Motivador</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-slate-500 dark:text-slate-400 text-sm font-medium">Mensagem de Boas-vindas</label>
                <textarea
                  className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all h-24 resize-none leading-relaxed"
                  value={config.welcome_message || ''}
                  onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                  placeholder="Olá! Sou o assistente virtual..."
                />
                <p className="text-slate-400 text-xs">Esta mensagem será enviada no início de cada nova conversa.</p>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-slate-400" />
                Regras e Gatilhos
              </h2>
              <button
                onClick={() => openModal('newRule')}
                className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-bold uppercase hover:underline bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-full border border-primary-100 dark:border-primary-800 transition-all"
              >
                <Plus className="w-4 h-4" />
                Nova Regra
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
                  <tr>
                    <th className="px-5 py-3 border-b border-gray-200 dark:border-slate-700">Palavra-Chave</th>
                    <th className="px-5 py-3 border-b border-gray-200 dark:border-slate-700">Ação / Resposta</th>
                    <th className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-500">
                        Nenhuma regra definida ainda.
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule) => (
                      <tr
                        key={rule.id}
                        className="group hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                        onClick={() => openModal('newRule', rule)}
                      >
                        <td className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 font-medium text-slate-900 dark:text-white">
                          {rule.keywords.map(k => `"${k}"`).join(', ')}
                        </td>
                        <td className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {rule.action_type === 'text_response' ? rule.response_text : `Ação: ${rule.action_type}`}
                        </td>
                        <td className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 text-right">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${rule.is_active ? 'bg-green-50 text-green-600 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/20' : 'bg-gray-50 text-gray-600 ring-gray-600/20 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20'}`}>
                            {rule.is_active ? 'Ativo' : 'Pausado'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Monitoring) */}
        <div className="xl:col-span-1 space-y-6 order-1 xl:order-2">

          {/* Live Conversations */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col h-[450px] shadow-sm">
            <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Conversas Ao Vivo
              </h2>
              <button
                onClick={() => openModal('filters')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
              {conversations.length === 0 ? (
                <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma conversa iniciada.</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedItem?.id === conv.id ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'hover:bg-gray-50 dark:hover:bg-slate-700 border-transparent hover:border-gray-200 dark:hover:border-slate-600'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-slate-900 dark:text-white font-semibold text-sm">{conv.user_name || conv.external_id}</p>
                      <span className="text-[10px] text-slate-400">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-1">
                      {conv.platform} - {conv.status}
                    </p>
                    {conv.tags && conv.tags.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {conv.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="inline-flex items-center rounded bg-blue-50 dark:bg-blue-400/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-400/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-slate-700 text-center">
              <button
                onClick={() => openModal('allConversations')}
                className="text-sm text-primary-600 dark:text-primary-400 font-bold hover:underline"
              >
                Ver todas as conversas
              </button>
            </div>
          </div>

          {/* Recent Demands Widget */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col shadow-sm">
            <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-orange-50 dark:bg-orange-900/10">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Construction className="w-5 h-5 text-orange-500" />
                Demandas Recentes
              </h2>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-500 p-2 rounded-lg shrink-0">
                  <Construction className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-900 dark:text-white text-sm font-bold">{demand1.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{demand1.location}</p>
                  <button
                    onClick={() => openModal('demandDetails', demand1)}
                    className="text-xs text-primary-600 dark:text-primary-400 cursor-pointer hover:underline mt-1 text-left"
                  >
                    Ver Detalhes &gt;
                  </button>
                </div>
              </div>
              <div className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 p-2 rounded-lg shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-900 dark:text-white text-sm font-bold">{demand2.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{demand2.location}</p>
                  <button
                    onClick={() => openModal('demandDetails', demand2)}
                    className="text-xs text-primary-600 dark:text-primary-400 cursor-pointer hover:underline mt-1 text-left"
                  >
                    Ver Detalhes &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Save Config Modal */}
      <Modal
        isOpen={activeModal === 'saveConfig'}
        onClose={closeModal}
        title="Salvar Configurações"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
            <button onClick={handleSaveConfig} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-50">
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center p-4">
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Salvar alterações?</h3>
          <p className="text-slate-500 dark:text-slate-400">
            As configurações do agente serão atualizadas em tempo real para todos os canais conectados.
          </p>
        </div>
      </Modal>

      {/* Add Channel Modal */}
      <Modal
        isOpen={activeModal === 'addChannel'}
        onClose={closeModal}
        title="Adicionar Canal"
        footer={<button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Fechar</button>}
      >
        <div className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white">Telegram</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white">Messenger</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white">E-mail</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center mb-3">
              <Phone className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white">SMS</span>
          </button>
        </div>
      </Modal>

      {/* Edit Integration Modal */}
      <Modal
        isOpen={activeModal === 'editIntegration'}
        onClose={closeModal}
        title={`Configurar ${channelForm.name || 'Integração'}`}
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
            <button onClick={handleSaveChannel} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Key / Token</label>
            <input
              type="password"
              value={(channelForm.credentials as any)?.api_key || ''}
              onChange={(e) => setChannelForm({
                ...channelForm,
                credentials: { ...channelForm.credentials, api_key: e.target.value }
              })}
              placeholder="Cole seu token aqui"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Webhook URL</label>
            <input
              type="text"
              value={(channelForm.credentials as any)?.webhook_url || ''}
              onChange={(e) => setChannelForm({
                ...channelForm,
                credentials: { ...channelForm.credentials, webhook_url: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-slate-500"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status da Conexão</span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${channelForm.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {channelForm.id ? 'Conectado' : 'Não Configurado'}
            </span>
          </div>
          {channelForm.id && (
            <button className="text-red-500 text-sm font-medium hover:underline flex items-center gap-1 mt-2">
              <Trash2 className="w-4 h-4" /> Desconectar Integração
            </button>
          )}
        </div>
      </Modal>

      {/* Filters Modal */}
      <Modal
        isOpen={activeModal === 'filters'}
        onClose={closeModal}
        title="Filtrar Conversas"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Limpar</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm">Aplicar Filtros</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Status</h4>
            <div className="flex gap-2 flex-wrap">
              <button className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium">Abertas</button>
              <button className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">Fechadas</button>
              <button className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">Pendentes</button>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Canal</h4>
            <div className="flex gap-2 flex-wrap">
              <button className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">WhatsApp</button>
              <button className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">Instagram</button>
              <button className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">Facebook</button>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Prioridade</h4>
            <div className="flex gap-2 flex-wrap">
              <button className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">Alta</button>
              <button className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">Média</button>
              <button className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">Baixa</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* All Conversations Modal (Mock) */}
      <Modal
        isOpen={activeModal === 'allConversations'}
        onClose={closeModal}
        title="Todas as Conversas"
        footer={<button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Fechar</button>}
      >
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Usuário {i}</p>
                <p className="text-xs text-slate-500">Última mensagem: Olá, gostaria de saber sobre...</p>
              </div>
              <span className="text-xs text-slate-400">10 min</span>
            </div>
          ))}
          <p className="text-center text-xs text-slate-400 pt-2">Carregando mais...</p>
        </div>
      </Modal>

      {/* Chat Details Modal */}
      <Modal
        isOpen={activeModal === 'chatDetails'}
        onClose={closeModal}
        title={`Conversa com ${selectedItem?.user_name || selectedItem?.external_id || 'Usuário'}`}
        footer={null}
      >
        <div className="flex flex-col h-[60vh] -mx-6 -my-6">
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900/30">
            {activeConversationMessages.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-10">Nenhuma mensagem nesta conversa.</div>
            )}

            {activeConversationMessages.map(msg => (
              <div key={msg.id} className={`flex w-full ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[80%] p-3 rounded-xl text-sm shadow-sm
                  ${msg.sender_type === 'agent'
                    ? 'bg-primary-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-none'
                  }
                `}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${msg.sender_type === 'agent' ? 'text-primary-100' : 'text-slate-400'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Area */}
          <div className="p-3 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite uma mensagem..."
                className="flex-1 bg-gray-100 dark:bg-slate-900 border-0 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white"
              />
              <button
                onClick={handleSendMessage}
                className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                disabled={!chatMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Demand Details Modal */}
      <Modal
        isOpen={activeModal === 'demandDetails'}
        onClose={closeModal}
        title="Detalhes da Demanda"
        footer={<button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Fechar</button>}
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 rounded-lg">
              <h4 className="text-lg font-bold text-orange-800 dark:text-orange-400 mb-1">{selectedItem.title}</h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">{selectedItem.type}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Localização</label>
                <p className="text-sm text-slate-900 dark:text-white">{selectedItem.location}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Prioridade</label>
                <p className="text-sm text-slate-900 dark:text-white">{selectedItem.priority}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedItem.desc}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Status Atual</label>
              <div className="mt-1 inline-flex px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                {selectedItem.status}
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Agent;