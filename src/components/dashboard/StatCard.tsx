import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'emerald' | 'amber' | 'cacao' | 'blue' | 'purple' | 'red';
  badge?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'emerald',
  badge,
  onClick,
}) => {
  const colorMap = {
    emerald: {
      bgIcon: 'bg-emerald-100 text-emerald-700',
      border: 'hover:border-emerald-300',
      accent: 'text-emerald-700',
    },
    amber: {
      bgIcon: 'bg-amber-100 text-amber-700',
      border: 'hover:border-amber-300',
      accent: 'text-amber-700',
    },
    cacao: {
      bgIcon: 'bg-cacao-100 text-cacao-700',
      border: 'hover:border-cacao-300',
      accent: 'text-cacao-800',
    },
    blue: {
      bgIcon: 'bg-blue-100 text-blue-700',
      border: 'hover:border-blue-300',
      accent: 'text-blue-700',
    },
    purple: {
      bgIcon: 'bg-purple-100 text-purple-700',
      border: 'hover:border-purple-300',
      accent: 'text-purple-700',
    },
    red: {
      bgIcon: 'bg-rose-100 text-rose-700',
      border: 'hover:border-rose-300',
      accent: 'text-rose-700',
    },
  }[color];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card transition-all duration-200 hover:shadow-soft ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 ' + colorMap.border : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${colorMap.bgIcon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {badge && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};
