import React, { useState } from 'react';
import { X, Search, Loader2, AlertCircle, Terminal } from 'lucide-react';
import { api } from '../services/api';
import { PaymentAttempt } from '../types';

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
      setError(err.message || 'Payment not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">Payment Audit & Retrieval</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="mt-4">
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Enter Payment Attempt ID (UUID) or Reference (e.g. <span className="text-teal-400 font-mono">pay_...</span>)
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. pay_1729420000000_abc123"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-400 font-mono"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Inspect</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-sans">Payment Status:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  result.status === 'SUCCEEDED'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {result.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Reference:</span>
              <span className="text-teal-400 select-all">{result.paymentReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Amount:</span>
              <span className="text-white">
                ₹{(result.amountMinor / 100).toFixed(2)} ({result.amountMinor} minor)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Order ID:</span>
              <span className="text-slate-300 select-all">{result.orderId}</span>
            </div>
            {result.failureReason && (
              <div className="flex justify-between text-rose-400">
                <span className="font-sans">Failure Reason:</span>
                <span>{result.failureReason}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span className="font-sans">Created At:</span>
              <span>{new Date(result.createdAt).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
