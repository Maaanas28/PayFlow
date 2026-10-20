import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Code,
} from 'lucide-react';
import { PaymentAttempt } from '../types';
import { StatusBadge } from './Badge';

interface PaymentDetailModalProps {
  payment: PaymentAttempt | null;
  onClose: () => void;
  onViewLedger?: (paymentId: string) => void;
  onViewRefunds?: (paymentId: string) => void;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  payment,
  onClose,
  onViewLedger,
  onViewRefunds,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  if (!payment) return null;

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

  const refunds = payment.refunds || [];
  const totalRefunded = refunds
    .filter((r) => r.status === 'SUCCEEDED' || r.status === 'PROCESSING')
    .reduce((sum, r) => sum + r.amountMinor, 0);
  const remainingRefundable = Math.max(0, payment.amountMinor - totalRefunded);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0d131f] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm p-5 sm:p-6 border border-[#1b253b] shadow-2xl relative font-mono text-xs text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-[#182030]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                PAYMENT AUDIT RECORD
              </span>
              <StatusBadge status={payment.status} size="sm" />
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <h3 className="text-sm font-mono font-bold text-white select-all">
                {payment.paymentReference}
              </h3>
              <button
                onClick={() => handleCopy(payment.paymentReference, 'ref')}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#121824] transition-colors cursor-pointer"
                title="Copy Reference"
              >
                {copiedKey === 'ref' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-slate-400 hover:text-white hover:bg-[#121824] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-4">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#101520] rounded-sm border border-[#182030]">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                Captured Amount
              </span>
              <span className="text-base font-bold text-emerald-400 tabular-nums">
                {formatINR(payment.amountMinor)}
              </span>
              <span className="block text-[10px] text-slate-500 tabular-nums">
                {payment.amountMinor} paise
              </span>
            </div>

            <div className="p-3 bg-[#101520] rounded-sm border border-[#182030]">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                Total Refunded
              </span>
              <span className="text-base font-bold text-amber-400 tabular-nums">
                {formatINR(totalRefunded)}
              </span>
              <span className="block text-[10px] text-slate-500">
                {refunds.length} record(s)
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 bg-[#101520] rounded-sm border border-[#182030]">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                Remaining Balance
              </span>
              <span className="text-base font-bold text-cyan-300 tabular-nums">
                {formatINR(remainingRefundable)}
              </span>
              <span className="block text-[10px] text-slate-500">Available to refund</span>
            </div>
          </div>

          {/* Payment Metadata Grid */}
          <div className="bg-[#101520] rounded-sm p-3.5 border border-[#182030] space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#182030]/60">
              <span className="text-slate-400">Database UUID:</span>
              <div className="flex items-center space-x-1 text-slate-300">
                <span className="truncate max-w-[240px] sm:max-w-none">{payment.id}</span>
                <button
                  onClick={() => handleCopy(payment.id, 'id')}
                  className="p-0.5 hover:text-white cursor-pointer"
                >
                  {copiedKey === 'id' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#182030]/60">
              <span className="text-slate-400">Associated Order ID:</span>
              <div className="flex items-center space-x-1 text-slate-300">
                <span className="truncate max-w-[240px] sm:max-w-none">{payment.orderId}</span>
                <button
                  onClick={() => handleCopy(payment.orderId, 'orderId')}
                  className="p-0.5 hover:text-white cursor-pointer"
                >
                  {copiedKey === 'orderId' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#182030]/60">
              <span className="text-slate-400">Simulated Outcome:</span>
              <span className="text-white font-medium">{payment.simulatedOutcome}</span>
            </div>

            {payment.failureReason && (
              <div className="flex justify-between items-center py-1 border-b border-[#182030]/60 text-rose-400">
                <span>Failure Reason:</span>
                <span className="font-medium">{payment.failureReason}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 border-b border-[#182030]/60">
              <span className="text-slate-400">Provider Engine:</span>
              <span className="text-slate-300">{payment.provider}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Created Timestamp:</span>
              <span className="text-slate-300 tabular-nums">
                {new Date(payment.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {onViewLedger && payment.status === 'SUCCEEDED' && (
              <button
                onClick={() => {
                  onClose();
                  onViewLedger(payment.id);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#151e2f] hover:bg-[#1c283f] text-cyan-400 rounded-sm text-xs font-semibold border border-[#23304b] transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>View Double-Entry Ledger</span>
              </button>
            )}

            {onViewRefunds && payment.status === 'SUCCEEDED' && (
              <button
                onClick={() => {
                  onClose();
                  onViewRefunds(payment.id);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#151e2f] hover:bg-[#1c283f] text-cyan-400 rounded-sm text-xs font-semibold border border-[#23304b] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Manage Reversals</span>
              </button>
            )}

            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#101622] hover:bg-[#151c2a] text-slate-300 rounded-sm text-xs font-medium border border-[#182030] transition-colors cursor-pointer ml-auto"
            >
              <Code className="w-3.5 h-3.5 text-slate-400" />
              <span>{showRawJson ? 'Hide Raw JSON' : 'Inspect Raw JSON'}</span>
            </button>
          </div>

          {/* Raw JSON Accordion */}
          {showRawJson && (
            <div className="p-3.5 bg-[#080d15] rounded-sm border border-[#182030] text-xs font-mono overflow-x-auto text-emerald-400 max-h-60">
              <pre>{JSON.stringify(payment, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
