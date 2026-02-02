import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
  CheckCircle2,
  BookOpen
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

// Dados estáticos para gráficos que ainda não têm histórico no banco
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

const COLORS = ['#2563EB', '#64748b'];

import StatCard from '../components/StatCard';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedBirthday, setSelectedBirthday] = useState<any>(null);

  // States para dados reais
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    voters: 0,
    demands: 0,
    activeDemands: 0,
    matters: 0,
    events: 0,
    neighborhoodsCovered: 0
  });
  const [topNeighborhoods, setTopNeighborhoods] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.cabinet_id) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Contagens Totais
      const votersCount = await supabase.from('voters').select('*', { count: 'exact', head: true });
      const mattersCount = await supabase.from('legislative_matters').select('*', { count: 'exact', head: true });
      const demandsTotal = await supabase.from('demands').select('*', { count: 'exact', head: true });
      const activeDemands = await supabase.from('demands').select('*', { count: 'exact', head: true }).eq('status', 'Pendente'); // PENDENTE como exemplo de 'ativa'
      const eventsCount = await supabase.from('events').select('*', { count: 'exact', head: true });

      // 2. Bairros (Agrupamento via JS pois Supabase Client não faz Group By nativo facilmente sem RPC)
      // Trazendo apenas a coluna neighborhood de todos os voters
      const { data: votersData } = await supabase.from('voters').select('neighborhood').not('neighborhood', 'is', null);

      const neighborhoodMap = new Map();
      votersData?.forEach((v: any) => {
        if (v.neighborhood) {
          const count = neighborhoodMap.get(v.neighborhood) || 0;
          neighborhoodMap.set(v.neighborhood, count + 1);
        }
      });

      const neighborhoodList = Array.from(neighborhoodMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          // Coordenadas ficticias para demo do mapa se não tiver geocoding real
          lat: -16.3285 + (Math.random() - 0.5) * 0.05,
          lng: -48.9534 + (Math.random() - 0.5) * 0.05
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 3. Aniversariantes do Mês
      const currentMonth = new Date().getMonth() + 1;
      // Note: Filtrar por mês em campo DATE no Supabase pode requerer psql extensions ou filter manual
      // Vamos tentar filter manual no client para este MVP se a base não for gigante,
      // ou usar query específica se possível. 
      // Workaround: Trazer voters com birth_date não nulo e filtrar js
      const { data: bdayData } = await supabase
        .from('voters')
        .select('*')
        .not('birth_date', 'is', null)
        .order('birth_date');

      const monthBirthdays = bdayData?.filter((v: any) => {
        if (!v.birth_date) return false;
        const month = new Date(v.birth_date).getMonth() + 1; // getMonth é 0-index
        return month === currentMonth;
      }).map((v: any) => ({
        ...v,
        date: new Date(v.birth_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      })) || [];


      setStats({
        voters: votersCount.count || 0,
        demands: demandsTotal.count || 0,
        activeDemands: activeDemands.count || 0,
        matters: mattersCount.count || 0,
        events: eventsCount.count || 0,
        neighborhoodsCovered: neighborhoodMap.size
      });

      setTopNeighborhoods(neighborhoodList);
      setBirthdays(monthBirthdays.slice(0, 5)); // Apenas top 5

    } catch (error) {
      console.error('Erro ao carregar dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header com IA Insights - Agile Feature */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-foreground">Visão Geral</h2>
            <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sistema Online
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Resumo do Gabinete: {profile?.cabinet_id ? 'Conectado' : 'Carregando...'}
          </p>
        </div>
      </div>

      {/* AI Alerts Section - Making the system "Alive" */}
      <div className="bg-[#061a19] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
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
            <p className="text-sm font-medium">{stats.activeDemands} Demandas pendentes de atenção.</p>
            <button className="text-xs text-primary-300 mt-2 hover:underline">Ver demandas &rarr;</button>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 uppercase">Oportunidade</span>
              <Cake className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-sm font-medium">{birthdays.length} Aniversariantes este mês.</p>
            <button className="text-xs text-primary-300 mt-2 hover:underline">Programar mensagens &rarr;</button>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-green-400 uppercase">Performance</span>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-sm font-medium">Você cadastrou {stats.matters} matérias legislativas.</p>
            <button className="text-xs text-primary-300 mt-2 hover:underline">Ver produção &rarr;</button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Eleitores"
          value={loading ? "..." : stats.voters}
          trend={null}
          icon={Users}
          colorClass="bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
        />
        <StatCard
          title="Cobertura (Bairros)"
          value={loading ? "..." : stats.neighborhoodsCovered}
          icon={MapPin}
          colorClass="bg-slate-50 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300"
        />
        <StatCard
          title="Matérias Legislativas"
          value={loading ? "..." : stats.matters}
          subtext="Projetos e Requerimentos"
          icon={BookOpen}
          colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
        <StatCard
          title="Demandas Totais"
          value={loading ? "..." : stats.demands}
          subtext={`${stats.activeDemands} Pendentes`}
          icon={FileText}
          colorClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart */}
        <div className="lg:col-span-2 bg-card/60 dark:bg-card/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-border dark:border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-foreground">Crescimento da Base</h3>
            <span className="text-xs text-slate-400 px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-lg">Demo (Dados Estáticos)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
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
        <div className="bg-card/60 dark:bg-card/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-border dark:border-border flex flex-col">
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
        <div className="bg-card/60 dark:bg-card/60 backdrop-blur-sm rounded-2xl shadow-sm border border-border dark:border-border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <MapPin className="text-primary-600 w-5 h-5" /> Mapa de Calor (Top 5 Bairros)
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
              {topNeighborhoods.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum dado de localização encontrado.</p>
              ) : topNeighborhoods.map((bairro, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-border dark:border-border last:border-0 hover:bg-muted dark:hover:bg-muted/50 px-2 rounded-lg transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors">{bairro.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-600 rounded-full" style={{ width: `${(bairro.count / (topNeighborhoods[0]?.count || 1)) * 100}%` }}></div>
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
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {topNeighborhoods.map((bairro, idx) => (
                  <CircleMarker
                    key={idx}
                    center={[bairro.lat, bairro.lng]}
                    radius={Math.max(5, (bairro.count * 2))}
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
        <div className="bg-card/60 dark:bg-card/60 backdrop-blur-sm rounded-2xl shadow-sm border border-border dark:border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Cake className="text-pink-500 w-5 h-5" /> Aniversariantes do Mês
            </h3>
            <button className="text-xs text-primary-600 hover:underline">Ver todos</button>
          </div>

          <div className="space-y-1">
            {birthdays.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum aniversariante encontrado neste mês.</p>
            ) : birthdays.map((person) => (
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">{person.neighborhood || 'Bairro não inf.'}</p>
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
              <div className="w-20 h-20 bg-card dark:bg-card rounded-full flex items-center justify-center shadow-sm mb-4">
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
                  <p className="text-sm text-slate-600 dark:text-slate-300">"Feliz aniversário! O Gabinete deseja muita saúde..."</p>
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