import React, { useEffect, useState } from 'react';
import {
    BarChart3,
    Users,
    Calendar,
    MessageSquare,
    TrendingUp,
    UserCheck
} from 'lucide-react';
import { useProductivity } from '../hooks/useProductivity';
import { useAuth } from '../contexts/AuthContext';

interface ProductivityDashboardProps {
    userId?: string;
    scope?: 'personal' | 'cabinet';
    showTitle?: boolean;
}

const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({
    userId,
    scope = 'personal',
    showTitle = true
}) => {
    const { user } = useAuth();
    const { fetchMetrics, metrics, loading, logAccess } = useProductivity();
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

    useEffect(() => {
        // Log access immediately on mount ONLY if it's the personal dashboard on the main page
        // If it's embedded in UserList (cabinet scope), we might not want to log access just for viewing the dashboard
        if (scope === 'personal') {
            logAccess();
        }
    }, [logAccess, scope]);

    useEffect(() => {
        if (scope === 'personal' && user) {
            fetchMetrics(user.id, period);
        } else if (scope === 'cabinet') {
            fetchMetrics(undefined, period); // undefined = fetch all (cabinet wide)
        } else if (userId) {
            fetchMetrics(userId, period);
        }
    }, [user, period, fetchMetrics, scope, userId]);

    // Safe access to metrics
    const loginCount = metrics?.logins || 0;
    const votersCount = metrics?.votersCreated || 0;
    const demandsCount = metrics?.demandsCreated || 0;
    const eventsCount = metrics?.eventsCreated || 0;

    const cards = [
        {
            title: 'Acessos',
            value: loginCount,
            icon: UserCheck,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            desc: period === 'day' ? 'Hoje' : period === 'week' ? 'Esta semana' : 'Este mês'
        },
        {
            title: 'Eleitores Cadastrados',
            value: votersCount,
            icon: Users,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            desc: 'Novos cadastros'
        },
        {
            title: 'Demandas Geradas',
            value: demandsCount,
            icon: MessageSquare,
            color: 'text-orange-600',
            bg: 'bg-orange-100 dark:bg-orange-900/30',
            desc: 'Solicitações abertas'
        },
        {
            title: 'Eventos Criados',
            value: eventsCount,
            icon: Calendar,
            color: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            desc: 'Agendamentos'
        }
    ];

    if (loading && !metrics) {
        return <div className="p-8 text-center text-slate-500">Carregando estatísticas...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    {scope === 'cabinet' ? 'Produtividade da Equipe' : 'Sua Produtividade'}
                </h2>
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                    {(['day', 'week', 'month'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${period === p
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            {p === 'day' ? 'Dia' : p === 'week' ? 'Semana' : 'Mês'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4" style={{ borderLeftColor: card.color.replace('text-', '').replace('-600', '-500') }}> {/* Hacky border color match */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{card.value}</h3>
                            </div>
                            <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">{card.desc}</p>
                    </div>
                ))}
            </div>

            {/* Placeholder for Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-white">Desempenho no Período</h3>
                    <BarChart3 className="w-5 h-5 text-slate-400" />
                </div>
                <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-400 text-sm">Gráfico de evolução (Em breve)</p>
                </div>
            </div>
        </div>
    );
};

export default ProductivityDashboard;
