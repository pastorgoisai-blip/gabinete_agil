import React, { useState } from 'react';
import { 
  User, 
  QrCode, 
  MessageSquare, 
  List, 
  Save, 
  Upload, 
  Trash2, 
  ExternalLink, 
  Info, 
  Key, 
  Lock, 
  Phone, 
  Wifi, 
  Plus, 
  GripVertical, 
  Eye, 
  Copy,
  Download,
  Facebook,
  Instagram,
  FileText,
  Calendar,
  MapPin,
  CreditCard,
  Mail,
  Settings as SettingsIcon
} from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [profile, setProfile] = useState({ name: 'Wederson Lopes', party: '', role: '', showRole: true });

  // Fields State
  const [fields, setFields] = useState([
    { id: 'name', label: 'Nome Completo', icon: User, required: true, visible: true, locked: true },
    { id: 'phone', label: 'Telefone (WhatsApp)', icon: Phone, required: true, visible: true },
    { id: 'email', label: 'E-mail', icon: Mail, required: false, visible: true },
  ]);

  const tabs = [
    { id: 'profile', label: 'Perfil do Mandato', icon: User },
    { id: 'twilio', label: 'Integrações (API)', icon: MessageSquare },
    { id: 'fields', label: 'Personalizar CRM', icon: List },
    { id: 'link', label: 'Link Público', icon: QrCode },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
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
                <p className="text-sm text-primary-800 dark:text-primary-200">Estas informações são públicas e aparecerão no cabeçalho dos relatórios e na página de auto-cadastro do eleitor.</p>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Nome do Político</label>
                    <input 
                      className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all" 
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Partido</label>
                    <input 
                      className="w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all" 
                      placeholder="Ex: Partido Novo"
                      value={profile.party}
                      onChange={(e) => setProfile({...profile, party: e.target.value})}
                    />
                  </div>
                </div>
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-primary-600/20 transition-colors flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" /> Salvar Perfil
                </button>
              </div>
            </div>
          )}
          
          {/* Other tabs simplified for brevity but maintaining structure */}
          {activeTab === 'twilio' && <div className="text-center text-slate-500 py-10">Configurações de API (WhatsApp/SMS)</div>}
          {activeTab === 'fields' && <div className="text-center text-slate-500 py-10">Personalização de Campos do CRM</div>}
          {activeTab === 'link' && <div className="text-center text-slate-500 py-10">Gerenciador de Links Públicos e QR Code</div>}
        </div>
      </div>
    </div>
  );
};

export default Settings;