import React from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, ArrowRight, Loader2, AlertTriangle, ShieldAlert, KeyRound } from 'lucide-react';
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
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-teal-400" />
            <span>Order Summary</span>
          </h3>
          <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 font-mono">
            Currency: INR
          </span>
        </div>

        {/* Pricing Breakdown */}
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>
              {product.name} <span className="text-slate-500">× {quantity}</span>
            </span>
            <span className="font-mono">{formatINR(totalMinor)}</span>
          </div>

          <div className="flex justify-between text-slate-400 text-xs">
            <span>Gateway Sandbox Processing Fee</span>
            <span className="font-mono text-emerald-400">₹0.00 (Free)</span>
          </div>

          <div className="flex justify-between text-slate-400 text-xs">
            <span>Server Pricing Verification</span>
            <span className="font-mono text-teal-400">Strict Server-side</span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
            <span className="text-base font-bold text-white">Total Amount Due</span>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {formatINR(totalMinor)}
              </span>
              <span className="block text-[10px] text-slate-500 font-mono">({totalMinor} integer minor units)</span>
            </div>
          </div>
        </div>

        {/* Idempotency Protection Notice */}
        <div className="mt-4 p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs flex items-center space-x-2 text-slate-300">
          <KeyRound className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>Protected with cryptographic <strong>Idempotency-Key</strong> per payment</span>
        </div>

        {/* Deterministic Outcome Selector */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Deterministic Sandbox Simulation Outcome
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onOutcomeChange('SUCCESS')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                outcome === 'SUCCESS'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <CheckCircle
                  className={`w-3.5 h-3.5 ${outcome === 'SUCCESS' ? 'text-emerald-400' : 'text-slate-500'}`}
                />
                <span className={`text-xs font-semibold ${outcome === 'SUCCESS' ? 'text-white' : 'text-slate-400'}`}>
                  Success
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                To <strong className="text-emerald-300">SUCCEEDED</strong>
              </p>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onOutcomeChange('DECLINE')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                outcome === 'DECLINE'
                  ? 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <XCircle
                  className={`w-3.5 h-3.5 ${outcome === 'DECLINE' ? 'text-rose-400' : 'text-slate-500'}`}
                />
                <span className={`text-xs font-semibold ${outcome === 'DECLINE' ? 'text-white' : 'text-slate-400'}`}>
                  Decline
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                To <strong className="text-rose-300">FAILED</strong>
              </p>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onOutcomeChange('TIMEOUT')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                outcome === 'TIMEOUT'
                  ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Clock
                  className={`w-3.5 h-3.5 ${outcome === 'TIMEOUT' ? 'text-amber-400' : 'text-slate-500'}`}
                />
                <span className={`text-xs font-semibold ${outcome === 'TIMEOUT' ? 'text-white' : 'text-slate-400'}`}>
                  Timeout
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                To <strong className="text-amber-300">UNCERTAIN</strong>
              </p>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">
              <span className="font-bold">Execution Error:</span> {error}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onPay}
          disabled={isProcessing}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{stepDescription || 'Processing Payment...'}</span>
            </>
          ) : (
            <>
              <span>Authorize & Pay {formatINR(totalMinor)}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Mandatory Disclaimer */}
        <div className="mt-4 flex items-center justify-center space-x-1.5 text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg py-2 px-3 text-center">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">Sandbox only — no real money is processed.</span>
        </div>
      </div>
    </div>
  );
};
