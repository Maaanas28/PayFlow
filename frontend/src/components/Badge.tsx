import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';

export type BadgeVariant =
  | 'neutral'
  | 'gain'
  | 'loss'
  | 'warn'
  | 'info'
  | 'live'
  | 'simulated'
  | 'historical';

interface GenericBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<GenericBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 font-medium tracking-wider',
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  const variantStyles = {
    neutral: 'bg-[#141b27] text-slate-300 border border-[#1e293b]',
    gain: 'bg-[#062419] text-emerald-400 border border-[#0d5c3a]',
    loss: 'bg-[#2a0e14] text-rose-400 border border-[#6b1d28]',
    warn: 'bg-[#291a03] text-amber-400 border border-[#6e4606]',
    info: 'bg-[#091b2e] text-sky-400 border border-[#144368]',
    live: 'bg-[#052e16] text-emerald-400 border border-[#10b981]/40 font-mono font-bold',
    simulated: 'bg-[#291a03] text-amber-400 border border-[#f59e0b]/40 font-mono font-bold',
    historical: 'bg-[#0f172a] text-slate-300 border border-[#334155] font-mono',
  };

  const dotColors = {
    neutral: 'bg-slate-400',
    gain: 'bg-emerald-400',
    loss: 'bg-rose-400',
    warn: 'bg-amber-400',
    info: 'bg-sky-400',
    live: 'bg-emerald-400 animate-pulse',
    simulated: 'bg-amber-400',
    historical: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm uppercase tracking-wide font-mono ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normalized = status.toUpperCase();
  const isSm = size === 'sm';

  const baseClasses = `inline-flex items-center space-x-1.5 font-mono font-bold rounded-sm border uppercase tracking-wider ${
    isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  }`;

  switch (normalized) {
    case 'SUCCEEDED':
    case 'COMPLETED':
    case 'DELIVERED':
      return (
        <span className={`${baseClasses} bg-[#062419] text-emerald-400 border-[#0d5c3a]`}>
          <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>{normalized}</span>
        </span>
      );

    case 'FAILED':
      return (
        <span className={`${baseClasses} bg-[#2a0e14] text-rose-400 border-[#6b1d28]`}>
          <XCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>{normalized}</span>
        </span>
      );

    case 'PROCESSING':
    case 'PENDING':
      return (
        <span className={`${baseClasses} bg-[#091b2e] text-sky-400 border-[#144368]`}>
          <Loader2 className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin`} />
          <span>{normalized}</span>
        </span>
      );

    case 'UNCERTAIN':
      return (
        <span className={`${baseClasses} bg-[#291a03] text-amber-300 border-[#6e4606] animate-pulse`}>
          <AlertTriangle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>{normalized}</span>
        </span>
      );

    case 'CREATED':
      return (
        <span className={`${baseClasses} bg-[#141b27] text-slate-300 border-[#1e293b]`}>
          <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>{normalized}</span>
        </span>
      );

    case 'DEBIT':
      return (
        <span className={`${baseClasses} bg-[#091b2e] text-sky-400 border-[#144368]`}>
          <ArrowDownLeft className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>DEBIT</span>
        </span>
      );

    case 'CREDIT':
      return (
        <span className={`${baseClasses} bg-[#062419] text-emerald-400 border-[#0d5c3a]`}>
          <ArrowUpRight className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>CREDIT</span>
        </span>
      );

    default:
      return (
        <span className={`${baseClasses} bg-[#101520] text-slate-300 border-[#182030]`}>
          <span>{status}</span>
        </span>
      );
  }
};
