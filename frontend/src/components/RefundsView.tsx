import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  ShieldAlert,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Refund, PaymentAttempt } from '../types';
import { api } from '../services/api';
import { StatusBadge } from './Badge';

interface RefundsViewProps {
  initialPaymentId?: string;
  onNavigateToCheckout: () => void;
}

export const RefundsView: React.FC<RefundsViewProps> = ({
  initialPaymentId,
  onNavigateToCheckout,
}) => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refund Action State
  const [paymentQuery, setPaymentQuery] = useState(initialPaymentId || '');
  const [targetPayment, setTargetPayment] = useState<PaymentAttempt | null>(null);
  const [searchingPayment, setSearchingPayment] = useState(false);
  const [refundMode, setRefundMode] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [partialAmountRupees, setPartialAmountRupees] = useState('');
  const [refundReason, setRefundReason] = useState('Customer Request');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllRefunds(100);
      setRefunds(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch refunds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  useEffect(() => {
    if (initialPaymentId) {
      handleLookupPayment(initialPaymentId);
    }
  }, [initialPaymentId]);

  const handleLookupPayment = async (queryToSearch?: string) => {
    const q = (queryToSearch || paymentQuery).trim();
    if (!q) return;

    try {
      setSearchingPayment(true);
      setRefundError(null);
      const payment = await api.getPayment(q);
      setTargetPayment(payment);

      // If successful, pre-fill
      if (payment.status !== 'SUCCEEDED') {
        setRefundError(
          `Payment is in '${payment.status}' state. Only SUCCEEDED payments can be refunded.`
        );
      }
    } catch (err: any) {
      setTargetPayment(null);
      setRefundError(err.message || `Payment '${q}' not found`);
    } finally {
      setSearchingPayment(false);
    }
  };

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

  // Calculate target payment balance
  const targetRefunds = targetPayment?.refunds || [];
  const targetTotalRefunded = targetRefunds
    .filter((r: Refund) => r.status === 'SUCCEEDED' || r.status === 'PROCESSING')
    .reduce((sum: number, r: Refund) => sum + r.amountMinor, 0);
  const targetRemainingRefundable = targetPayment
    ? Math.max(0, targetPayment.amountMinor - targetTotalRefunded)
    : 0;

  // Execute Refund
  const handleExecuteRefund = async () => {
    if (!targetPayment) return;

    try {
      setIsRefunding(true);
      setRefundError(null);
      setSuccessMessage(null);

      let amountMinor: number | undefined;
      if (refundMode === 'PARTIAL') {
        const parsed = parseFloat(partialAmountRupees);
        if (isNaN(parsed) || parsed <= 0) {
          throw new Error('Please enter a valid partial refund amount in ₹');
        }
        amountMinor = Math.round(parsed * 100);

        if (amountMinor > targetRemainingRefundable) {
          throw new Error(
            `Refund amount ₹${parsed.toFixed(
              2
            )} exceeds remaining refundable balance of ${formatINR(targetRemainingRefundable)}`
          );
        }
      }

      await api.createRefund(
        targetPayment.id,
        amountMinor,
        refundReason || (refundMode === 'FULL' ? 'Full Refund' : 'Partial Refund')
      );

      setConfirmModalOpen(false);
      setPartialAmountRupees('');
      setSuccessMessage(
        `Refund successfully processed! Balanced double-entry ledger records created.`
      );

      // Refresh both current payment and refund history
      await handleLookupPayment(targetPayment.id);
      await fetchRefunds();

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setRefundError(err.message || 'Refund processing failed');
      setConfirmModalOpen(false);
    } finally {
      setIsRefunding(false);
    }
  };

  // Overall Stats
  const totalRefundAmountAcrossGateway = refunds
    .filter((r: Refund) => r.status === 'SUCCEEDED')
    .reduce((sum: number, r: Refund) => sum + r.amountMinor, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <RotateCcw className="w-6 h-6 text-purple-400" />
            <span>Refunds Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Execute full or partial refunds with database-level row locking and over-refund prevention.
          </p>
        </div>

        <button
          onClick={fetchRefunds}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">
            Total Gateway Refunded
          </span>
          <span className="text-2xl font-mono font-extrabold text-purple-400">
            {formatINR(totalRefundAmountAcrossGateway)}
          </span>
          <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
            {totalRefundAmountAcrossGateway} paise
          </span>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Refunds Count</span>
          <span className="text-2xl font-mono font-extrabold text-white">{refunds.length}</span>
          <span className="block text-[11px] text-slate-500 mt-0.5">Successful records</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Concurrency Lock</span>
          <span className="text-base font-semibold text-emerald-400 flex items-center space-x-1.5 mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Row-Level Serialized</span>
          </span>
          <span className="block text-[11px] text-slate-500 mt-0.5">
            SELECT FOR UPDATE Protected
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-3 text-rose-300 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-3 text-emerald-300 text-xs sm:text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Issue Refund Interactive Console */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Issue a Full or Partial Refund</h3>
            <p className="text-xs text-slate-400">
              Select or search any captured payment attempt to refund safely.
            </p>
          </div>
        </div>

        {/* Payment Search Input */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Enter Payment Attempt Reference (e.g. <span className="font-mono text-purple-400">pay_...</span>) or Database UUID
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={paymentQuery}
                onChange={(e) => setPaymentQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookupPayment()}
                placeholder="e.g. pay_1729420000000_abc123"
                className="w-full glass-input px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono placeholder-slate-600"
              />
            </div>
            <button
              onClick={() => handleLookupPayment()}
              disabled={searchingPayment || !paymentQuery.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {searchingPayment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Lookup</span>
            </button>
          </div>
        </div>

        {/* Target Payment State Card */}
        {targetPayment && (
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-teal-400" />
                <span className="font-mono text-xs sm:text-sm font-bold text-white">
                  {targetPayment.paymentReference}
                </span>
                <StatusBadge status={targetPayment.status} />
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Order: {targetPayment.orderId}
              </span>
            </div>

            {/* Financial Ledger Balance Breakdown */}
            <div className="grid grid-cols-3 gap-2.5 text-center sm:text-left">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-[10px] sm:text-xs text-slate-400 block">Captured</span>
                <span className="text-xs sm:text-sm font-mono font-extrabold text-emerald-400">
                  {formatINR(targetPayment.amountMinor)}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-[10px] sm:text-xs text-slate-400 block">Already Refunded</span>
                <span className="text-xs sm:text-sm font-mono font-extrabold text-purple-400">
                  {formatINR(targetTotalRefunded)}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-[10px] sm:text-xs text-slate-400 block">
                  Remaining Refundable
                </span>
                <span className="text-xs sm:text-sm font-mono font-extrabold text-teal-300">
                  {formatINR(targetRemainingRefundable)}
                </span>
              </div>
            </div>

            {/* Refund Configuration Options */}
            {targetRemainingRefundable > 0 && targetPayment.status === 'SUCCEEDED' ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="refundMode"
                      checked={refundMode === 'FULL'}
                      onChange={() => setRefundMode('FULL')}
                      className="accent-purple-500"
                    />
                    <span>
                      Full Refund (<strong>{formatINR(targetRemainingRefundable)}</strong>)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="refundMode"
                      checked={refundMode === 'PARTIAL'}
                      onChange={() => setRefundMode('PARTIAL')}
                      className="accent-purple-500"
                    />
                    <span>Partial Refund</span>
                  </label>
                </div>

                {refundMode === 'PARTIAL' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Partial Amount in Rupees (Max {formatINR(targetRemainingRefundable)})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 font-mono text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        max={(targetRemainingRefundable / 100).toString()}
                        value={partialAmountRupees}
                        onChange={(e) => setPartialAmountRupees(e.target.value)}
                        placeholder="0.00"
                        className="w-full glass-input pl-8 pr-4 py-2 rounded-xl text-xs sm:text-sm font-mono"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Reason for Refund
                  </label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g. Customer return, duplicate order, sandbox test"
                    className="w-full glass-input px-4 py-2 rounded-xl text-xs sm:text-sm"
                  />
                </div>

                <button
                  onClick={() => setConfirmModalOpen(true)}
                  disabled={
                    isRefunding ||
                    (refundMode === 'PARTIAL' &&
                      (!partialAmountRupees || parseFloat(partialAmountRupees) <= 0))
                  }
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    Confirm & Execute {refundMode === 'FULL' ? 'Full' : 'Partial'} Refund
                  </span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {targetRemainingRefundable <= 0
                    ? 'This payment has been fully refunded. No refundable balance remaining.'
                    : 'Payment must be in SUCCEEDED state to execute refunds.'}
                </span>
              </div>
            )}
          </div>
        )}

        {refundError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2.5 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div>
              <span className="font-bold">Refund Error:</span> {refundError}
            </div>
          </div>
        )}
      </div>

      {/* All Refunds History Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Historical Gateway Refunds</h3>
            <p className="text-xs text-slate-400">
              Audit log of all refund executions and balanced ledger reversals.
            </p>
          </div>
          <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 font-mono">
            {refunds.length} recorded
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-purple-400" />
            <span>Loading PostgreSQL refunds...</span>
          </div>
        ) : refunds.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
            <RotateCcw className="w-8 h-8 text-slate-600" />
            <div>
              <p className="font-semibold text-slate-300">No refunds recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Once a captured payment is refunded, its record and reverse ledger entries appear here.
              </p>
            </div>
            <button
              onClick={onNavigateToCheckout}
              className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Go to Checkout
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 sm:px-6">Refund Reference</th>
                  <th className="py-3 px-4">Amount (INR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Reason</th>
                  <th className="py-3 px-4 hidden md:table-cell">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
                {refunds.map((refund: Refund) => (
                  <tr key={refund.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white">
                          {refund.refundReference}
                        </span>
                        <button
                          onClick={() => handleCopy(refund.refundReference, refund.id)}
                          className="text-slate-500 hover:text-white p-0.5"
                        >
                          {copiedKey === refund.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 block">
                        Payment: {refund.paymentAttemptId}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-extrabold text-purple-300">
                        {formatINR(refund.amountMinor)}
                      </span>
                      <span className="block font-mono text-[10px] text-slate-500">
                        {refund.amountMinor} paise
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={refund.status} />
                    </td>

                    <td className="py-3.5 px-4 hidden sm:table-cell text-xs text-slate-300">
                      {refund.reason || 'No reason specified'}
                    </td>

                    <td className="py-3.5 px-4 hidden md:table-cell text-xs text-slate-400 font-mono">
                      {new Date(refund.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && targetPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-purple-400">
              <ShieldAlert className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Consequential Refund</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Are you sure you want to refund{' '}
              <strong className="text-white font-mono">
                {refundMode === 'FULL'
                  ? formatINR(targetRemainingRefundable)
                  : `₹${parseFloat(partialAmountRupees).toFixed(2)}`}
              </strong>{' '}
              for payment attempt <span className="font-mono text-purple-300">{targetPayment.paymentReference}</span>?
            </p>

            <div className="p-3 bg-slate-900 rounded-xl text-xs text-slate-400 space-y-1">
              <div>• Deducts funds from Merchant Settlement Account</div>
              <div>• Re-credits Customer Funds via balanced ledger entries</div>
              <div>• Cannot be undone once committed to PostgreSQL</div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRefund}
                disabled={isRefunding}
                className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {isRefunding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>Confirm Refund</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
