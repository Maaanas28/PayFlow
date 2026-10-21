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
    <div className="bg-[#050505] border border-neutral-850 hover:border-neutral-800 rounded-md p-5 sm:p-6 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-sm bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-300 font-mono px-1.5 py-0.5 rounded-sm bg-neutral-900 border border-neutral-800">
                CATALOG SECURITY
              </span>
              <span className="text-[10px] font-mono text-neutral-500">ID: {product.id}</span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight mt-1 font-mono">
              {product.name}
            </h2>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold text-white font-mono tabular-nums">
            {formatINR(product.unitPriceMinor)}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono block">
            {product.unitPriceMinor} minor units
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs text-neutral-400 leading-relaxed font-sans">
        {product.description}
      </p>

      <div className="mt-5 pt-4 border-t border-neutral-900 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
            Select Order Quantity
          </span>
          <div className="inline-flex items-center bg-black border border-neutral-800 rounded-sm p-0.5">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={disabled || quantity <= 1}
              className="w-7 h-7 rounded-sm flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-bold text-white font-mono text-xs tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange(Math.min(10, quantity + 1))}
              disabled={disabled || quantity >= 10}
              className="w-7 h-7 rounded-sm flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
            Subtotal (Client Preview)
          </span>
          <span className="text-lg font-bold text-white font-mono tabular-nums">
            {formatINR(product.unitPriceMinor * quantity)}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-1.5 text-[11px] font-mono text-neutral-400 bg-black rounded-sm p-3 border border-neutral-850">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
          <span>Server recalculates and asserts total amount to prevent client-side tampering</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
          <span>Explicit INR currency & integer minor units representation (99900 = ₹999.00)</span>
        </div>
      </div>
    </div>
  );
};
