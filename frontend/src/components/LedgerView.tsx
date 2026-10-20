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
  Database,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { LedgerTransaction } from '../types';
import { api } from '../services/api';
import { StatusBadge, Badge } from './Badge';
import { MetricCard } from './MetricCard';

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
      maximumFractionDigits: 2,
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
    <div className="space-y-5">
      {/* Top Header Command Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#182030]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight font-mono uppercase flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>DOUBLE-ENTRY GENERAL LEDGER</span>
            </h2>
            <Badge variant="live" size="xs">
              {transactions.length} POSTED
            </Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Immutable, balanced double-entry accounting records where every debit has an exact equal credit
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3 py-1.5 bg-[#151e2f] hover:bg-[#1c283f] text-slate-200 border border-[#23304b] rounded-sm text-xs font-mono font-medium transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Sync Journal</span>
        </button>
      </div>

      {/* Institutional Explainer Banner */}
      <div className="p-3.5 rounded-sm bg-[#0d131f] border border-[#1b253b] text-xs font-mono flex items-start space-x-3">
        <Scale className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400" />
        <div className="space-y-1">
          <p className="font-bold text-white uppercase tracking-wider text-[11px]">
            MATHEMATICAL INVARIANT: BALANCED DOUBLE-ENTRY BOOKKEEPING
          </p>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Every journal event committed to PostgreSQL guarantees balanced paired entries between{' '}
            <strong className="text-slate-200">Customer Funds</strong> and{' '}
            <strong className="text-slate-200">Merchant Settlement</strong> accounts. Floating-point arithmetic is strictly forbidden; all amounts are tracked in integer paise (₹1.00 = 100).
          </p>
        </div>
      </div>

      {/* Finance OS Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Journal Records"
          value={transactions.length}
          subvalue="Immutable audit events"
          badgeText="PERSISTED"
          badgeVariant="neutral"
          icon={Database}
        />
        <MetricCard
          label="Cumulative Ledger Debits"
          value={formatINR(cumulativeDebits)}
          subvalue={`${cumulativeDebits.toLocaleString()} paise`}
          badgeText="DEBITS"
          badgeVariant="info"
          icon={ArrowDownLeft}
        />
        <MetricCard
          label="Cumulative Ledger Credits"
          value={formatINR(cumulativeCredits)}
          subvalue={`${cumulativeCredits.toLocaleString()} paise`}
          badgeText="CREDITS"
          badgeVariant="gain"
          icon={ArrowUpRight}
        />
        <MetricCard
          label="Ledger Invariant"
          value={isGloballyBalanced ? '100% BALANCED' : 'IMBALANCE'}
          subvalue="Σ Debits === Σ Credits"
          status={isGloballyBalanced ? 'gain' : 'loss'}
          badgeText={isGloballyBalanced ? 'VERIFIED' : 'ALERT'}
          badgeVariant={isGloballyBalanced ? 'live' : 'loss'}
          icon={ShieldCheck}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 font-mono text-xs">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center space-x-1">
          <Filter className="w-3 h-3" />
          <span>Reference Filter:</span>
        </span>
        {['ALL', 'PAYMENT_CAPTURE', 'REFUND'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2.5 py-1 rounded-sm text-[11px] font-mono tracking-wider uppercase transition-all cursor-pointer ${
              filterType === type
                ? 'bg-[#141d2d] text-white font-bold border border-cyan-500/40'
                : 'bg-[#101622] text-slate-400 hover:text-slate-200 border border-[#182030]'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-[#2a0e14] border border-[#6b1d28] rounded-sm flex items-center space-x-2 text-rose-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Transactions Feed */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-mono flex flex-col items-center justify-center space-y-3 bg-[#0d131f] rounded-sm border border-[#1b253b]">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span>QUERYING POSTGRESQL DOUBLE-ENTRY LEDGER...</span>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs font-mono flex flex-col items-center justify-center space-y-3 bg-[#0d131f] rounded-sm border border-[#1b253b]">
          <div className="w-10 h-10 rounded-sm bg-[#101520] flex items-center justify-center border border-[#182030]">
            <BookOpen className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="font-bold text-slate-300">NO LEDGER TRANSACTIONS FOUND</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Complete a successful payment in Checkout Terminal to record the initial journal transaction.
            </p>
          </div>
          <button
            onClick={onNavigateToCheckout}
            className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-sm text-xs transition-colors cursor-pointer"
          >
            Go to Checkout Terminal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((tx: LedgerTransaction) => {
            const debits = tx.entries
              .filter((e) => e.direction === 'DEBIT')
              .reduce((sum, e) => sum + e.amountMinor, 0);
            const credits = tx.entries
              .filter((e) => e.direction === 'CREDIT')
              .reduce((sum, e) => sum + e.amountMinor, 0);
            const isBalanced = debits === credits;

            return (
              <div
                key={tx.id}
                className="bg-[#0d131f] rounded-sm border border-[#1b253b] hover:border-[#263553] p-4 sm:p-5 shadow-terminal transition-all font-mono"
              >
                {/* Journal Entry Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#182030] gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs sm:text-sm tracking-wide">
                        {tx.description}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-[#121926] text-cyan-300 border border-[#1c273a]">
                        {tx.referenceType}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span>Ref ID:</span>
                      <span className="text-slate-200 font-semibold">{tx.referenceId}</span>
                      <button
                        onClick={() => handleCopy(tx.referenceId, `ref-${tx.id}`)}
                        className="text-slate-500 hover:text-white p-0.5 cursor-pointer"
                        title="Copy reference ID"
                      >
                        {copiedKey === `ref-${tx.id}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-sm border text-[10px] font-bold ${
                        isBalanced
                          ? 'bg-[#062419] text-emerald-400 border-[#0d5c3a]'
                          : 'bg-[#2a0e14] text-rose-400 border-[#6b1d28]'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isBalanced ? 'BALANCED' : 'IMBALANCE'}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {new Date(tx.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Sub-Ledger Entries Table */}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-[#182030]">
                        <th className="py-1.5 px-3">Account Type</th>
                        <th className="py-1.5 px-3">Direction</th>
                        <th className="py-1.5 px-3">Amount (Paise)</th>
                        <th className="py-1.5 px-3 text-right">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141a27]">
                      {tx.entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-[#121824] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-200">
                            {entry.accountType}
                          </td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={entry.direction} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 tabular-nums">
                            {entry.amountMinor.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white tabular-nums">
                            {formatINR(entry.amountMinor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[#182030] text-[11px] font-bold text-slate-300">
                        <td className="py-2 px-3" colSpan={2}>
                          TRANSACTION BALANCE INVARIANT
                        </td>
                        <td className="py-2 px-3 text-slate-400 tabular-nums">
                          Debits: {debits.toLocaleString()} | Credits: {credits.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-400 tabular-nums">
                          {formatINR(credits)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
