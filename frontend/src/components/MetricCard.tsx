import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';
import { Badge, BadgeVariant } from './Badge';

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subvalue?: string;
  change?: number;
  changePercent?: number;
  status?: 'gain' | 'loss' | 'warn' | 'neutral';
  badgeText?: string;
  badgeVariant?: BadgeVariant;
  icon?: LucideIcon;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subvalue,
  change,
  changePercent,
  status = 'neutral',
  badgeText,
  badgeVariant,
  icon: Icon,
  className = '',
}) => {
  const isPositive = status === 'gain' || (changePercent !== undefined && changePercent > 0);
  const isNegative = status === 'loss' || (changePercent !== undefined && changePercent < 0);

  const statusColor = isPositive
    ? 'text-white'
    : isNegative
    ? 'text-neutral-400'
    : status === 'warn'
    ? 'text-neutral-300'
    : 'text-neutral-400';

  return (
    <div
      className={`bg-[#050505] border border-neutral-850 hover:border-neutral-800 p-4 rounded-md transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 font-mono flex items-center gap-1.5">
          {label}
        </span>
        {badgeText && (
          <Badge
            variant={badgeVariant || (isPositive ? 'gain' : isNegative ? 'loss' : 'neutral')}
            size="xs"
          >
            {badgeText}
          </Badge>
        )}
        {Icon && <Icon className="w-4 h-4 text-neutral-500" />}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
          {value}
        </div>
      </div>

      {(subvalue || change !== undefined || changePercent !== undefined) && (
        <div className="mt-2 flex items-center gap-2 text-xs font-mono tabular-nums">
          {changePercent !== undefined && (
            <span className={`inline-flex items-center gap-0.5 font-medium ${statusColor}`}>
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : isNegative ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              {change !== undefined ? `${change > 0 ? '+' : ''}${change} ` : ''}
              ({changePercent > 0 ? '+' : ''}{changePercent}%)
            </span>
          )}
          {subvalue && <span className="text-slate-500">{subvalue}</span>}
        </div>
      )}
    </div>
  );
};
