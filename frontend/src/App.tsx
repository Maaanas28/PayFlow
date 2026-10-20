import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { OrderSummary } from './components/OrderSummary';
import { PaymentStatusCard } from './components/PaymentStatusCard';
import { PaymentLookupModal } from './components/PaymentLookupModal';
import { TransactionsView } from './components/TransactionsView';
import { RefundsView } from './components/RefundsView';
import { LedgerView } from './components/LedgerView';
import { WebhooksView } from './components/WebhooksView';
import { ProductCatalogItem, SimulatedOutcome, PaymentAttempt } from './types';
import { api } from './services/api';
import { Sparkles, TerminalSquare, Info, ShieldCheck, Database } from 'lucide-react';

const DEFAULT_PRODUCT: ProductCatalogItem = {
  id: 'prod_sample_001',
  name: 'PayFlow Developer Sandbox Pass',
  description:
    'Full access pass to the PayFlow fintech payment engine sandbox, testing harnesses, and API simulation suite.',
  unitPriceMinor: 99900,
  currency: 'INR',
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('checkout');
  const [product, setProduct] = useState<ProductCatalogItem>(DEFAULT_PRODUCT);
  const [quantity, setQuantity] = useState<number>(1);
  const [outcome, setOutcome] = useState<SimulatedOutcome>('SUCCESS');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepDescription, setStepDescription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [completedPayment, setCompletedPayment] = useState<PaymentAttempt | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [lookupOpen, setLookupOpen] = useState<boolean>(false);

  // Cross-view deep linking states
  const [targetRefundPaymentId, setTargetRefundPaymentId] = useState<string | undefined>(undefined);
  const [targetLedgerPaymentId, setTargetLedgerPaymentId] = useState<string | undefined>(undefined);

  // Check backend health on mount
  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        await api.getHealth();
        if (mounted) setBackendOnline(true);
      } catch {
        if (mounted) setBackendOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch catalog products if available
  useEffect(() => {
    api
      .getProducts()
      .then((products) => {
        if (products && products.length > 0) {
          setProduct(products[0]);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_PRODUCT
      });
  }, [backendOnline]);

  const handlePay = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setCompletedPayment(null);

      // Step 1: Server-side Order Creation
      setStepDescription('1/2 Creating server-side order...');
      const order = await api.createOrder(product.id, quantity);

      // Step 2: Payment Attempt Creation & Deterministic Execution
      setStepDescription('2/2 Authorizing payment simulation...');
      const payment = await api.createPayment(order.id, outcome);

      setCompletedPayment(payment);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
      setStepDescription('');
    }
  };

  const handleReset = () => {
    setCompletedPayment(null);
    setError(null);
    setQuantity(1);
    setOutcome('SUCCESS');
  };

  // Cross-tab handlers
  const handleViewLedger = (paymentId: string) => {
    setTargetLedgerPaymentId(paymentId);
    setActiveTab('ledger');
  };

  const handleViewRefunds = (paymentId: string) => {
    setTargetRefundPaymentId(paymentId);
    setActiveTab('refunds');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        backendOnline={backendOnline}
        onOpenLookup={() => setLookupOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Offline Warning Banner */}
        {backendOnline === false && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start space-x-3 text-amber-200 text-xs sm:text-sm">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold">Backend Server Offline or Not Reachable</p>
              <p className="text-xs text-amber-300/80 mt-1">
                Make sure the backend is running on <code className="bg-slate-900 px-1.5 py-0.5 rounded font-mono">http://localhost:4000</code>.
                Run <code className="bg-slate-900 px-1.5 py-0.5 rounded font-mono">npm run dev</code> inside <code className="bg-slate-900 px-1.5 py-0.5 rounded font-mono">payflow-node/backend</code>.
              </p>
            </div>
          </div>
        )}

        {/* Tab 1: Checkout */}
        {activeTab === 'checkout' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Hero Section */}
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Fintech Sandbox</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Payment Gateway Checkout
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Experience end-to-end payment gateway fundamentals: strictly server-calculated totals,
                idempotency hash enforcement, deterministic state machines, and balanced double-entry accounting.
              </p>
            </div>

            {/* Checkout Interface */}
            {completedPayment ? (
              <PaymentStatusCard
                payment={completedPayment}
                onRefresh={(updated) => setCompletedPayment(updated)}
                onReset={handleReset}
                onViewLedger={handleViewLedger}
                onViewRefunds={handleViewRefunds}
                onViewTransactions={() => setActiveTab('transactions')}
                onViewWebhooks={() => setActiveTab('webhooks')}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6">
                  <ProductCard
                    product={product}
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    disabled={isProcessing}
                  />

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                    <div className="font-bold text-slate-300 flex items-center space-x-1.5">
                      <TerminalSquare className="w-4 h-4 text-teal-400" />
                      <span>Gateway Lifecycle Flow:</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 pl-5">
                      POST /api/v1/orders ➔ Order CREATED ➔ POST /api/v1/payments ➔ State Machine: CREATED ➔ PROCESSING ➔ {outcome === 'SUCCESS' ? 'SUCCEEDED (Ledger Posted & Webhook Emitted)' : outcome === 'DECLINE' ? 'FAILED' : 'UNCERTAIN'}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <OrderSummary
                    product={product}
                    quantity={quantity}
                    outcome={outcome}
                    onOutcomeChange={setOutcome}
                    onPay={handlePay}
                    isProcessing={isProcessing}
                    stepDescription={stepDescription}
                    error={error}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Transactions */}
        {activeTab === 'transactions' && (
          <div className="animate-in fade-in duration-200">
            <TransactionsView
              onNavigateToCheckout={() => setActiveTab('checkout')}
              onViewLedger={handleViewLedger}
              onViewRefunds={handleViewRefunds}
            />
          </div>
        )}

        {/* Tab 3: Refunds */}
        {activeTab === 'refunds' && (
          <div className="animate-in fade-in duration-200">
            <RefundsView
              initialPaymentId={targetRefundPaymentId}
              onNavigateToCheckout={() => setActiveTab('checkout')}
            />
          </div>
        )}

        {/* Tab 4: Ledger */}
        {activeTab === 'ledger' && (
          <div className="animate-in fade-in duration-200">
            <LedgerView
              initialPaymentId={targetLedgerPaymentId}
              onNavigateToCheckout={() => setActiveTab('checkout')}
            />
          </div>
        )}

        {/* Tab 5: Webhooks */}
        {activeTab === 'webhooks' && (
          <div className="animate-in fade-in duration-200">
            <WebhooksView onNavigateToCheckout={() => setActiveTab('checkout')} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>PayFlow Educational Sandbox Architecture • Node.js, Express, TypeScript, PostgreSQL & Prisma</p>
          <div className="flex items-center space-x-3 text-slate-400">
            <span className="flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>PostgreSQL 16</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Double-Entry Balanced</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Lookup Modal */}
      <PaymentLookupModal isOpen={lookupOpen} onClose={() => setLookupOpen(false)} />
    </div>
  );
};

export default App;
