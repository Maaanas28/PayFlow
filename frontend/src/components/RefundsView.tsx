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
  Coins,
  Lock,
} from 'lucide-react';
import { Refund, PaymentAttempt } from '../types';
import { api } from '../services/api';
import { StatusBadge, Badge } from './Badge';
import { MetricCard } from './MetricCard';

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

  const formatINR = (minorUnits: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(minorUnits / 100);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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

  const handleLookupPayment = async (lookupId?: string) => {
    const idToFind = (lookupId || paymentQuery).trim();
    if (!idToFind) return;

    try {
      setSearchingPayment(true);
      setRefundError(null);
      const payment = await api.getPayment(idToFind);
      setTargetPayment(payment);
    } catch (err: any) {
      setTargetPayment(null);
      setRefundError(
        err.message || `Payment '${idToFind}' not found in PostgreSQL database.`
      );
    } finally {
      setSearchingPayment(false);
    }
  };

  useEffect(() => {
    if (initialPaymentId) {
      setPaymentQuery(initialPaymentId);
      handleLookupPayment(initialPaymentId);
    }
  }, [initialPaymentId]);

  // Compute live refundable balance for current target payment
  const computeRefundableBalance = (payment: PaymentAttempt | null): number => {
    if (!payment) return 0;
    if (payment.status !== 'SUCCEEDED') return 0;
    const existingRefunds = payment.refunds || [];
    const successfulRefundsSum = existingRefunds
      .filter((r) => r.status === 'SUCCEEDED')
      .reduce((sum, r) => sum + r.amountMinor, 0);
    return Math.max(0, payment.amountMinor - successfulRefundsSum);
  };

  const refundableBalance = computeRefundableBalance(targetPayment);

  const calculateProposedRefundMinor = (): number => {
    if (!targetPayment) return 0;
    if (refundMode === 'FULL') {
      return refundableBalance;
    }
    const val = parseFloat(partialAmountRupees);
    if (isNaN(val) || val <= 0) return 0;
    return Math.round(val * 100);
  };

  const proposedRefundMinor = calculateProposedRefundMinor();

  const handleExecuteRefund = async () => {
    if (!targetPayment) return;

    const amountMinor = refundMode === 'PARTIAL' ? proposedRefundMinor : undefined;

    if (refundMode === 'PARTIAL') {
      if (proposedRefundMinor <= 0) {
        setRefundError('Please specify a positive refund amount.');
        return;
      }
      if (proposedRefundMinor > refundableBalance) {
        setRefundError(
          `Requested refund of ${formatINR(proposedRefundMinor)} exceeds refundable balance of ${formatINR(refundableBalance)}.`
        );
        return;
      }
    }

    try {
      setIsRefunding(true);
      setRefundError(null);
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
    <div className="space-y-5">
      {/* Top Header Command Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-900">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight font-mono uppercase flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-white" />
              <span>REFUNDS ESCROW MATRIX</span>
            </h2>
            <Badge variant="neutral" size="xs">
              {refunds.length} EXECUTED
            </Badge>
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Execute full or partial refunds with database-level row locking and over-refund prevention
          </p>
        </div>

        <button
          onClick={fetchRefunds}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3 py-1.5 bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-sm text-xs font-mono font-medium transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-white' : ''}`} />
          <span>Sync Feed</span>
        </button>
      </div>

      {/* Finance OS Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Gateway Refunded"
          value={formatINR(totalRefundAmountAcrossGateway)}
          subvalue={`${totalRefundAmountAcrossGateway.toLocaleString()} paise`}
          badgeText="ESCROW"
          badgeVariant="neutral"
          icon={Coins}
        />
        <MetricCard
          label="Total Refunds Executed"
          value={refunds.length}
          subvalue="Database records"
          badgeText="POSTED"
          badgeVariant="neutral"
          icon={RotateCcw}
        />
        <MetricCard
          label="Concurrency Protection"
          value="SERIALIZED"
          subvalue="Pessimistic FOR UPDATE row lock"
          status="gain"
          badgeText="LOCKED"
          badgeVariant="neutral"
          icon={Lock}
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-neutral-900 border border-red-900/40 rounded-sm flex items-center space-x-2 text-red-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-sm flex items-center space-x-2 text-white text-xs font-mono animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-white" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Issue Refund Interactive Console */}
      <div className="bg-[#050505] rounded-sm p-5 border border-neutral-850 space-y-4 font-mono">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-neutral-900">
          <div className="w-7 h-7 rounded-sm bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              ISSUE FULL OR PARTIAL REVERSAL
            </h3>
            <p className="text-[11px] text-neutral-400">
              Select or search any captured payment attempt to refund safely under row locks
            </p>
          </div>
        </div>

        {/* Payment Search Input */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1.5">
            Enter Payment Attempt Reference (e.g. <span className="text-neutral-300">pay_...</span>) or Database UUID
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={paymentQuery}
                onChange={(e) => setPaymentQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookupPayment()}
                placeholder="e.g. pay_1729420000000_abc123"
                className="w-full bg-black border border-neutral-800 text-xs font-mono text-white placeholder:text-neutral-500 px-3 py-2 rounded-sm focus:outline-none focus:border-neutral-600"
              />
            </div>
            <button
              onClick={() => handleLookupPayment()}
              disabled={searchingPayment || !paymentQuery.trim()}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black font-bold rounded-sm text-xs flex items-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {searchingPayment ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Search className="w-4 h-4 text-black" />
              )}
              <span>Lookup</span>
            </button>
          </div>
        </div>

        {/* Target Payment State Card */}
        {targetPayment && (
          <div className="p-4 bg-black rounded-sm border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-900">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-white" />
                <span className="font-mono text-xs font-bold text-white">
                  {targetPayment.paymentReference}
                </span>
                <StatusBadge status={targetPayment.status} size="sm" />
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">
                Order: {targetPayment.orderId}
              </span>
            </div>

            {/* Financial Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-[#050505] rounded-sm border border-neutral-850">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                  Original Captured
                </span>
                <span className="text-base font-bold text-white font-mono tabular-nums">
                  {formatINR(targetPayment.amountMinor)}
                </span>
                <span className="block text-[10px] text-neutral-500 font-mono">
                  {targetPayment.amountMinor} paise
                </span>
              </div>

              <div className="p-3 bg-[#050505] rounded-sm border border-neutral-850">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                  Already Refunded
                </span>
                <span className="text-base font-bold text-white font-mono tabular-nums">
                  {formatINR(targetPayment.amountMinor - refundableBalance)}
                </span>
                <span className="block text-[10px] text-neutral-500 font-mono">
                  {(targetPayment.amountMinor - refundableBalance)} paise
                </span>
              </div>

              <div className="p-3 bg-[#050505] rounded-sm border border-neutral-850">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                  Available to Refund
                </span>
                <span className="text-base font-bold text-white font-mono tabular-nums">
                  {formatINR(refundableBalance)}
                </span>
                <span className="block text-[10px] text-neutral-500 font-mono">
                  {refundableBalance} paise remaining
                </span>
              </div>
            </div>

            {/* Validation / Execution Section */}
            {targetPayment.status !== 'SUCCEEDED' ? (
              <div className="p-3 bg-neutral-900 border border-red-900/40 rounded-sm text-xs text-red-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>
                  Payments with status <strong className="text-white">{targetPayment.status}</strong> cannot be refunded. Only SUCCEEDED payments have settled funds.
                </span>
              </div>
            ) : refundableBalance <= 0 ? (
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-sm text-xs text-neutral-400 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-white" />
                <span>This transaction is fully refunded. No additional balance remains.</span>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {/* Mode Select */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1.5">
                    Select Reversal Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRefundMode('FULL')}
                      className={`p-3 rounded-sm border text-left transition-all cursor-pointer ${
                        refundMode === 'FULL'
                          ? 'border-neutral-500 bg-neutral-900 text-white shadow-sm'
                          : 'border-neutral-850 bg-black text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">Full Reversal</div>
                      <div className="text-[11px] text-neutral-300 mt-0.5 tabular-nums">
                        Refund entire remaining {formatINR(refundableBalance)}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRefundMode('PARTIAL')}
                      className={`p-3 rounded-sm border text-left transition-all cursor-pointer ${
                        refundMode === 'PARTIAL'
                          ? 'border-neutral-500 bg-neutral-900 text-white shadow-sm'
                          : 'border-neutral-850 bg-black text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">Partial Reversal</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Specify exact amount &le; {formatINR(refundableBalance)}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Partial Amount Input */}
                {refundMode === 'PARTIAL' && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1.5">
                      Partial Amount in Rupees (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={(refundableBalance / 100).toFixed(2)}
                        value={partialAmountRupees}
                        onChange={(e) => setPartialAmountRupees(e.target.value)}
                        placeholder={`e.g. ${(refundableBalance / 200).toFixed(2)}`}
                        className="w-full bg-black border border-neutral-800 text-xs font-mono text-white placeholder:text-neutral-500 pl-8 pr-4 py-2 rounded-sm focus:outline-none focus:border-neutral-600"
                      />
                    </div>
                  </div>
                )}

                {/* Reason Input */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1.5">
                    Reversal Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g. Customer return, cancellation, damaged goods"
                    className="w-full bg-black border border-neutral-800 text-xs font-mono text-white placeholder:text-neutral-500 px-3 py-2 rounded-sm focus:outline-none focus:border-neutral-600"
                  />
                </div>

                {refundError && (
                  <div className="p-2.5 bg-neutral-900 border border-red-900/40 rounded-sm text-xs text-red-300 font-mono">
                    {refundError}
                  </div>
                )}

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(true)}
                  disabled={
                    proposedRefundMinor <= 0 ||
                    proposedRefundMinor > refundableBalance ||
                    isRefunding
                  }
                  className="w-full py-2.5 px-4 bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider rounded-sm shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-black" />
                  <span>Execute Reversal {formatINR(proposedRefundMinor)}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* All Refunds History Table */}
      <div className="bg-[#050505] rounded-sm border border-neutral-850 overflow-hidden font-mono">
        <div className="p-3.5 border-b border-neutral-900 bg-[#0a0a0a] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              HISTORICAL GATEWAY REVERSALS
            </h3>
            <p className="text-[11px] text-neutral-400">
              Audit log of all refund executions and balanced ledger reversals
            </p>
          </div>
          <Badge variant="neutral" size="xs">
            {refunds.length} RECORDED
          </Badge>
        </div>

        {loading ? (
          <div className="py-16 text-center text-neutral-400 text-xs flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-white" />
            <span>QUERYING POSTGRESQL REFUND RECORDS...</span>
          </div>
        ) : refunds.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-xs flex flex-col items-center justify-center space-y-3">
            <RotateCcw className="w-6 h-6 text-neutral-600" />
            <div>
              <p className="font-bold text-white">NO REFUNDS RECORDED YET</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Once a captured payment is refunded, its record and reverse ledger entries appear here.
              </p>
            </div>
            <button
              onClick={onNavigateToCheckout}
              className="mt-2 px-3 py-1.5 bg-white hover:bg-neutral-200 text-black font-bold rounded-sm text-xs transition-colors cursor-pointer"
            >
              Go to Checkout Terminal
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-900 bg-[#0a0a0a] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-2.5 px-4 sm:px-5">Refund Reference</th>
                  <th className="py-2.5 px-4">Amount (INR)</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 hidden sm:table-cell">Reason</th>
                  <th className="py-2.5 px-4 hidden md:table-cell">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {refunds.map((refund: Refund) => (
                  <tr key={refund.id} className="hover:bg-neutral-950 transition-colors">
                    <td className="py-3 px-4 sm:px-5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">
                          {refund.refundReference}
                        </span>
                        <button
                          onClick={() => handleCopy(refund.refundReference, refund.id)}
                          className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
                        >
                          {copiedKey === refund.id ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-neutral-500 block truncate max-w-[220px]">
                        Payment: {refund.paymentAttemptId}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-white tabular-nums">
                        {formatINR(refund.amountMinor)}
                      </span>
                      <span className="block text-[10px] text-neutral-500 tabular-nums">
                        {refund.amountMinor} paise
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={refund.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 hidden sm:table-cell text-xs text-neutral-300">
                      {refund.reason || 'No reason specified'}
                    </td>

                    <td className="py-3 px-4 hidden md:table-cell text-[11px] text-neutral-400 tabular-nums">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#050505] rounded-sm border border-neutral-800 max-w-md w-full p-5 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center space-x-2 text-white">
              <ShieldAlert className="w-5 h-5 text-neutral-300" />
              <h3 className="text-sm font-bold uppercase tracking-wider">CONFIRM TRANSACTION REVERSAL</h3>
            </div>

            <p className="text-neutral-400 leading-relaxed text-xs">
              You are about to issue a refund of{' '}
              <strong className="text-white">{formatINR(proposedRefundMinor)}</strong> for payment{' '}
              <span className="text-white font-bold">{targetPayment.paymentReference}</span>.
            </p>

            <div className="p-3 bg-black rounded-sm border border-neutral-850 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-neutral-400">
                <span>Refund Mode:</span>
                <span className="text-white font-bold">{refundMode}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Refund Amount:</span>
                <span className="text-white font-bold">{formatINR(proposedRefundMinor)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Remaining Balance:</span>
                <span className="text-white font-bold">
                  {formatINR(refundableBalance - proposedRefundMinor)}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Concurrency Protection:</span>
                <span className="text-white">PostgreSQL Row Lock</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={isRefunding}
                className="px-3 py-1.5 bg-black hover:bg-neutral-900 text-neutral-300 rounded-sm font-medium border border-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRefund}
                disabled={isRefunding}
                className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black font-bold rounded-sm flex items-center space-x-1.5 cursor-pointer"
              >
                {isRefunding && <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />}
                <span>Confirm & Post</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
