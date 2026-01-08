import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  FileText, 
  TrendingUp, 
  ArrowUp,
  List,
  Map as MapIcon,
  Cake,
  Calendar,
  Phone,
  MessageCircle,
  Zap,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Modal from '../components/Modal';

const data = [
  { name: 'Jan', value: 30 },
  { name: 'Fev', value: 45 },
  { name: 'Mar', value: 120 },
  { name: 'Abr', value: 200 },
  { name: 'Mai', value: 280 },
  { name: 'Jun', value: 390 },
];

const pieData = [
  { name: 'Manual', value: 100 },
  { name: 'Auto', value: 0 },
];

// Dados com coordenadas reais aproximadas de Anápolis-GO
const neighborhoodsData = [
  { name: 'Jundiaí', count: 46, lat: -16.3380, lng: -48.9450 },
  { name: 'Fabril', count: 39, lat: -16.3150, lng: -48.9600 },
  { name: 'Lourdes', count: 31, lat: -16.3200, lng: -48.9300 },
  { name: 'Centro', count: 28, lat: -16.3285, lng: -48.9534 },
  { name: 'Vila Góis', count: 15, lat: -16.3400, lng: -48.9600 },
];

const birthdaysData = [
  { id: 1, name: 'Dinaldo Alves de fonte', date: '16/12/2025', phone: '(62) 99171-6283', city: 'Anápolis', neighborhood: 'Ibirapuera' },
  { id: 2, name: 'Marcilene rosa Gonçalves', date: '17/12/2025', phone: '(62) 99232-9025', city: 'Anápolis', neighborhood: 'Residencial pedro ludovico' },
  { id: 3, name: 'Elias Junio Rosa de Oliveira', date: '17/12/2025', phone: '(62) 99115-6679', city: 'Anápolis', neighborhood: 'Jundiai' },
];

const COLORS = ['#2563EB', '#64748b'];

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }: any) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 transition-all hover:shadow-md hover:-translate-y-1">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black mt-2 text-slate-800 dark:text-white tracking-tight">{value}</h3>
        {trend && (
          <p className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
            <ArrowUp className="w-3 h-3" /> {trend}
          </p>
        )}
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedBirthday, setSelectedBirthday] = useState<any>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header com IA Insights - Agile Feature */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Visão Geral</h2>
            <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sistema Online
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Resumo estratégico do mandato em tempo real.</p>
        </div>
      </div>

      {/* AI Alerts Section - Making the system "Alive" */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-primary-600/20 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="p-2 bg-primary-500/20 rounded-lg border border-primary-500/30">
            <Zap className="w-5 h-5 text-primary-400" />
          </div>
          <h3 className="font-bold text-lg">Insights do Gabinete Virtual</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-400 uppercase">Prioridade Alta</span>
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-sm font-medium">3 Demandas de Saúde vencem em 24h.</p>
            <button className="text-xs text-primary-300 mt-2 hover:underline">Ver demandas &rarr;</button>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 uppercase">Oportunidade</span>
              <Cake className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-sm font-medium">15 Lideranças fazem aniversário esta semana.</p>
            <button className="text-xs text-primary-300 mt-2 hover:underline">Programar mensagens &rarr;</button>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-green-400 uppercase">Performance</span>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-sm font-medium">Agente Virtual resolveu 85% das dúvidas hoje.</p>
            <button className="text-xs text-primary-300 mt-2 hover:underline">Ver conversas &rarr;</button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Eleitores" 
          value="1.099" 
          trend="+12%" 
          icon={Users} 
          colorClass="bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400" 
        />
        <StatCard 
          title="Cobertura (Bairros)" 
          value="365" 
          icon={MapPin} 
          colorClass="bg-slate-50 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300" 
        />
        <StatCard 
          title="Demandas Ativas" 
          value="15" 
          subtext="3 Críticas"
          icon={FileText} 
          colorClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" 
        />
        <StatCard 
          title="Interações (IA)" 
          value="428" 
          trend="+5%"
          icon={MessageCircle} 
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Crescimento da Base</h3>
            <span className="text-xs text-slate-400 px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-lg">Últimos 6 meses</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563EB" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Method Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Origem dos Dados</h3>
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="h-48 w-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800 dark:text-white">100%</span>
                <span className="text-xs text-slate-400 uppercase">Manual</span>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-primary-600"></span>
                <span className="text-slate-600 dark:text-slate-300">Equipe</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <span className="text-slate-600 dark:text-slate-300">Auto-cadastro</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Neighborhoods List/Map */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <MapPin className="text-primary-600 w-5 h-5" /> Mapa de Calor (Bairros)
            </h3>
            
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow text-primary-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-600 shadow text-primary-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-3">
              {neighborhoodsData.map((bairro, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-2 rounded-lg transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors">{bairro.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-600 rounded-full" style={{ width: `${(bairro.count / 50) * 100}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{bairro.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 w-full rounded-xl overflow-hidden z-0 relative">
              <MapContainer 
                center={[-16.3285, -48.9534]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {neighborhoodsData.map((bairro, idx) => (
                  <CircleMarker 
                    key={idx}
                    center={[bairro.lat, bairro.lng]}
                    radius={Math.max(5, bairro.count / 3)}
                    fillColor="#2563eb"
                    color="#1e40af"
                    weight={1}
                    opacity={1}
                    fillOpacity={0.6}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong className="block text-sm font-bold text-slate-800">{bairro.name}</strong>
                        <span className="text-xs text-slate-600">{bairro.count} eleitores</span>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>

        {/* Birthdays */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Cake className="text-pink-500 w-5 h-5" /> Aniversariantes
            </h3>
            <button className="text-xs text-primary-600 hover:underline">Ver todos</button>
          </div>
          
          <div className="space-y-1">
            {birthdaysData.map((person) => (
              <div 
                key={person.id}
                onClick={() => setSelectedBirthday(person)}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-3 border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 text-xs font-bold">
                    {person.date.substring(0, 5)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-primary-600 transition-colors">
                      {person.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{person.neighborhood}</p>
                  </div>
                </div>
                <button className="mt-2 sm:mt-0 p-2 text-primary-600 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Birthday Modal */}
      <Modal
        isOpen={!!selectedBirthday}
        onClose={() => setSelectedBirthday(null)}
        title="Enviar Felicitações"
        footer={
          <button 
            onClick={() => setSelectedBirthday(null)}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        }
      >
        {selectedBirthday && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center p-6 bg-pink-50 dark:bg-pink-900/10 rounded-xl border border-pink-100 dark:border-pink-900/30">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4">
                <Cake className="w-10 h-10 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedBirthday.name}</h3>
              <p className="text-pink-600 dark:text-pink-400 font-medium mt-1">Aniversário: {selectedBirthday.date}</p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Escolha o modelo de mensagem:</label>
              <div className="grid grid-cols-1 gap-3">
                <button className="p-3 text-left border border-gray-200 dark:border-slate-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all">
                  <p className="text-sm text-slate-600 dark:text-slate-300">"Parabéns {selectedBirthday.name.split(' ')[0]}! Que este novo ciclo traga muitas conquistas..."</p>
                </button>
                <button className="p-3 text-left border border-gray-200 dark:border-slate-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all">
                  <p className="text-sm text-slate-600 dark:text-slate-300">"Feliz aniversário! O Gabinete Wederson Lopes deseja muita saúde..."</p>
                </button>
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all">
                <MessageCircle className="w-5 h-5" />
                Enviar pelo WhatsApp
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;