import React from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  KeyRound,
} from 'lucide-react';
import { ProductCatalogItem, SimulatedOutcome } from '../types';

interface OrderSummaryProps {
  product: ProductCatalogItem;
  quantity: number;
  outcome: SimulatedOutcome;
  onOutcomeChange: (outcome: SimulatedOutcome) => void;
  onPay: () => void;
  isProcessing: boolean;
  stepDescription: string;
  error: string | null;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  product,
  quantity,
  outcome,
  onOutcomeChange,
  onPay,
  isProcessing,
  stepDescription,
  error,
}) => {
  const formatINR = (minorUnits: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(minorUnits / 100);
  };

  const totalMinor = product.unitPriceMinor * quantity;

  return (
    <div className="bg-[#050505] border border-neutral-850 hover:border-neutral-800 rounded-md p-5 sm:p-6 flex flex-col justify-between transition-all">
      <div>
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-900">
          <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-white" />
            <span className="uppercase tracking-wider">EXECUTION DESK SUMMARY</span>
          </h3>
          <span className="text-[10px] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-sm text-neutral-300 font-mono">
            BASE: INR (PAISE)
          </span>
        </div>

        {/* Pricing Breakdown */}
        <div className="mt-4 space-y-3 text-xs font-mono">
          <div className="flex justify-between text-neutral-300">
            <span>
              {product.name} <span className="text-neutral-500">× {quantity}</span>
            </span>
            <span className="tabular-nums font-semibold text-white">{formatINR(totalMinor)}</span>
          </div>

          <div className="flex justify-between text-neutral-400">
            <span>Sandbox Protocol Fee</span>
            <span className="tabular-nums text-neutral-300">₹0.00 (ZERO_FEE)</span>
          </div>

          <div className="flex justify-between text-neutral-400">
            <span>Server Pricing Invariant</span>
            <span className="tabular-nums text-neutral-300">Authoritative Server</span>
          </div>

          <div className="pt-3 border-t border-neutral-900 flex justify-between items-baseline">
            <span className="text-sm font-bold text-white uppercase tracking-wider">TOTAL DUE:</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-white font-mono tabular-nums tracking-tight">
                {formatINR(totalMinor)}
              </span>
              <span className="block text-[10px] text-neutral-500 font-mono">
                ({totalMinor.toLocaleString()} integer paise)
              </span>
            </div>
          </div>
        </div>

        {/* Idempotency Protection Notice */}
        <div className="mt-4 p-2.5 bg-black border border-neutral-850 rounded-sm text-xs flex items-center space-x-2 text-neutral-400 font-mono">
          <KeyRound className="w-4 h-4 text-neutral-300 flex-shrink-0" />
          <span className="text-[11px]">
            Protected with unique SHA-256 <strong className="text-white">Idempotency-Key</strong>
          </span>
        </div>

        {/* Deterministic Outcome Selector */}
        <div className="mt-5 pt-4 border-t border-neutral-900">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono block mb-2">
            Deterministic Sandbox Outcome State
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onOutcomeChange('SUCCESS')}
              className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer font-mono ${
                outcome === 'SUCCESS'
                  ? 'border-neutral-400 bg-neutral-900 text-white shadow-sm'
                  : 'border-neutral-850 bg-black hover:border-neutral-700 text-neutral-400'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <CheckCircle
                  className={`w-3.5 h-3.5 ${outcome === 'SUCCESS' ? 'text-white' : 'text-neutral-500'}`}
                />
                <span className={`text-xs font-bold ${outcome === 'SUCCESS' ? 'text-white' : 'text-neutral-400'}`}>
                  Success
                </span>
              </div>
              <p className="mt-1 text-[10px] text-neutral-400">
                To <strong className="text-white">SUCCEEDED</strong>
              </p>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onOutcomeChange('DECLINE')}
              className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer font-mono ${
                outcome === 'DECLINE'
                  ? 'border-neutral-400 bg-neutral-900 text-white shadow-sm'
                  : 'border-neutral-850 bg-black hover:border-neutral-700 text-neutral-400'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <XCircle
                  className={`w-3.5 h-3.5 ${outcome === 'DECLINE' ? 'text-white' : 'text-neutral-500'}`}
                />
                <span className={`text-xs font-bold ${outcome === 'DECLINE' ? 'text-white' : 'text-neutral-400'}`}>
                  Decline
                </span>
              </div>
              <p className="mt-1 text-[10px] text-neutral-400">
                To <strong className="text-white">FAILED</strong>
              </p>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onOutcomeChange('TIMEOUT')}
              className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer font-mono ${
                outcome === 'TIMEOUT'
                  ? 'border-neutral-400 bg-neutral-900 text-white shadow-sm'
                  : 'border-neutral-850 bg-black hover:border-neutral-700 text-neutral-400'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Clock
                  className={`w-3.5 h-3.5 ${outcome === 'TIMEOUT' ? 'text-white' : 'text-neutral-500'}`}
                />
                <span className={`text-xs font-bold ${outcome === 'TIMEOUT' ? 'text-white' : 'text-neutral-400'}`}>
                  Timeout
                </span>
              </div>
              <p className="mt-1 text-[10px] text-neutral-400">
                To <strong className="text-white">UNCERTAIN</strong>
              </p>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-neutral-900 border border-red-900/40 rounded-sm flex items-start space-x-2 text-red-300 text-xs font-mono">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <div className="flex-1">
              <span className="font-bold">EXECUTION_ERROR:</span> {error}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-neutral-900">
        <button
          type="button"
          onClick={onPay}
          disabled={isProcessing}
          className="w-full py-3 px-4 bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-sm shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:translate-y-[0.5px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>{stepDescription || 'AUTHORIZING TRANSACTION...'}</span>
            </>
          ) : (
            <>
              <span>AUTHORIZE & DISPATCH {formatINR(totalMinor)}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </>
          )}
        </button>

        {/* Sandbox Disclaimer */}
        <div className="mt-3 flex items-center justify-center space-x-1.5 text-[11px] font-mono text-neutral-400 bg-black border border-neutral-850 rounded-sm py-1.5 px-3 text-center">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-neutral-500" />
          <span>Sandbox mode only — mock ledger simulation, no real currency processed.</span>
        </div>
      </div>
    </div>
  );
};
