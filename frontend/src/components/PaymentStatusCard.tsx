import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  AlertOctagon,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Webhook,
  ArrowLeftRight,
  Copy,
  Check,
} from 'lucide-react';
import { PaymentAttempt, Refund } from '../types';
import { api } from '../services/api';
import { StatusBadge } from './Badge';

interface PaymentStatusCardProps {
  payment: PaymentAttempt;
  onRefresh: (updated: PaymentAttempt) => void;
  onReset: () => void;
  onViewLedger?: (paymentId: string) => void;
  onViewRefunds?: (paymentId: string) => void;
  onViewWebhooks?: () => void;
  onViewTransactions?: () => void;
}

export const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({
  payment,
  onRefresh,
  onReset,
  onViewLedger,
  onViewRefunds,
  onViewWebhooks,
  onViewTransactions,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Refund state
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [refundAmountRupees, setRefundAmountRupees] = useState<string>('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const formatINR = (minorUnits: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(minorUnits / 100);
  };

  const loadRefunds = async () => {
    try {
      const data = await api.getRefunds(payment.id);
      setRefunds(data || []);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (payment.status === 'SUCCEEDED') {
      loadRefunds();
    }
  }, [payment.id, payment.status]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleVerifyStatus = async () => {
    try {
      setIsRefreshing(true);
      setRefreshMessage(null);
      const updated = await api.getPayment(payment.id);
      onRefresh(updated);
      await loadRefunds();
      setRefreshMessage('Status verified live against PostgreSQL database.');
      setTimeout(() => setRefreshMessage(null), 3500);
    } catch (err: any) {
      setRefreshMessage(`Verification failed: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReconcile = async (resolution: 'SUCCESS' | 'DECLINE') => {
    try {
      setIsReconciling(true);
      setRefreshMessage(null);
      const updated = await api.reconcilePayment(payment.id, resolution);
      onRefresh(updated);
      setRefreshMessage(
        `Reconciliation completed. Payment transitioned to ${
          resolution === 'SUCCESS' ? 'SUCCEEDED' : 'FAILED'
        }!`
      );
      setTimeout(() => setRefreshMessage(null), 4000);
    } catch (err: any) {
      setRefreshMessage(`Reconciliation failed: ${err.message}`);
    } finally {
      setIsReconciling(false);
    }
  };

  const totalRefundedMinor = refunds
    .filter((r: Refund) => r.status === 'SUCCEEDED' || r.status === 'PROCESSING')
    .reduce((sum: number, r: Refund) => sum + r.amountMinor, 0);

  const remainingRefundableMinor = Math.max(0, payment.amountMinor - totalRefundedMinor);

  const handleCreateRefund = async (isFull: boolean) => {
    try {
      setIsRefunding(true);
      setRefundError(null);
      setRefreshMessage(null);

      let amountMinor: number | undefined;
      if (!isFull) {
        const parsed = parseFloat(refundAmountRupees);
        if (isNaN(parsed) || parsed <= 0) {
          throw new Error('Please enter a valid refund amount in ₹');
        }
        amountMinor = Math.round(parsed * 100);
        if (amountMinor > remainingRefundableMinor) {
          throw new Error(`Refund amount cannot exceed ${formatINR(remainingRefundableMinor)}`);
        }
      }

      await api.createRefund(payment.id, amountMinor, isFull ? 'Full Refund' : 'Partial Refund');
      setRefundAmountRupees('');
      await loadRefunds();
      setRefreshMessage('Refund processed and balanced ledger entry recorded!');
      setTimeout(() => setRefreshMessage(null), 4000);
    } catch (err: any) {
      setRefundError(err.message || 'Refund processing failed');
    } finally {
      setIsRefunding(false);
    }
  };

  const isSuccess = payment.status === 'SUCCEEDED';
  const isFailed = payment.status === 'FAILED';
  const isUncertain = payment.status === 'UNCERTAIN';

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
      {/* Background ambient glow */}
      <div
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
          isSuccess
            ? 'bg-emerald-500/15'
            : isFailed
            ? 'bg-rose-500/15'
            : isUncertain
            ? 'bg-amber-500/20'
            : 'bg-teal-500/15'
        }`}
      />

      {/* Header Status & Amount */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              isSuccess
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isFailed
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : isUncertain
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-8 h-8" />}
            {isFailed && <XCircle className="w-8 h-8" />}
            {isUncertain && <HelpCircle className="w-8 h-8 text-amber-400" />}
            {!isSuccess && !isFailed && !isUncertain && <Clock className="w-8 h-8 animate-spin" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={payment.status} size="md" />
              <span className="text-xs text-slate-500 font-mono">Provider: {payment.provider}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {isSuccess && 'Payment Successfully Captured'}
              {isFailed && 'Payment Declined by Provider'}
              {isUncertain && 'Provider Timeout — Status Uncertain'}
              {!isSuccess && !isFailed && !isUncertain && 'Processing Payment Attempt'}
            </h3>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-400 block font-mono">Amount Processed</span>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono">
            {formatINR(payment.amountMinor)}
          </span>
          <span className="text-[11px] text-slate-500 block font-mono">
            {payment.amountMinor} paise • {payment.currency}
          </span>
        </div>
      </div>

      {/* Cross Navigation Action Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        <span className="text-xs text-slate-500 font-medium mr-1">Inspect In:</span>
        {onViewLedger && isSuccess && (
          <button
            onClick={() => onViewLedger(payment.id)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-400" />
            <span>Double-Entry Ledger</span>
          </button>
        )}

        {onViewRefunds && isSuccess && (
          <button
            onClick={() => onViewRefunds(payment.id)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            <span>Refunds Workspace</span>
          </button>
        )}

        {onViewWebhooks && (
          <button
            onClick={onViewWebhooks}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Webhook className="w-3.5 h-3.5 text-teal-400" />
            <span>Webhook Outbox</span>
          </button>
        )}

        {onViewTransactions && (
          <button
            onClick={onViewTransactions}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-teal-400" />
            <span>Transaction Log</span>
          </button>
        )}
      </div>

      {/* Uncertainty & Recovery Banner */}
      {isUncertain && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                Provider Timeout — Blind Retries Prevented
              </h4>
              <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                The mock provider timed out. Per fintech best practices, this attempt was marked as{' '}
                <strong>UNCERTAIN</strong> rather than blindly charged or retried. Use safe status inquiry to reconcile:
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1 pl-8">
            <button
              onClick={() => handleReconcile('SUCCESS')}
              disabled={isReconciling}
              className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Inquire & Reconcile as SUCCEEDED
            </button>
            <button
              onClick={() => handleReconcile('DECLINE')}
              disabled={isReconciling}
              className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Inquire & Reconcile as FAILED
            </button>
          </div>
        </div>
      )}

      {/* State Machine Transition Trace */}
      <div className="py-4 border-b border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
          State Machine Lifecycle & Transition Trace
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/30 flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <span className="text-slate-400 block font-mono">1. CREATED</span>
              <span className="text-slate-200 font-medium">Record initialized</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/30 flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <span className="text-slate-400 block font-mono">2. PROCESSING</span>
              <span className="text-slate-200 font-medium">Provider execution</span>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl bg-slate-900/60 border flex items-center space-x-2.5 ${
              isSuccess
                ? 'border-emerald-500/40'
                : isFailed
                ? 'border-rose-500/40'
                : 'border-amber-500/40'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                isSuccess
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isFailed
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {isSuccess ? '✓' : isFailed ? '✕' : '?'}
            </div>
            <div>
              <span className="text-slate-400 block font-mono">3. {payment.status}</span>
              <span className="text-slate-200 font-medium">
                {isSuccess
                  ? 'Terminal success'
                  : isFailed
                  ? 'Terminal failure'
                  : 'Requires reconciliation'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Refunds Management Section (Only for SUCCEEDED payments) */}
      {isSuccess && (
        <div className="py-4 border-b border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <RotateCcw className="w-4 h-4 text-purple-400" />
              <span>Refund Management</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Available to Refund:{' '}
              <strong className="text-emerald-400">{formatINR(remainingRefundableMinor)}</strong>
            </span>
          </div>

          {remainingRefundableMinor > 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="number"
                  placeholder="Partial Amount in ₹ (e.g. 500)"
                  value={refundAmountRupees}
                  onChange={(e) => setRefundAmountRupees(e.target.value)}
                  disabled={isRefunding}
                  className="w-full sm:flex-1 glass-input rounded-xl px-3.5 py-2 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleCreateRefund(false)}
                  disabled={isRefunding || !refundAmountRupees}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isRefunding ? 'Processing...' : 'Refund Partial'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateRefund(true)}
                  disabled={isRefunding}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer shadow-lg shadow-purple-600/20"
                >
                  Refund Full ({formatINR(remainingRefundableMinor)})
                </button>
              </div>

              {refundError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
                  {refundError}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>This payment is fully refunded. No additional refunds can be issued.</span>
            </div>
          )}

          {/* List of issued refunds */}
          {refunds.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Recorded Refunds History ({refunds.length}):
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                {refunds.map((ref: Refund) => (
                  <div
                    key={ref.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <span className="text-purple-400 font-semibold">{ref.refundReference}</span>
                      <span className="text-slate-500 ml-2">({ref.reason || 'Refund'})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-purple-300 font-bold">-{formatINR(ref.amountMinor)}</span>
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(ref.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction Details Table */}
      <div className="py-4 border-b border-slate-800 space-y-2.5 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-slate-900">
          <span className="text-slate-400 font-sans">Database UUID:</span>
          <div className="flex items-center space-x-1">
            <span className="text-slate-300 select-all">{payment.id}</span>
            <button onClick={() => handleCopy(payment.id, 'id')} className="p-1 text-slate-500 hover:text-white">
              {copiedKey === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-slate-900">
          <span className="text-slate-400 font-sans">Payment Reference:</span>
          <div className="flex items-center space-x-1">
            <span className="text-teal-400 select-all font-semibold">{payment.paymentReference}</span>
            <button onClick={() => handleCopy(payment.paymentReference, 'ref')} className="p-1 text-slate-500 hover:text-white">
              {copiedKey === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-slate-900">
          <span className="text-slate-400 font-sans">Order ID:</span>
          <span className="text-slate-300 select-all">{payment.orderId}</span>
        </div>

        {payment.failureReason && (
          <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-rose-900/40 bg-rose-500/5 px-2 rounded-lg">
            <span className="text-rose-400 font-sans font-bold flex items-center space-x-1">
              <AlertOctagon className="w-3.5 h-3.5 mr-1" /> Failure Reason:
            </span>
            <span className="text-rose-300 font-bold">{payment.failureReason}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between py-1">
          <span className="text-slate-400 font-sans">Created Timestamp:</span>
          <span className="text-slate-400">{new Date(payment.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Status verification message */}
      {refreshMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-300">
          {refreshMessage}
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleVerifyStatus}
          disabled={isRefreshing}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
          <span>Verify State Live in DB</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <span>Create Another Payment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
