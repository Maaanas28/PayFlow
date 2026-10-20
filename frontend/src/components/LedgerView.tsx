import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  RefreshCw,
  Scale,
  CheckCircle2,
  Copy,
  Check,
  Filter,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { LedgerTransaction } from '../types';
import { api } from '../services/api';
import { StatusBadge } from './Badge';

interface LedgerViewProps {
  initialPaymentId?: string;
  onNavigateToCheckout: () => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  initialPaymentId,
  onNavigateToCheckout,
}) => {
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (initialPaymentId) {
      setFilterType('PAYMENT_CAPTURE');
    }
  }, [initialPaymentId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLedgerTransactions(100);
      setTransactions(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load ledger transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatINR = (minorUnits: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(minorUnits / 100);
  };

  // Compute Total Debits and Total Credits across all transactions
  let cumulativeDebits = 0;
  let cumulativeCredits = 0;

  transactions.forEach((tx) => {
    tx.entries.forEach((e) => {
      if (e.direction === 'DEBIT') cumulativeDebits += e.amountMinor;
      if (e.direction === 'CREDIT') cumulativeCredits += e.amountMinor;
    });
  });

  const isGloballyBalanced = cumulativeDebits === cumulativeCredits;

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.referenceType.toUpperCase() === filterType.toUpperCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <BookOpen className="w-6 h-6 text-teal-400" />
            <span>Double-Entry General Ledger</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable, balanced double-entry accounting records where every debit has an exact equal credit.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Explanation Banner */}
      <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs sm:text-sm text-teal-200 flex items-start space-x-3">
        <Scale className="w-5 h-5 flex-shrink-0 mt-0.5 text-teal-400" />
        <div className="space-y-1">
          <p className="font-bold text-white">Mathematical Invariant: Balanced Double-Entry Bookkeeping</p>
          <p className="text-teal-300/80 leading-relaxed text-xs">
            Every transaction committed to the PayFlow ledger consists of balanced paired entries:{' '}
            <strong className="text-white">Customer Funds</strong> and{' '}
            <strong className="text-white">Merchant Settlement</strong> accounts. Floating-point arithmetic is strictly forbidden; all amounts are stored as integer minor units (paise).
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Transactions</span>
          <span className="text-2xl font-mono font-extrabold text-white">{transactions.length}</span>
          <span className="block text-[11px] text-slate-500 mt-0.5">Immutable audit events</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Ledger Debits</span>
          <span className="text-2xl font-mono font-extrabold text-sky-400">
            {formatINR(cumulativeDebits)}
          </span>
          <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
            {cumulativeDebits} paise
          </span>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Ledger Credits</span>
          <span className="text-2xl font-mono font-extrabold text-emerald-400">
            {formatINR(cumulativeCredits)}
          </span>
          <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
            {cumulativeCredits} paise
          </span>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Ledger Integrity</span>
          <span
            className={`text-base font-semibold flex items-center space-x-1.5 mt-1 ${
              isGloballyBalanced ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isGloballyBalanced ? '100% Balanced' : 'Mismatch Detected'}</span>
          </span>
          <span className="block text-[11px] text-slate-500 mt-0.5 font-mono">
            Σ Debits === Σ Credits
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Reference Filter:</span>
        </span>
        {['ALL', 'PAYMENT_CAPTURE', 'REFUND'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === type
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {type === 'ALL' ? 'All Transactions' : type}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-3 text-rose-300 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Ledger Transactions Accordion / Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="glass-panel rounded-2xl p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-teal-400" />
            <span>Verifying ledger integrity from PostgreSQL...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="glass-panel rounded-2xl p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
            <BookOpen className="w-8 h-8 text-slate-600" />
            <div>
              <p className="font-semibold text-slate-300">No ledger transactions posted yet</p>
              <p className="text-xs text-slate-500 mt-1">
                When a payment is captured or refunded, its paired double-entry records will appear here.
              </p>
            </div>
            <button
              onClick={onNavigateToCheckout}
              className="mt-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Go to Checkout
            </button>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const txDebits = tx.entries
              .filter((e) => e.direction === 'DEBIT')
              .reduce((sum, e) => sum + e.amountMinor, 0);
            const txCredits = tx.entries
              .filter((e) => e.direction === 'CREDIT')
              .reduce((sum, e) => sum + e.amountMinor, 0);
            const isBalanced = txDebits === txCredits;

            return (
              <div
                key={tx.id}
                className="glass-panel rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4 hover:border-slate-700/80 transition-all"
              >
                {/* Transaction Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                          tx.referenceType === 'PAYMENT_CAPTURE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}
                      >
                        {tx.referenceType}
                      </span>
                      <span className="font-mono text-xs font-bold text-white select-all">
                        Ref ID: {tx.referenceId}
                      </span>
                      <button
                        onClick={() => handleCopy(tx.referenceId, tx.id)}
                        className="text-slate-500 hover:text-white p-0.5"
                      >
                        {copiedKey === tx.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">{tx.description}</p>
                  </div>

                  {/* Balanced Badge & Timestamp */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-right gap-1">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full border ${
                        isBalanced
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>
                        Balanced: {formatINR(txDebits)} = {formatINR(txCredits)}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(tx.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Paired Entries Table */}
                <div className="overflow-x-auto rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                        <th className="py-2.5 px-4">Account Type</th>
                        <th className="py-2.5 px-4">Direction</th>
                        <th className="py-2.5 px-4 text-right">Amount (INR)</th>
                        <th className="py-2.5 px-4 text-right font-mono">Paise</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {tx.entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-800/20">
                          <td className="py-2.5 px-4 font-sans font-semibold text-slate-200">
                            {entry.accountType}
                          </td>
                          <td className="py-2.5 px-4">
                            <StatusBadge status={entry.direction} />
                          </td>
                          <td
                            className={`py-2.5 px-4 text-right font-bold ${
                              entry.direction === 'DEBIT' ? 'text-sky-400' : 'text-emerald-400'
                            }`}
                          >
                            {entry.direction === 'DEBIT' ? '-' : '+'}
                            {formatINR(entry.amountMinor)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-500">
                            {entry.amountMinor}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
