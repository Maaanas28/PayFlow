import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Copy,
  Check,
  Eye,
  CreditCard,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { PaymentAttempt } from '../types';
import { api } from '../services/api';
import { StatusBadge } from './Badge';
import { PaymentDetailModal } from './PaymentDetailModal';

interface TransactionsViewProps {
  onNavigateToCheckout: () => void;
  onViewLedger?: (paymentId: string) => void;
  onViewRefunds?: (paymentId: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onNavigateToCheckout,
  onViewLedger,
  onViewRefunds,
}) => {
  const [payments, setPayments] = useState<PaymentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<PaymentAttempt | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPayments(100);
      setPayments(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const filteredPayments = payments.filter((p: PaymentAttempt) => {
    const matchesFilter =
      statusFilter === 'ALL' || p.status.toUpperCase() === statusFilter.toUpperCase();

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.paymentReference.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.orderId.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <CreditCard className="w-6 h-6 text-teal-400" />
            <span>Payments & Transactions</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time transaction log persisted to PostgreSQL with strict status lifecycle tracking.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Payment Reference, Order ID, or UUID..."
            className="w-full glass-input pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm placeholder-slate-500 font-mono"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 font-medium mr-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {['ALL', 'SUCCEEDED', 'FAILED', 'UNCERTAIN', 'PROCESSING'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-3 text-rose-300 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Transaction List / Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-teal-400" />
            <span>Loading PostgreSQL transactions...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
              <CreditCard className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-300">No transactions found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try clearing the search query or status filter.'
                  : 'Execute a payment simulation in the Checkout tab to record your first transaction.'}
              </p>
            </div>
            {!searchQuery && statusFilter === 'ALL' && (
              <button
                onClick={onNavigateToCheckout}
                className="mt-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Go to Checkout
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Payment Reference</th>
                  <th className="py-3.5 px-4">Amount (INR)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Outcome</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Created</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
                {filteredPayments.map((payment: PaymentAttempt) => (
                  <tr
                    key={payment.id}
                    onClick={() => setSelectedPayment(payment)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Reference & Order ID */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white group-hover:text-teal-300 transition-colors">
                          {payment.paymentReference}
                        </span>
                        <button
                          onClick={(e) => handleCopy(payment.paymentReference, payment.id, e)}
                          className="text-slate-500 hover:text-white p-0.5"
                          title="Copy reference"
                        >
                          {copiedKey === payment.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 block mt-0.5 truncate max-w-[200px]">
                        Order: {payment.orderId}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4">
                      <span className="font-mono font-extrabold text-white">
                        {formatINR(payment.amountMinor)}
                      </span>
                      <span className="block font-mono text-[10px] text-slate-500">
                        {payment.amountMinor} paise
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <StatusBadge status={payment.status} />
                    </td>

                    {/* Outcome */}
                    <td className="py-4 px-4 hidden md:table-cell font-mono text-xs text-slate-400">
                      {payment.simulatedOutcome}
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-4 hidden lg:table-cell text-xs text-slate-400 font-mono">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(payment);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Inspection Modal */}
      <PaymentDetailModal
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onViewLedger={onViewLedger}
        onViewRefunds={onViewRefunds}
      />
    </div>
  );
};
