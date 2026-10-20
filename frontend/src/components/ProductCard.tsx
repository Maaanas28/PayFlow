import React from 'react';
import { Package, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { ProductCatalogItem } from '../types';

interface ProductCardProps {
  product: ProductCatalogItem;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  disabled?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity,
  onQuantityChange,
  disabled = false,
}) => {
  const formatINR = (minorUnits: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(minorUnits / 100);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden shadow-xl border border-slate-800 hover:border-slate-700/60 transition-all">
      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Fixed Catalog Item</span>
            <h2 className="text-lg font-bold text-white tracking-tight">{product.name}</h2>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white">{formatINR(product.unitPriceMinor)}</div>
          <span className="text-xs text-slate-400 font-mono">per sandbox license</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-300 leading-relaxed">
        {product.description}
      </p>

      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Select Quantity</span>
          <div className="inline-flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={disabled || quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-bold text-white font-mono text-sm">{quantity}</span>
            <button
              onClick={() => onQuantityChange(Math.min(10, quantity + 1))}
              disabled={disabled || quantity >= 10}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block">Subtotal (Client Preview)</span>
          <span className="text-lg font-extrabold text-emerald-400 font-mono">
            {formatINR(product.unitPriceMinor * quantity)}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-xs text-slate-400 bg-slate-900/40 rounded-xl p-3 border border-slate-800/50">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>Server recalculates and asserts total amount to prevent client-side tampering</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>Explicit INR currency & integer minor units representation (99900 = ₹999.00)</span>
        </div>
      </div>
    </div>
  );
};
