import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Check,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { PaymentAttempt } from '../types';
import { api } from '../services/api';
import { StatusBadge, Badge } from './Badge';
import { PaymentDetailModal } from './PaymentDetailModal';

interface TransactionsViewProps {
  onNavigateToCheckout: () => void;
  onViewLedger: (paymentId: string) => void;
  onViewRefunds: (paymentId: string) => void;
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
      setError(err.message || 'Failed to fetch payments from backend');
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
      maximumFractionDigits: 2,
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
    <div className="space-y-5">
      {/* Top Header Command Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-900">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight font-mono uppercase flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-white" />
              <span>PAYMENTS & TRANSACTIONS DESK</span>
            </h2>
            <Badge variant="neutral" size="xs">
              {payments.length} RECORDS
            </Badge>
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Real-time transaction log persisted to PostgreSQL with strict status lifecycle tracking
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3 py-1.5 bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-sm text-xs font-mono font-medium transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-white' : ''}`} />
          <span>Sync Log</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#050505] rounded-sm p-3.5 border border-neutral-850 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between font-mono">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Payment Reference, Order ID, or UUID..."
            className="w-full bg-black border border-neutral-800 text-xs font-mono text-white placeholder:text-neutral-500 pl-9 pr-3 py-1.5 rounded-sm focus:outline-none focus:border-neutral-600 transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mr-1 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>
          {['ALL', 'SUCCEEDED', 'FAILED', 'UNCERTAIN', 'PROCESSING'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-mono tracking-wider uppercase transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-neutral-900 text-white font-bold border border-neutral-600'
                  : 'bg-black text-neutral-400 hover:text-white border border-neutral-850'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-neutral-900 border border-red-900/40 rounded-sm flex items-center space-x-2 text-red-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Transaction List / Table */}
      <div className="bg-[#050505] rounded-sm border border-neutral-850 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-neutral-400 text-xs font-mono flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-white" />
            <span>QUERYING POSTGRESQL TRANSACTION DATABASE...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-xs font-mono flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-sm bg-neutral-900 flex items-center justify-center border border-neutral-800">
              <CreditCard className="w-5 h-5 text-neutral-500" />
            </div>
            <div>
              <p className="font-bold text-white">NO TRANSACTIONS FOUND</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try clearing the search query or status filter.'
                  : 'Execute a payment simulation in Checkout Terminal to record your first transaction.'}
              </p>
            </div>
            {!searchQuery && statusFilter === 'ALL' && (
              <button
                onClick={onNavigateToCheckout}
                className="mt-2 px-3 py-1.5 bg-white hover:bg-neutral-200 text-black font-bold rounded-sm text-xs transition-colors cursor-pointer"
              >
                Go to Checkout Terminal
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-neutral-900 bg-[#0a0a0a] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-2.5 px-4 sm:px-5">Payment Reference</th>
                  <th className="py-2.5 px-4">Amount (INR)</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 hidden md:table-cell">Outcome</th>
                  <th className="py-2.5 px-4 hidden lg:table-cell">Timestamp</th>
                  <th className="py-2.5 px-4 sm:px-5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-xs">
                {filteredPayments.map((payment: PaymentAttempt) => (
                  <tr
                    key={payment.id}
                    onClick={() => setSelectedPayment(payment)}
                    className="hover:bg-neutral-950 transition-colors cursor-pointer group"
                  >
                    {/* Reference & Order ID */}
                    <td className="py-3 px-4 sm:px-5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white group-hover:underline transition-colors">
                          {payment.paymentReference}
                        </span>
                        <button
                          onClick={(e) => handleCopy(payment.paymentReference, payment.id, e)}
                          className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
                          title="Copy reference"
                        >
                          {copiedKey === payment.id ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <span className="font-mono text-[10px] text-neutral-500 block mt-0.5 truncate max-w-[220px]">
                        Order: {payment.orderId}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-white tabular-nums">
                        {formatINR(payment.amountMinor)}
                      </span>
                      <span className="block font-mono text-[10px] text-neutral-500 tabular-nums">
                        {payment.amountMinor} paise
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={payment.status} size="sm" />
                    </td>

                    {/* Outcome */}
                    <td className="py-3 px-4 hidden md:table-cell font-mono text-xs text-neutral-400">
                      <span className="px-1.5 py-0.5 rounded-sm bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300">
                        {payment.simulatedOutcome}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 hidden lg:table-cell text-[11px] text-neutral-400 font-mono tabular-nums">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 sm:px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(payment);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-black hover:bg-neutral-900 text-neutral-300 rounded-sm text-xs font-mono font-medium border border-neutral-800 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-neutral-400" />
                        <span>View</span>
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
      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onViewLedger={() => {
            const id = selectedPayment.id;
            setSelectedPayment(null);
            onViewLedger(id);
          }}
          onViewRefunds={() => {
            const id = selectedPayment.id;
            setSelectedPayment(null);
            onViewRefunds(id);
          }}
        />
      )}
    </div>
  );
};
