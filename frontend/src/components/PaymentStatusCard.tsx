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
    <div className="bg-[#050505] rounded-sm p-6 sm:p-8 border border-neutral-850 space-y-6 font-mono">
      {/* Header Status & Amount */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-900 gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-sm flex items-center justify-center border border-neutral-800 bg-neutral-900 text-white shrink-0">
            {isSuccess && <CheckCircle2 className="w-6 h-6 text-white" />}
            {isFailed && <XCircle className="w-6 h-6 text-white" />}
            {isUncertain && <HelpCircle className="w-6 h-6 text-neutral-400" />}
            {!isSuccess && !isFailed && !isUncertain && <Clock className="w-6 h-6 animate-spin text-white" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={payment.status} size="md" />
              <span className="text-[11px] text-neutral-500 font-mono tracking-wider">GATEWAY: {payment.provider}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1 font-sans tracking-tight">
              {isSuccess && 'Payment Successfully Captured'}
              {isFailed && 'Payment Declined by Provider'}
              {isUncertain && 'Provider Timeout — Status Uncertain'}
              {!isSuccess && !isFailed && !isUncertain && 'Processing Payment Attempt'}
            </h3>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider block">Gross Captured</span>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
            {formatINR(payment.amountMinor)}
          </span>
          <span className="text-[10px] text-neutral-500 block uppercase tracking-wider font-mono">
            {payment.amountMinor} minor units • {payment.currency}
          </span>
        </div>
      </div>

      {/* Cross Navigation Action Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        <span className="text-[11px] text-neutral-500 uppercase tracking-wider mr-1">Inspect In:</span>
        {onViewLedger && isSuccess && (
          <button
            onClick={() => onViewLedger(payment.id)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-sm text-xs font-mono transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-white" />
            <span>Double-Entry Ledger</span>
          </button>
        )}

        {onViewRefunds && isSuccess && (
          <button
            onClick={() => onViewRefunds(payment.id)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-sm text-xs font-mono transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white" />
            <span>Refunds Desk</span>
          </button>
        )}

        {onViewWebhooks && (
          <button
            onClick={onViewWebhooks}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-sm text-xs font-mono transition-colors cursor-pointer"
          >
            <Webhook className="w-3.5 h-3.5 text-neutral-400" />
            <span>Webhook Outbox</span>
          </button>
        )}

        {onViewTransactions && (
          <button
            onClick={onViewTransactions}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-sm text-xs font-mono transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-neutral-400" />
            <span>Transaction Log</span>
          </button>
        )}
      </div>

      {/* Uncertainty & Recovery Banner */}
      {isUncertain && (
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-sm space-y-3 font-mono">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-neutral-300 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Provider Timeout — Blind Retries Prevented
              </h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                The mock provider timed out. Per institutional best practices, this attempt was marked as{' '}
                <strong className="text-white">UNCERTAIN</strong> rather than blindly charged or retried. Use safe status inquiry to reconcile:
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1 pl-8">
            <button
              onClick={() => handleReconcile('SUCCESS')}
              disabled={isReconciling}
              className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-sm text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Inquire & Reconcile as SUCCEEDED
            </button>
            <button
              onClick={() => handleReconcile('DECLINE')}
              disabled={isReconciling}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-sm text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Inquire & Reconcile as FAILED
            </button>
          </div>
        </div>
      )}

      {/* State Machine Transition Trace */}
      <div className="py-4 border-b border-neutral-900">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-3 font-mono">
          State Machine Lifecycle & Transition Trace
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-sm bg-black border border-neutral-800 flex items-center space-x-2.5">
            <div className="w-5 h-5 rounded-sm bg-neutral-900 text-white flex items-center justify-center font-bold text-xs border border-neutral-700">
              ✓
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase tracking-wider">1. CREATED</span>
              <span className="text-neutral-200 text-xs">Record initialized</span>
            </div>
          </div>

          <div className="p-3 rounded-sm bg-black border border-neutral-800 flex items-center space-x-2.5">
            <div className="w-5 h-5 rounded-sm bg-neutral-900 text-white flex items-center justify-center font-bold text-xs border border-neutral-700">
              ✓
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase tracking-wider">2. PROCESSING</span>
              <span className="text-neutral-200 text-xs">Provider execution</span>
            </div>
          </div>

          <div className="p-3 rounded-sm bg-black border border-neutral-800 flex items-center space-x-2.5">
            <div className="w-5 h-5 rounded-sm bg-neutral-900 text-white flex items-center justify-center font-bold text-xs border border-neutral-700">
              {isSuccess ? '✓' : isFailed ? '✕' : '?'}
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase tracking-wider">3. {payment.status}</span>
              <span className="text-neutral-200 text-xs">
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
        <div className="py-4 border-b border-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center space-x-1.5 font-mono">
              <RotateCcw className="w-4 h-4 text-white" />
              <span>Refund Desk</span>
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Available to Refund:{' '}
              <strong className="text-white tabular-nums">{formatINR(remainingRefundableMinor)}</strong>
            </span>
          </div>

          {remainingRefundableMinor > 0 ? (
            <div className="p-4 rounded-sm bg-black border border-neutral-850 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="number"
                  placeholder="Partial Amount in ₹ (e.g. 500)"
                  value={refundAmountRupees}
                  onChange={(e) => setRefundAmountRupees(e.target.value)}
                  disabled={isRefunding}
                  className="w-full sm:flex-1 bg-black border border-neutral-800 rounded-sm px-3.5 py-2 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                />
                <button
                  type="button"
                  onClick={() => handleCreateRefund(false)}
                  disabled={isRefunding || !refundAmountRupees}
                  className="w-full sm:w-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-sm text-xs font-mono disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isRefunding ? 'Processing...' : 'Refund Partial'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateRefund(true)}
                  disabled={isRefunding}
                  className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-neutral-200 text-black font-bold rounded-sm text-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Refund Full ({formatINR(remainingRefundableMinor)})
                </button>
              </div>

              {refundError && (
                <div className="p-2.5 bg-neutral-900 border border-red-900/40 rounded-sm text-xs text-red-300 font-mono">
                  {refundError}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-black border border-neutral-850 rounded-sm text-xs text-neutral-400 flex items-center space-x-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
              <span>This payment is fully refunded. No additional refunds can be issued.</span>
            </div>
          )}

          {/* List of issued refunds */}
          {refunds.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">
                Recorded Reversals ({refunds.length}):
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                {refunds.map((ref: Refund) => (
                  <div
                    key={ref.id}
                    className="p-2.5 rounded-sm bg-black border border-neutral-850 flex justify-between items-center"
                  >
                    <div>
                      <span className="text-white font-semibold">{ref.refundReference}</span>
                      <span className="text-neutral-500 ml-2">({ref.reason || 'Refund'})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold tabular-nums">-{formatINR(ref.amountMinor)}</span>
                      <span className="text-[10px] text-neutral-500 block">
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
      <div className="py-4 border-b border-neutral-900 space-y-2.5 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-neutral-900/60">
          <span className="text-neutral-500 text-[11px] uppercase tracking-wider">Database UUID</span>
          <div className="flex items-center space-x-1">
            <span className="text-neutral-300 select-all">{payment.id}</span>
            <button onClick={() => handleCopy(payment.id, 'id')} className="p-1 text-neutral-500 hover:text-white cursor-pointer">
              {copiedKey === 'id' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-neutral-900/60">
          <span className="text-neutral-500 text-[11px] uppercase tracking-wider">Payment Reference</span>
          <div className="flex items-center space-x-1">
            <span className="text-white select-all font-semibold">{payment.paymentReference}</span>
            <button onClick={() => handleCopy(payment.paymentReference, 'ref')} className="p-1 text-neutral-500 hover:text-white cursor-pointer">
              {copiedKey === 'ref' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-neutral-900/60">
          <span className="text-neutral-500 text-[11px] uppercase tracking-wider">Order ID</span>
          <span className="text-neutral-300 select-all">{payment.orderId}</span>
        </div>

        {payment.failureReason && (
          <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border border-red-900/40 bg-neutral-900 px-2 rounded-sm">
            <span className="text-red-400 font-bold flex items-center space-x-1">
              <AlertOctagon className="w-3.5 h-3.5 mr-1" /> Failure Reason:
            </span>
            <span className="text-red-300 font-bold">{payment.failureReason}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between py-1">
          <span className="text-neutral-500 text-[11px] uppercase tracking-wider">Timestamp</span>
          <span className="text-neutral-400">{new Date(payment.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Status verification message */}
      {refreshMessage && (
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-sm text-center text-xs text-white font-mono">
          {refreshMessage}
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleVerifyStatus}
          disabled={isRefreshing}
          className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-neutral-900 text-neutral-300 rounded-sm text-xs font-mono flex items-center justify-center space-x-2 border border-neutral-800 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
          <span>Verify State Live in DB</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto px-5 py-2 bg-white hover:bg-neutral-200 text-black font-bold rounded-sm text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <span>Create Another Payment</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
};
