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
  Phone,
  Mail,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { profile, updateProfile } = useProfile();
  const { profile: authProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [showSuccess, setShowSuccess] = useState(false);

  // Cabinet State
  const [cabinet, setCabinet] = useState<any>(null);
  const [loadingCabinet, setLoadingCabinet] = useState(false);

  useEffect(() => {
    if (authProfile && !authProfile.is_super_admin && authProfile.role !== 'admin') {
      navigate('/');
    }
  }, [authProfile, navigate]);

  // Local Profile State
  const [localProfile, setLocalProfile] = useState({
    name: '',
    party: '',
    photo: null as string | null
  });

  useEffect(() => {
    setLocalProfile({
      name: profile.name,
      party: profile.party,
      photo: profile.photo
    });
  }, [profile]);

  // Fetch Cabinet
  useEffect(() => {
    const fetchCabinet = async () => {
      if (!authProfile?.cabinet_id) return;
      setLoadingCabinet(true);
      const { data, error } = await supabase
        .from('cabinets')
        .select('*')
        .eq('id', authProfile.cabinet_id)
        .single();

      if (data) setCabinet(data);
      setLoadingCabinet(false);
    };
    fetchCabinet();
  }, [authProfile]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalProfile(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCabinetUpload = (field: 'header_url' | 'footer_url', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCabinet((prev: any) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateProfile(localProfile);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSaveCabinet = async () => {
    if (!cabinet || !authProfile?.cabinet_id) return;
    try {
      const { error } = await supabase
        .from('cabinets')
        .update({
          official_name: cabinet.official_name,
          header_url: cabinet.header_url,
          footer_url: cabinet.footer_url
        })
        .eq('id', authProfile.cabinet_id);

      if (error) throw error;
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating cabinet:', err);
      alert('Erro ao atualizar identidade visual.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil do Parlamentar', icon: User },
    { id: 'visual', label: 'Identidade Visual', icon: FileText },
    { id: 'twilio', label: 'Integrações (API)', icon: MessageSquare },
    { id: 'fields', label: 'Personalizar CRM', icon: List },
    { id: 'link', label: 'Link Público', icon: QrCode },
  ];

  return (
    <div className="space-y-6 animate-fade-in relative">

      {/* Toast de Sucesso */}
      {showSuccess && (
        <div className="fixed top-24 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in-up">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold">Alterações salvas com sucesso!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-800 text-white rounded-lg shadow-lg">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações do Sistema</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Personalize o comportamento do seu Gabinete Ágil.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">

        {/* Visual Tab Navigation */}
        <div className="p-6 pb-0">
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 ease-in-out
                  ${activeTab === tab.id
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
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
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex gap-4 items-start p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg">
                <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <p className="text-sm text-primary-800 dark:text-primary-200">Estas informações são públicas e aparecerão no cabeçalho dos relatórios e na barra lateral do sistema.</p>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-700 shadow-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                      {localProfile.photo ? (
                        <img src={localProfile.photo} alt="Parlamentar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-slate-400" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors border-2 border-white dark:border-slate-800"
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
                        className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all"
                        value={localProfile.name}
                        onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Partido</label>
                      <input
                        className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all"
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

          {/* VISUAL IDENTITY TAB */}
          {activeTab === 'visual' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Nome Oficial do Gabinete</label>
                    <input
                      className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all"
                      value={cabinet?.official_name || ''}
                      onChange={(e) => setCabinet({ ...cabinet, official_name: e.target.value })}
                      placeholder="Ex: Gabinete do Vereador João Silva"
                    />
                    <p className="text-xs text-slate-500">Aparecerá nos documentos oficiais.</p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Cabeçalho (Header)</h3>
                    <div className="flex items-center gap-4">
                      {cabinet?.header_url ? (
                        <img src={cabinet.header_url} alt="Header" className="h-20 w-auto border rounded" />
                      ) : (
                        <div className="h-20 w-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-slate-400 text-sm">Sem imagem</div>
                      )}
                      <label className="cursor-pointer bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Alterar
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCabinetUpload('header_url', e)} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Rodapé (Footer)</h3>
                    <div className="flex items-center gap-4">
                      {cabinet?.footer_url ? (
                        <img src={cabinet.footer_url} alt="Footer" className="h-20 w-auto border rounded" />
                      ) : (
                        <div className="h-20 w-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-slate-400 text-sm">Sem imagem</div>
                      )}
                      <label className="cursor-pointer bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Alterar
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCabinetUpload('footer_url', e)} />
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveCabinet}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-primary-600/20 transition-colors flex items-center justify-center gap-2 mt-6"
                  >
                    <Save className="w-5 h-5" /> Salvar Identidade Visual
                  </button>
                </div>

                {/* Preview A4 */}
                <div className="bg-gray-100 dark:bg-slate-900 p-6 rounded-xl flex items-center justify-center">
                  <div
                    className="bg-white text-black shadow-xl relative flex flex-col justify-between overflow-hidden"
                    style={{ width: '210mm', height: '297mm', transform: 'scale(0.4)', transformOrigin: 'top center' }}
                  >
                    {/* Header Preview */}
                    {cabinet?.header_url && (
                      <img src={cabinet.header_url} className="absolute top-0 left-0 w-full h-auto max-h-[150px] object-contain" alt="Header" />
                    )}

                    <div className="p-16 mt-20 text-justify">
                      <h1 className="text-2xl font-bold text-center mb-4">{cabinet?.official_name || 'Nome do Gabinete'}</h1>
                      <p className="mb-4">Este é um exemplo de visualização do documento com a identidade visual aplicada.</p>
                      <p>O cabeçalho ficará fixo no topo e o rodapé na parte inferior da página.</p>
                      <br />
                      <p className="text-gray-400">[Conteúdo do Documento...]</p>
                    </div>

                    {/* Footer Preview */}
                    {cabinet?.footer_url && (
                      <img src={cabinet.footer_url} className="absolute bottom-0 left-0 w-full h-auto max-h-[100px] object-contain" alt="Footer" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'twilio' && <div className="text-center text-slate-500 py-10">Configurações de API (WhatsApp/SMS)</div>}
          {activeTab === 'fields' && <div className="text-center text-slate-500 py-10">Personalização de Campos do CRM</div>}
          {activeTab === 'link' && <div className="text-center text-slate-500 py-10">Gerenciador de Links Públicos e QR Code</div>}
        </div>
      </div>
    </div>
  );
};

export default Settings;