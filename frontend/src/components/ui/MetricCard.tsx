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
    default: 'hover:border-[rgba(160,140,255,0.35)]',
    critical: 'border-[rgba(255,113,138,0.4)] bg-[rgba(255,113,138,0.06)] shadow-[0_0_15px_rgba(255,113,138,0.15)]',
    warning: 'border-[rgba(245,198,107,0.4)] bg-[rgba(245,198,107,0.06)] shadow-[0_0_15px_rgba(245,198,107,0.15)]',
    success: 'border-[rgba(53,214,160,0.4)] bg-[rgba(53,214,160,0.06)] shadow-[0_0_15px_rgba(53,214,160,0.15)]',
  };

  return (
    <div
      className={clsx(
        'p-5 glass-card transition-all duration-200 relative group overflow-hidden',
        borderHighlight[statusVariant]
      )}
    >
      {/* Subtle top glow bar for premium depth */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9875ff]/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#a6a4c3] uppercase tracking-wider">{title}</span>
        {icon && (
          <span className="text-[#9875ff] p-2 bg-[#7957e8]/10 rounded-lg border border-[rgba(160,140,255,0.15)] shadow-sm">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight text-[#f4f2ff] font-mono drop-shadow-sm">
          {value}
        </span>
        {badge}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 flex items-center text-xs text-[#a6a4c3] gap-2">
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center font-medium font-mono text-[11px] px-1.5 py-0.5 rounded',
                trend.isNeutral
                  ? 'text-[#a6a4c3] bg-white/5'
                  : trend.isPositive
                  ? 'text-[#35d6a0] bg-[#35d6a0]/10 border border-[#35d6a0]/20'
                  : 'text-[#ff718a] bg-[#ff718a]/10 border border-[#ff718a]/20'
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
          {subtitle && <span className="text-[11px] text-[#a6a4c3]/90">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
