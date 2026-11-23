import React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  statusVariant?: 'default' | 'critical' | 'warning' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  badge,
  statusVariant = 'default',
}) => {
  const borderHighlight = {
    default: 'hover:border-slate-300',
    critical: 'border-rose-200 bg-rose-50/20',
    warning: 'border-amber-200 bg-amber-50/20',
    success: 'border-emerald-200 bg-emerald-50/20',
  };

  return (
    <div
      className={clsx(
        'p-5 bg-white border border-slate-200/90 rounded-lg shadow-sm transition-all',
        borderHighlight[statusVariant]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && <span className="text-slate-400 p-1.5 bg-slate-50 rounded-md border border-slate-100">{icon}</span>}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">{value}</span>
        {badge}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center text-xs text-slate-500 gap-2">
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center font-medium font-mono text-[11px]',
                trend.isNeutral
                  ? 'text-slate-600'
                  : trend.isPositive
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              )}
            >
              {trend.isNeutral ? (
                <Minus className="w-3 h-3 mr-0.5" />
              ) : trend.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-0.5" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-0.5" />
              )}
              {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
