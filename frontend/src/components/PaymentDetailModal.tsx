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
    }).format(minorUnits / 100);
  };

  const refunds = payment.refunds || [];
  const totalRefunded = refunds
    .filter((r) => r.status === 'SUCCEEDED' || r.status === 'PROCESSING')
    .reduce((sum, r) => sum + r.amountMinor, 0);
  const remainingRefundable = Math.max(0, payment.amountMinor - totalRefunded);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-7 border border-slate-700/80 shadow-2xl relative text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Payment Audit Record
              </span>
              <StatusBadge status={payment.status} />
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <h3 className="text-lg font-mono font-bold text-white select-all">
                {payment.paymentReference}
              </h3>
              <button
                onClick={() => handleCopy(payment.paymentReference, 'ref')}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Copy Reference"
              >
                {copiedKey === 'ref' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Captured Amount</span>
              <span className="text-base sm:text-lg font-mono font-extrabold text-emerald-400">
                {formatINR(payment.amountMinor)}
              </span>
              <span className="block text-[10px] text-slate-500 font-mono">
                {payment.amountMinor} paise
              </span>
            </div>

            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Total Refunded</span>
              <span className="text-base sm:text-lg font-mono font-extrabold text-purple-400">
                {formatINR(totalRefunded)}
              </span>
              <span className="block text-[10px] text-slate-500 font-mono">
                {refunds.length} refund(s)
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Remaining Balance</span>
              <span className="text-base sm:text-lg font-mono font-extrabold text-teal-300">
                {formatINR(remainingRefundable)}
              </span>
              <span className="block text-[10px] text-slate-500">Available to refund</span>
            </div>
          </div>

          {/* Payment Metadata Grid */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Database UUID:</span>
              <div className="flex items-center space-x-1 font-mono text-slate-300">
                <span className="truncate max-w-[240px] sm:max-w-none">{payment.id}</span>
                <button
                  onClick={() => handleCopy(payment.id, 'id')}
                  className="p-1 hover:text-white"
                >
                  {copiedKey === 'id' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Associated Order ID:</span>
              <div className="flex items-center space-x-1 font-mono text-slate-300">
                <span className="truncate max-w-[240px] sm:max-w-none">{payment.orderId}</span>
                <button
                  onClick={() => handleCopy(payment.orderId, 'orderId')}
                  className="p-1 hover:text-white"
                >
                  {copiedKey === 'orderId' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Simulated Outcome:</span>
              <span className="font-mono text-white font-medium">{payment.simulatedOutcome}</span>
            </div>

            {payment.failureReason && (
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60 text-rose-400">
                <span className="text-slate-400">Failure Reason:</span>
                <span className="font-medium">{payment.failureReason}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Provider Engine:</span>
              <span className="font-mono text-slate-300">{payment.provider}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Created Timestamp:</span>
              <span className="text-slate-300 font-mono">
                {new Date(payment.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {onViewLedger && payment.status === 'SUCCEEDED' && (
              <button
                onClick={() => {
                  onClose();
                  onViewLedger(payment.id);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
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
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Manage Refunds</span>
              </button>
            )}

            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-medium border border-slate-800 transition-colors cursor-pointer ml-auto"
            >
              <Code className="w-3.5 h-3.5 text-slate-400" />
              <span>{showRawJson ? 'Hide Raw JSON' : 'Inspect Raw JSON'}</span>
            </button>
          </div>

          {/* Raw JSON Accordion */}
          {showRawJson && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto text-emerald-400">
              <pre>{JSON.stringify(payment, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
