import React from 'react';
import { ArrowUp, LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: LucideIcon;
    colorClass: string;
    trend?: string | null;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, icon: Icon, colorClass, trend }) => (
    <div className="bg-white dark:bg-card/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-border transition-all hover:shadow-md hover:-translate-y-1">
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

export default StatCard;
