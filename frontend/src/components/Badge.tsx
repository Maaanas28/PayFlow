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
    neutral: 'bg-black text-neutral-300 border border-neutral-850',
    gain: 'bg-neutral-950 text-white border border-neutral-700',
    loss: 'bg-neutral-950 text-neutral-400 border border-neutral-800',
    warn: 'bg-neutral-950 text-neutral-300 border border-neutral-800',
    info: 'bg-neutral-950 text-neutral-200 border border-neutral-800',
    live: 'bg-neutral-950 text-white border border-neutral-700 font-mono font-bold',
    simulated: 'bg-neutral-950 text-neutral-400 border border-neutral-800 font-mono font-bold',
    historical: 'bg-black text-neutral-500 border border-neutral-850 font-mono',
  };

  const dotColors = {
    neutral: 'bg-neutral-500',
    gain: 'bg-white',
    loss: 'bg-neutral-500',
    warn: 'bg-neutral-400',
    info: 'bg-neutral-300',
    live: 'bg-white animate-pulse',
    simulated: 'bg-neutral-500',
    historical: 'bg-neutral-600',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded uppercase tracking-wide font-mono ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
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

  const baseClasses = `inline-flex items-center space-x-1.5 font-mono font-bold rounded border uppercase tracking-wider ${
    isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  }`;

  switch (normalized) {
    case 'SUCCEEDED':
    case 'COMPLETED':
    case 'DELIVERED':
      return (
        <span className={`${baseClasses} bg-neutral-950 text-white border-neutral-700`}>
          <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>{normalized}</span>
        </span>
      );

    case 'FAILED':
      return (
        <span className={`${baseClasses} bg-black text-neutral-400 border-neutral-800`}>
          <XCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>{normalized}</span>
        </span>
      );

    case 'PROCESSING':
    case 'PENDING':
      return (
        <span className={`${baseClasses} bg-neutral-950 text-neutral-300 border-neutral-800`}>
          <Loader2 className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin`} />
          <span>{normalized}</span>
        </span>
      );

    case 'UNCERTAIN':
      return (
        <span className={`${baseClasses} bg-black text-white border-neutral-700 animate-pulse`}>
          <AlertTriangle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>{normalized}</span>
        </span>
      );

    case 'CREATED':
      return (
        <span className={`${baseClasses} bg-black text-neutral-400 border-neutral-850`}>
          <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>{normalized}</span>
        </span>
      );

    case 'DEBIT':
      return (
        <span className={`${baseClasses} bg-neutral-950 text-neutral-300 border-neutral-800`}>
          <ArrowDownLeft className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>DEBIT</span>
        </span>
      );

    case 'CREDIT':
      return (
        <span className={`${baseClasses} bg-neutral-950 text-white border-neutral-700`}>
          <ArrowUpRight className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          <span>CREDIT</span>
        </span>
      );

    default:
      return (
        <span className={`${baseClasses} bg-black text-neutral-400 border-neutral-850`}>
          <span>{status}</span>
        </span>
      );
  }
};
