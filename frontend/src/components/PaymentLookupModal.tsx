import React, { useState } from 'react';
import { X, Search, Loader2, AlertCircle, Terminal } from 'lucide-react';
import { api } from '../services/api';
import { PaymentAttempt } from '../types';
import { StatusBadge } from './Badge';

interface PaymentLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentLookupModal: React.FC<PaymentLookupModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentAttempt | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const data = await api.getPayment(query.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Payment not found in database');
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (minorUnits: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(minorUnits / 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0d131f] w-full max-w-xl rounded-sm p-5 sm:p-6 border border-[#1b253b] shadow-2xl relative font-mono text-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#182030]">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              PAYMENT AUDIT & TELEMETRY TERMINAL
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-slate-400 hover:text-white hover:bg-[#121824] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="mt-4">
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
            Enter Payment Attempt ID (UUID) or Reference (e.g. <span className="text-cyan-400 font-mono">pay_...</span>)
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. pay_1729420000000_abc123"
              className="flex-1 bg-[#101520] border border-[#182030] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-sm text-xs flex items-center space-x-1.5 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Inspect</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-[#2a0e14] border border-[#6b1d28] rounded-sm flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 rounded-sm bg-[#101520] border border-[#182030] text-xs font-mono space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#182030]">
              <span className="text-slate-400">PAYMENT STATUS:</span>
              <StatusBadge status={result.status} size="sm" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">REFERENCE:</span>
              <span className="text-cyan-400 select-all font-bold">{result.paymentReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ORDER ID:</span>
              <span className="text-slate-200 select-all">{result.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AMOUNT:</span>
              <span className="text-emerald-400 font-bold tabular-nums">
                {formatINR(result.amountMinor)} ({result.amountMinor} paise)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">OUTCOME:</span>
              <span className="text-slate-300">{result.simulatedOutcome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">PROVIDER:</span>
              <span className="text-slate-300">{result.provider}</span>
            </div>
            {result.failureReason && (
              <div className="flex justify-between text-rose-400">
                <span>FAILURE REASON:</span>
                <span>{result.failureReason}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
