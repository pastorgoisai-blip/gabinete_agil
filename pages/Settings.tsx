/// <reference types="vite/client" />
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  User,
  QrCode,
  MessageSquare,
  List,
  Save,
  Upload,
  Camera,
  CheckCircle,
  FileText,
  Info,
  Settings as SettingsIcon,
  Bot,
  Zap,
  Plus,
  Trash2,
  Users,
  Eye,
  EyeOff,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AgentConfiguration, AgentRule } from '../types';
import Modal from '../components/Modal';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import ChatSimulator from '../components/ChatSimulator';

const Settings: React.FC = () => {
  const { profile: authProfile } = useAuth();
  const { connectGoogle, disconnectGoogle, exchangeCodeForToken, loading: googleLoading } = useGoogleCalendar();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle Google OAuth Callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      const handleCallback = async () => {
        try {
          await exchangeCodeForToken(code);
          // Remove code from URL without reload
          window.history.replaceState({}, document.title, window.location.pathname);
          // Refresh cabinet data immediately
          await fetchCabinet();
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 5000);
        } catch (error) {
          alert("Erro ao conectar Google Calendar. Tente novamente.");
        }
      };

      handleCallback();
    }
  }, []);

  // Cabinet State
  const [cabinet, setCabinet] = useState<any>(null);
  const [loadingCabinet, setLoadingCabinet] = useState(false);

  // AI Agent State
  const [agentConfig, setAgentConfig] = useState<AgentConfiguration>({
    id: '',
    cabinet_id: '',
    agent_name: 'Assistente Virtual',
    tone: 'Empático e Acolhedor',
    welcome_message: 'Olá! Como posso ajudar?',
    is_active: true
  });
  const [rules, setRules] = useState<AgentRule[]>([]);
  const [ruleForm, setRuleForm] = useState<Partial<AgentRule>>({});
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAgentToken, setShowAgentToken] = useState(false);

  useEffect(() => {
    if (authProfile && !authProfile.is_super_admin && authProfile.role !== 'admin') {
      navigate('/');
    }
  }, [authProfile, navigate]);

  // Local Profile State (Synced with Cabinet)
  const [localProfile, setLocalProfile] = useState({
    name: '',
    party: '',
    photo: null as string | null
  });

  // Sync Local State when Cabinet loads
  useEffect(() => {
    if (cabinet) {
      setLocalProfile({
        name: cabinet.parliamentary_name || '',
        party: cabinet.parliamentary_party || '',
        photo: cabinet.parliamentary_photo || null
      });
    }
  }, [cabinet]);

  // Fetch Data
  useEffect(() => {
    if (!authProfile?.cabinet_id) return;

    fetchCabinet();
    fetchAgentConfig();
    fetchRules();
  }, [authProfile]);

  const fetchCabinet = async () => {
    setLoadingCabinet(true);
    const { data } = await supabase
      .from('cabinets')
      .select('*')
      .eq('id', authProfile?.cabinet_id)
      .single();

    if (data) setCabinet(data);
    setLoadingCabinet(false);
  };

  const fetchAgentConfig = async () => {
    const { data } = await supabase
      .from('agent_configurations')
      .select('*')
      .eq('cabinet_id', authProfile?.cabinet_id)
      .single();

    if (data) setAgentConfig(data);
  };

  const fetchRules = async () => {
    const { data } = await supabase
      .from('agent_rules')
      .select('*')
      .eq('cabinet_id', authProfile?.cabinet_id)
      .order('created_at', { ascending: false });

    if (data) setRules(data);
  };

  // Helper for uploading assets
  const uploadAsset = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('cabinet-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('cabinet-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && authProfile?.cabinet_id) {
      const previousPhoto = localProfile.photo;
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLocalProfile(prev => ({ ...prev, photo: reader.result as string }));
        };
        reader.readAsDataURL(file);

        const publicUrl = await uploadAsset(file, `profiles/${authProfile.cabinet_id}`);
        setLocalProfile(prev => ({ ...prev, photo: publicUrl }));
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Erro ao fazer upload da foto. Tente novamente.');
        setLocalProfile(prev => ({ ...prev, photo: previousPhoto }));
      }
    }
  };

  // Cabinet File State
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [footerFile, setFooterFile] = useState<File | null>(null);

  const handleCabinetUpload = (field: 'header_url' | 'footer_url', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (field === 'header_url') setHeaderFile(file);
      else setFooterFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setCabinet((prev: any) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!authProfile?.cabinet_id) return;
    try {
      const { error } = await supabase
        .from('cabinets')
        .update({
          parliamentary_name: localProfile.name,
          parliamentary_party: localProfile.party,
          parliamentary_photo: localProfile.photo
        })
        .eq('id', authProfile.cabinet_id);

      if (error) throw error;
      showToast();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erro ao salvar perfil.');
    }
  };

  const handleSaveCabinet = async () => {
    if (!cabinet || !authProfile?.cabinet_id) return;
    try {
      let finalHeaderUrl = cabinet.header_url;
      let finalFooterUrl = cabinet.footer_url;

      if (headerFile) {
        finalHeaderUrl = await uploadAsset(headerFile, `headers/${authProfile.cabinet_id}`);
      }
      if (footerFile) {
        finalFooterUrl = await uploadAsset(footerFile, `footers/${authProfile.cabinet_id}`);
      }

      const { error } = await supabase
        .from('cabinets')
        .update({
          official_name: cabinet.official_name,
          official_title: cabinet.official_title,
          header_url: finalHeaderUrl,
          footer_url: finalFooterUrl,
          use_letterhead: cabinet.use_letterhead,
          gemini_api_key: cabinet.gemini_api_key,
          openai_api_key: cabinet.openai_api_key
        })
        .eq('id', authProfile.cabinet_id);

      if (error) throw error;

      setCabinet(prev => ({
        ...prev,
        header_url: finalHeaderUrl,
        footer_url: finalFooterUrl
      }));
      setHeaderFile(null);
      setFooterFile(null);
      showToast();
    } catch (err) {
      console.error('Error updating cabinet:', err);
      alert('Erro ao salvar.');
    }
  };

  // AI Agent Handlers
  const handleSaveAgentConfig = async () => {
    if (!authProfile?.cabinet_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_configurations')
        .upsert({
          cabinet_id: authProfile.cabinet_id,
          agent_name: agentConfig.agent_name,
          tone: agentConfig.tone,
          welcome_message: agentConfig.welcome_message,
          system_prompt: agentConfig.system_prompt,
          copilot_system_prompt: agentConfig.copilot_system_prompt,
          is_active: agentConfig.is_active,
          updated_at: new Date().toISOString()
        }, { onConflict: 'cabinet_id' })
        .select()
        .single();

      if (error) throw error;
      if (data) setAgentConfig(data);
      showToast();
    } catch (err) {
      console.error('Error saving agent config:', err);
      alert('Erro ao salvar configuração do agente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    if (!authProfile?.cabinet_id || !ruleForm.keywords || !ruleForm.response_text) return;
    setLoading(true);

    const keywordsArray = Array.isArray(ruleForm.keywords)
      ? ruleForm.keywords
      : (ruleForm.keywords as string).split(',').map((k: string) => k.trim());

    try {
      const { error } = await supabase
        .from('agent_rules')
        .upsert({
          id: ruleForm.id,
          cabinet_id: authProfile.cabinet_id,
          keywords: keywordsArray,
          action_type: ruleForm.action_type || 'text_response',
          response_text: ruleForm.response_text,
          is_active: ruleForm.is_active ?? true,
        });

      if (error) throw error;

      fetchRules();
      closeModal();
      setRuleForm({});
      showToast();
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateToken = async () => {
    if (!authProfile?.cabinet_id) {
      alert('Erro: Gabinete não identificado.');
      return;
    }

    // UUID Generation Fallback
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const newToken = generateUUID();

    // Optimistic Update
    setCabinet((prev: any) => ({ ...prev, agent_access_token: newToken }));

    try {
      const { error } = await supabase
        .from('cabinets')
        .update({ agent_access_token: newToken })
        .eq('id', authProfile.cabinet_id);

      if (error) {
        console.error('Migration Column missing?', error);
        alert(`Erro no Banco: ${error.message}`);
        return;
      }

      showToast();
    } catch (err) {
      console.error('Handler error:', err);
      alert('Erro inesperado ao gerar token.');
    }
  };



  const showToast = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const openModal = (name: string, item: any = null) => {
    setActiveModal(name);
    if (name === 'newRule') {
      if (item) setRuleForm({ ...item });
      else setRuleForm({ keywords: [], action_type: 'text_response', response_text: '' });
    }
  };
  const closeModal = () => setActiveModal(null);

  const tabs = [
    { id: 'general', label: 'Geral', icon: User },
    { id: 'members', label: 'Membros', icon: Users },
    { id: 'integrations', label: 'Integrações', icon: MessageSquare }, // Moved AI keys out
    { id: 'ai', label: 'Inteligência Artificial', icon: Bot },
    { id: 'documents', label: 'Documentos', icon: FileText }, // Kept existing
    { id: 'link', label: 'Link Público', icon: QrCode }, // Kept existing
  ];

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast */}
      {showSuccess && (
        <div className="fixed top-24 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in-up">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold">Alterações salvas com sucesso!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-card text-foreground rounded-lg shadow-lg">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações do Sistema</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Personalize o comportamento do seu Gabinete Ágil.</p>
        </div>
      </div>

      <div className="bg-card dark:bg-card rounded-xl shadow-sm border border-border dark:border-border overflow-hidden">
        {/* Visual Tab Navigation */}
        <div className="p-6 pb-0">
          <div className="flex flex-wrap gap-2 p-1.5 bg-muted dark:bg-muted/50 rounded-xl border border-border dark:border-border/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 ease-in-out
                  ${activeTab === tab.id
                    ? 'bg-card dark:bg-muted text-primary-600 dark:text-foreground shadow-sm ring-1 ring-border dark:ring-border'
                    : 'text-muted-foreground dark:text-muted-foreground hover:bg-muted/50 dark:hover:bg-muted/50'
                  }
                `}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex gap-4 items-start p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg">
                <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <p className="text-sm text-primary-800 dark:text-primary-200">Estas informações são públicas e aparecerão no cabeçalho dos relatórios e na barra lateral do sistema.</p>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-muted dark:border-muted shadow-md bg-muted dark:bg-muted flex items-center justify-center">
                      {localProfile.photo ? (
                        <img src={localProfile.photo} alt="Parlamentar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-slate-400" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-primary-600 text-primary-foreground rounded-full shadow-lg hover:bg-primary-700 transition-colors border-2 border-background dark:border-background"
                      title="Alterar foto"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Foto do Perfil</span>
                </div>

                <div className="flex-1 w-full space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Nome do Político</label>
                      <input
                        className="w-full rounded-lg border-border dark:border-border bg-background dark:bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 dark:text-foreground transition-all"
                        value={localProfile.name}
                        onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Partido</label>
                      <input
                        className="w-full rounded-lg border-border dark:border-border bg-background dark:bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 dark:text-foreground transition-all"
                        placeholder="Ex: Partido Novo"
                        value={localProfile.party}
                        onChange={(e) => setLocalProfile({ ...localProfile, party: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-primary-600/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" /> Salvar Perfil
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <div className="space-y-6">
                  {/* Card Identidade */}
                  <div className="bg-card dark:bg-card border border-border dark:border-border p-4 rounded-xl space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary-600" />
                      Identidade do Parlamentar
                    </h3>
                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Nome Oficial</label>
                      <input
                        className="w-full rounded-lg border-border dark:border-border bg-background dark:bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 dark:text-foreground transition-all"
                        value={cabinet?.official_name || ''}
                        onChange={(e) => setCabinet({ ...cabinet, official_name: e.target.value })}
                        placeholder="Ex: Gabinete do Vereador João Silva"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Cargo Oficial</label>
                      <input
                        className="w-full rounded-lg border-border dark:border-border bg-background dark:bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 dark:text-foreground transition-all"
                        value={cabinet?.official_title || ''}
                        onChange={(e) => setCabinet({ ...cabinet, official_title: e.target.value })}
                        placeholder="Ex: Vereador, Presidente da Câmara, Deputado"
                      />
                    </div>
                  </div>

                  {/* Card Papel Timbrado */}
                  <div className="bg-card dark:bg-card border border-border dark:border-border p-4 rounded-xl space-y-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Papel Timbrado Digital
                    </h3>
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-muted dark:bg-muted rounded-lg">
                      <input
                        type="checkbox"
                        checked={cabinet?.use_letterhead || false}
                        onChange={(e) => setCabinet({ ...cabinet, use_letterhead: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Ativar papel timbrado digital em documentos gerados
                      </span>
                    </label>

                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Imagem do Cabeçalho (Header)</label>
                      </div>
                      <div className="flex items-center gap-4">
                        {cabinet?.header_url ? (
                          <img src={cabinet.header_url} alt="Header" className="h-16 w-auto border rounded bg-white object-contain" />
                        ) : (
                          <div className="h-16 w-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-slate-400 text-xs">Sem imagem</div>
                        )}
                        <label className="cursor-pointer bg-card dark:bg-card border border-border dark:border-border hover:bg-muted px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                          <Upload className="w-4 h-4" /> Escolher Arquivo
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCabinetUpload('header_url', e)} />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-border dark:border-border">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Imagem do Rodapé (Footer)</label>
                      </div>
                      <div className="flex items-center gap-4">
                        {cabinet?.footer_url ? (
                          <img src={cabinet.footer_url} alt="Footer" className="h-16 w-auto border rounded bg-white object-contain" />
                        ) : (
                          <div className="h-16 w-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-slate-400 text-xs">Sem imagem</div>
                        )}
                        <label className="cursor-pointer bg-card dark:bg-card border border-border dark:border-border hover:bg-muted px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                          <Upload className="w-4 h-4" /> Escolher Arquivo
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCabinetUpload('footer_url', e)} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveCabinet}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-primary-600/20 transition-colors flex items-center justify-center gap-2 mt-6"
                  >
                    <Save className="w-5 h-5" /> Salvar Configurações
                  </button>
                </div>

                {/* Preview A4 */}
                <div className="bg-muted dark:bg-muted/50 p-6 rounded-xl flex items-center justify-center border border-border dark:border-border">
                  <div
                    className="bg-white text-black shadow-2xl relative flex flex-col justify-between overflow-hidden transition-all duration-300"
                    style={{
                      width: '210mm',
                      height: '297mm',
                      transform: 'scale(0.45)',
                      transformOrigin: 'top center',
                      opacity: cabinet?.use_letterhead ? 1 : 0.7
                    }}
                  >
                    {cabinet?.header_url && (
                      <div className="w-full h-auto min-h-[50px]">
                        <img src={cabinet.header_url} className="w-full h-auto object-cover" alt="Header" />
                      </div>
                    )}
                    <div className="p-16 flex-1 text-justify">
                      <div className="text-center mb-8">
                        <h1 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-wider mb-1">{cabinet?.official_name || 'NOME DO PARLAMENTAR'}</h1>
                        <h2 className="text-lg font-serif text-gray-600 uppercase">{cabinet?.official_title || 'Cargo Oficial'}</h2>
                      </div>
                      <div className="space-y-4 text-gray-800 font-serif leading-relaxed">
                        <p>Excelentíssimo Senhor Presidente,</p>
                        <p>O <b>{cabinet?.official_title || 'Cargo'} {cabinet?.official_name || 'Nome'}</b> vem por meio deste apresentar o modelo de documento oficial...</p>
                        <p>Atenciosamente,</p>
                      </div>
                    </div>
                    {cabinet?.footer_url && (
                      <div className="w-full h-auto min-h-[30px]">
                        <img src={cabinet.footer_url} className="w-full h-auto object-cover" alt="Footer" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NEW AI TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-8 animate-fade-in">
              {/* AREA 1: CREDENCIAIS */}
              <div className="bg-card dark:bg-card border border-border dark:border-border p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-purple-600" />
                    1. Credenciais da IA
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Configure as chaves de API para habilitar o cérebro do Agente.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Google Gemini API Key</label>
                    <div className="relative">
                      <input
                        type="password"
                        className="w-full rounded-lg border-border dark:border-border bg-background dark:bg-background px-4 py-2.5 pl-10 outline-none focus:ring-2 focus:ring-purple-500 dark:text-foreground transition-all font-mono text-sm"
                        value={cabinet?.gemini_api_key || ''}
                        onChange={(e) => setCabinet({ ...cabinet, gemini_api_key: e.target.value })}
                        placeholder="sk-..."
                      />
                      <Bot className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    <p className="text-xs text-slate-500"> Necessário para o Agente Cognitivo Híbrido.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">OpenAI API Key (Opcional)</label>
                    <div className="relative">
                      <input
                        type="password"
                        className="w-full rounded-lg border-border dark:border-border bg-background dark:bg-background px-4 py-2.5 pl-10 outline-none focus:ring-2 focus:ring-green-500 dark:text-foreground transition-all font-mono text-sm"
                        value={cabinet?.openai_api_key || ''}
                        onChange={(e) => setCabinet({ ...cabinet, openai_api_key: e.target.value })}
                        placeholder="sk-..."
                      />
                      <SettingsIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                  <button onClick={handleSaveCabinet} className="w-full bg-primary-600 hover:bg-primary-700 text-primary-foreground py-2 rounded-lg font-bold">Salvar Credenciais</button>
                </div>
              </div>

              {/* AREA 1.5: CONEXÃO EXTERNA (GATEWAY) */}
              <div className="bg-card dark:bg-card border border-border dark:border-border p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    1.5 Conexão Externa (n8n / WhatsApp)
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Use este token e URL para conectar ferramentas externas ou bots ao seu gabinete em segurança.
                  </p>
                </div>

                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gateway Endpoint</label>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={`https://${import.meta.env.VITE_SUPABASE_URL ? new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0] : 'PROJECT_REF'}.supabase.co/functions/v1/agent-gateway`}
                        className="w-full bg-card dark:bg-card border border-border dark:border-border rounded px-3 py-2 text-xs font-mono text-muted-foreground dark:text-muted-foreground"
                      />
                      <button className="p-2 text-slate-500 hover:text-slate-700" title="Copiar URL" onClick={() => {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(`https://${import.meta.env.VITE_SUPABASE_URL ? new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0] : 'PROJECT_REF'}.supabase.co/functions/v1/agent-gateway`);
                          showToast();
                        } else { alert('Copie a URL manualmente.'); }
                      }}>
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Agent Access Token</label>
                    {cabinet?.agent_access_token ? (
                      <div className="flex gap-2">
                        <div className="relative w-full">
                          <input
                            readOnly
                            type={showAgentToken ? 'text' : 'password'}
                            value={cabinet.agent_access_token}
                            className="w-full bg-card dark:bg-card border border-border dark:border-border rounded px-3 py-2 text-sm font-mono text-muted-foreground dark:text-muted-foreground pr-10"
                          />
                          <button
                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                            onClick={() => setShowAgentToken(!showAgentToken)}
                            title={showAgentToken ? 'Ocultar' : 'Mostrar'}
                          >
                            {showAgentToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <button
                          onClick={async () => {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              try {
                                await navigator.clipboard.writeText(cabinet.agent_access_token);
                                showToast(); // Feedback visual
                              } catch (e) { alert('Erro ao copiar. Selecione e copie manualmente.'); }
                            } else {
                              alert('Cópia automática não suportada. Copie manualmente.');
                            }
                          }}
                          className="px-3 py-2 bg-white border border-gray-300 rounded text-slate-700 hover:bg-gray-50 text-sm font-medium"
                        >
                          Copiar
                        </button>
                        <button
                          className="px-3 py-2 bg-red-50 border border-red-200 rounded text-red-600 hover:bg-red-100 text-sm font-medium"
                          onClick={() => handleGenerateToken()}
                        >
                          Regerar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateToken()}
                        className="w-full py-2 border-2 border-dashed border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 font-bold text-sm"
                      >
                        + Gerar Token de Acesso
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* AREA 2: PERSONA */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    2. Persona do Agente
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-500 text-sm font-medium">Nome do Agente</label>
                    <input
                      className="bg-slate-50 border border-gray-200 rounded-lg px-4 py-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={agentConfig.agent_name || ''}
                      onChange={(e) => setAgentConfig({ ...agentConfig, agent_name: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-500 text-sm font-medium">Tom de Voz</label>
                    <select
                      className="bg-slate-50 border border-gray-200 rounded-lg px-4 py-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      value={agentConfig.tone || 'Empático e Acolhedor'}
                      onChange={(e) => setAgentConfig({ ...agentConfig, tone: e.target.value })}
                    >
                      <option>Empático e Acolhedor</option>
                      <option>Formal e Informativo</option>
                      <option>Energético e Motivador</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-500 text-sm font-medium">Mensagem de Boas-vindas</label>
                  <textarea
                    className="bg-slate-50 border border-gray-200 rounded-lg px-4 py-2 h-20 resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={agentConfig.welcome_message || ''}
                    onChange={(e) => setAgentConfig({ ...agentConfig, welcome_message: e.target.value })}
                  />
                </div>
              </div>

              {/* AREA 3: SIMULADOR & PROMPT AVANÇADO */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Advanced Prompt Settings */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-6">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                      <Bot className="w-5 h-5 text-purple-600" />
                      3. Cérebro da IA (Prompt de Sistema)
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Defina exatamente como a IA deve se comportar. Use variáveis como <code>{'{{politician_name}}'}</code> e <code>{'{{current_date}}'}</code>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-700 dark:text-slate-300 font-bold text-sm">Instruções do Sistema</label>
                    <textarea
                      className="w-full h-96 rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 dark:text-white font-mono text-sm leading-relaxed resize-none"
                      value={agentConfig.system_prompt || ''}
                      onChange={(e) => setAgentConfig({ ...agentConfig, system_prompt: e.target.value })}
                      placeholder="Você é um assistente..."
                    />
                    <div className="text-xs text-slate-400 flex justify-between">
                      <span>Aprox. {agentConfig.system_prompt?.length || 0} caracteres</span>
                      <span className="text-purple-500 font-bold cursor-pointer hover:underline" onClick={() => setAgentConfig({ ...agentConfig, system_prompt: "Você é um assistente virtual do gabinete do Vereador {{politician_name}}. Seu tom é {{tone}}. Hoje é {{current_date}}. Responda de forma curta e objetiva." })}>Restaurar Padrão</span>
                    </div>
                  </div>

                  <button onClick={handleSaveAgentConfig} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-all">
                    💾 Atualizar Cérebro da IA
                  </button>
                </div>

                {/* Right: Simulator */}
                <div className="flex flex-col items-center">
                  <div className="mb-4 text-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Simulador de WhatsApp</h3>
                    <p className="text-sm text-slate-500">Teste as respostas em tempo real</p>
                  </div>
                  <ChatSimulator />
                </div>
              </div>



              {/* AREA 4: CÉREBRO DO COPILOT (INTERNO) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-600" />
                    4. Cérebro do Copilot (Interno)
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Defina as instruções para o assistente *interno* do gabinete (Copilot). Este assistente tem acesso a dados sensíveis, então seja específico sobre limites.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-700 dark:text-slate-300 font-bold text-sm">Instruções do Copilot</label>
                  <textarea
                    className="w-full h-96 rounded-lg border-gray-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono text-sm leading-relaxed resize-none"
                    value={agentConfig.copilot_system_prompt || ''}
                    onChange={(e) => setAgentConfig({ ...agentConfig, copilot_system_prompt: e.target.value })}
                    placeholder="Você é o Copilot..."
                  />
                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>Aprox. {agentConfig.copilot_system_prompt?.length || 0} caracteres</span>
                    <span className="text-indigo-500 font-bold cursor-pointer hover:underline" onClick={() => setAgentConfig({ ...agentConfig, copilot_system_prompt: "You are the AI Assistant for \"Gabinete Ágil\"..." })}>Restaurar Padrão</span>
                  </div>
                </div>

                <button onClick={handleSaveAgentConfig} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
                  💾 Atualizar Cérebro do Copilot
                </button>
              </div>

              {/* AREA 5: GATILHOS (Legacy) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    5. Regras e Gatilhos
                  </h3>
                  <button
                    onClick={() => openModal('newRule')}
                    className="flex items-center gap-1 text-xs bg-primary-100 text-primary-700 font-bold uppercase rounded-full px-3 py-1"
                  >
                    <Plus className="w-4 h-4" /> Nova Regra
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2">Palavras-Chave</th>
                        <th className="px-4 py-2">Resposta</th>
                        <th className="px-4 py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {rules.map((rule) => (
                        <tr key={rule.id} className="border-b dark:border-slate-700">
                          <td className="px-4 py-3 font-medium dark:text-white">{rule.keywords.join(', ')}</td>
                          <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{rule.response_text}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleDeleteRule(rule.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {rules.length === 0 && (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">Nenhuma regra definida.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && <div className="text-center text-slate-500 py-10">Gerenciamento de Membros (Em breve)</div>}
          {activeTab === 'members' && <div className="text-center text-slate-500 py-10">Gerenciamento de Membros (Em breve)</div>}

          {activeTab === 'integrations' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Google Calendar
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Sincronize automaticamente os eventos do sistema com sua agenda pessoal.</p>
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${cabinet?.google_refresh_token ? 'bg-green-500 shadow-green-500/50 shadow-sm' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {cabinet?.google_refresh_token ? (
                        <div className="flex flex-col">
                          <span>Conectado</span>
                          {cabinet?.google_email && (
                            <span className="text-xs text-slate-500 font-normal">{cabinet.google_email}</span>
                          )}
                        </div>
                      ) : 'Não conectado'}
                    </span>
                  </div>

                  {cabinet?.google_refresh_token ? (
                    <button
                      onClick={disconnectGoogle}
                      disabled={googleLoading}
                      className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
                    >
                      {googleLoading ? 'Desconectando...' : 'Desconectar'}
                    </button>
                  ) : (
                    <button
                      onClick={connectGoogle}
                      disabled={googleLoading}
                      className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                      {googleLoading ? 'Conectando...' : 'Conectar Conta Google'}
                    </button>
                  )}
                </div>

                {!cabinet?.google_refresh_token && (
                  <p className="text-xs text-slate-400 italic">
                    * Ao conectar, você será redirecionado para o Google para autorizar o acesso à sua agenda.
                  </p>
                )}
              </div>
            </div>
          )}
          {activeTab === 'link' && <div className="text-center text-slate-500 py-10">Gerenciador de Links Públicos</div>}
        </div>
      </div>

      <Modal
        isOpen={activeModal === 'newRule'}
        onClose={closeModal}
        title="Nova Regra de Resposta"
        footer={
          <>
            <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button onClick={handleSaveRule} className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-medium">Salvar Regra</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Palavras-Chave (separadas por vírgula)</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Ex: preço, horário, endereço"
              value={Array.isArray(ruleForm.keywords) ? ruleForm.keywords.join(', ') : ruleForm.keywords}
              onChange={(e) => setRuleForm({ ...ruleForm, keywords: e.target.value.split(',') })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Resposta Automática</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
              placeholder="Digite a resposta que o agente deve enviar..."
              value={ruleForm.response_text || ''}
              onChange={(e) => setRuleForm({ ...ruleForm, response_text: e.target.value })}
            />
          </div>
        </div>
      </Modal>

    </div >
  );
};

export default Settings;