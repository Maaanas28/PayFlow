import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const normalized = status.toUpperCase();
  const isSm = size === 'sm';

  const baseClasses = `inline-flex items-center space-x-1.5 font-semibold rounded-full border ${
    isSm ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  }`;

  switch (normalized) {
    case 'SUCCEEDED':
    case 'COMPLETED':
    case 'DELIVERED':
      return (
        <span className={`${baseClasses} bg-emerald-500/10 text-emerald-400 border-emerald-500/30`}>
          <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />
          <span>{normalized}</span>
        </span>
      );

    case 'FAILED':
      return (
        <span className={`${baseClasses} bg-rose-500/10 text-rose-400 border-rose-500/30`}>
          <XCircle className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />
          <span>{normalized}</span>
        </span>
      );

    case 'PROCESSING':
    case 'PENDING':
      return (
        <span className={`${baseClasses} bg-sky-500/10 text-sky-400 border-sky-500/30`}>
          <Loader2 className={`${isSm ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
          <span>{normalized}</span>
        </span>
      );

    case 'UNCERTAIN':
      return (
        <span className={`${baseClasses} bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse`}>
          <AlertTriangle className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />
          <span>{normalized}</span>
        </span>
      );

    case 'CREATED':
      return (
        <span className={`${baseClasses} bg-slate-500/15 text-slate-300 border-slate-500/30`}>
          <Clock className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />
          <span>{normalized}</span>
        </span>
      );

    case 'DEBIT':
      return (
        <span className={`${baseClasses} bg-sky-500/10 text-sky-400 border-sky-500/30 font-mono`}>
          <ArrowDownLeft className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />
          <span>DEBIT</span>
        </span>
      );

    case 'CREDIT':
      return (
        <span className={`${baseClasses} bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono`}>
          <ArrowUpRight className={isSm ? 'w-3 h-3' : 'w-4 h-4'} />
          <span>CREDIT</span>
        </span>
      );

    default:
      return (
        <span className={`${baseClasses} bg-slate-800 text-slate-300 border-slate-700`}>
          <span>{status}</span>
        </span>
      );
  }
};
