import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { Sidebar } from './components/Sidebar';
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
import { TerminalSquare, Info, ShieldCheck, Database } from 'lucide-react';
import { Badge } from './components/Badge';
import { LandingPage } from './components/LandingPage';

const DEFAULT_PRODUCT: ProductCatalogItem = {
  id: 'prod_sample_001',
  name: 'PayFlow Developer Sandbox Pass',
  description:
    'Full access pass to the PayFlow fintech payment engine sandbox, testing harnesses, and API simulation suite.',
  unitPriceMinor: 99900,
  currency: 'INR',
};

export const App: React.FC = () => {
  // View mode: 'landing' vs 'app'
  const [viewMode, setViewMode] = useState<'landing' | 'app'>(() => {
    const hash = window.location.hash.toLowerCase();
    if (['#terminal', '#checkout', '#transactions', '#refunds', '#ledger', '#webhooks'].includes(hash)) {
      return 'app';
    }
    return 'landing';
  });

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

  // Sidebar Layout States (Finance OS style)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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

  // Keyboard shortcut: Ctrl + K opens lookup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setLookupOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync viewMode and activeTab with URL hash for seamless bookmarking/history
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (['#terminal', '#checkout', '#transactions', '#refunds', '#ledger', '#webhooks'].includes(hash)) {
        setViewMode('app');
        if (hash === '#transactions') setActiveTab('transactions');
        else if (hash === '#refunds') setActiveTab('refunds');
        else if (hash === '#ledger') setActiveTab('ledger');
        else if (hash === '#webhooks') setActiveTab('webhooks');
        else setActiveTab('checkout');
      } else if (hash === '#landing' || hash === '' || hash === '#') {
        setViewMode('landing');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleEnterApp = (tab: NavTab = 'checkout') => {
    setActiveTab(tab);
    setViewMode('app');
    window.location.hash = `#${tab}`;
  };

  const handleGoToLanding = () => {
    setViewMode('landing');
    window.location.hash = '#landing';
  };

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

  // If viewing the Landing Page
  if (viewMode === 'landing') {
    return <LandingPage onEnterApp={handleEnterApp} backendOnline={backendOnline} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#080b10] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Finance OS Institutional Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        backendOnline={backendOnline}
        onOpenLookup={() => setLookupOpen(true)}
        onGoToLanding={handleGoToLanding}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Command Bar */}
        <Header
          backendOnline={backendOnline}
          onOpenLookup={() => setLookupOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onGoToLanding={handleGoToLanding}
        />

        {/* Scrollable Viewport with Terminal Grid */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 terminal-grid">
          {/* Offline Warning Banner */}
          {backendOnline === false && (
            <div className="p-3 bg-[#2a0e14] border border-[#6b1d28] rounded-sm flex items-start space-x-3 text-rose-300 text-xs font-mono">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold">BACKEND_GATEWAY_OFFLINE</p>
                <p className="text-[11px] text-rose-400/90 mt-0.5">
                  Unable to establish connection to core payment gateway at{' '}
                  <code className="bg-[#121824] px-1 py-0.2 rounded border border-[#222d42]">
                    /api/v1/health
                  </code>
                  . Verify your server process or environment variables.
                </p>
              </div>
            </div>
          )}

          {/* Tab 1: Checkout Terminal */}
          {activeTab === 'checkout' && (
            <div className="space-y-6">
              {/* Header Command Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#182030]">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
                      PAYMENT CHECKOUT TERMINAL
                    </h1>
                    <Badge variant="live" size="xs">
                      SANDBOX DESK
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Deterministic order authorization, idempotency SHA-256 verification, and double-entry capture
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="px-2.5 py-1 rounded-sm bg-[#0d131f] border border-[#1b253b] text-slate-400">
                    PROVIDER: <span className="text-emerald-400 font-bold">MOCK_SANDBOX</span>
                  </div>
                </div>
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7 space-y-5">
                    <ProductCard
                      product={product}
                      quantity={quantity}
                      onQuantityChange={setQuantity}
                      disabled={isProcessing}
                    />

                    <div className="p-3.5 rounded-sm bg-[#0d131f] border border-[#1b253b] text-xs font-mono space-y-1.5">
                      <div className="font-bold text-slate-200 flex items-center space-x-1.5">
                        <TerminalSquare className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="uppercase text-[11px] tracking-wider">GATEWAY PROTOCOL SEQUENCE:</span>
                      </div>
                      <div className="text-[11px] text-slate-400 pl-5 leading-relaxed">
                        POST /api/v1/orders ➔ Order CREATED ➔ POST /api/v1/payments (Idempotency-Key) ➔ State Machine: CREATED ➔ PROCESSING ➔{' '}
                        <span className={outcome === 'SUCCESS' ? 'text-emerald-400 font-bold' : outcome === 'DECLINE' ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                          {outcome === 'SUCCESS' ? 'SUCCEEDED [Ledger Posted & Webhook Emitted]' : outcome === 'DECLINE' ? 'FAILED' : 'UNCERTAIN'}
                        </span>
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
            <TransactionsView
              onNavigateToCheckout={() => setActiveTab('checkout')}
              onViewLedger={handleViewLedger}
              onViewRefunds={handleViewRefunds}
            />
          )}

          {/* Tab 3: Refunds */}
          {activeTab === 'refunds' && (
            <RefundsView
              initialPaymentId={targetRefundPaymentId}
              onNavigateToCheckout={() => setActiveTab('checkout')}
            />
          )}

          {/* Tab 4: Ledger */}
          {activeTab === 'ledger' && (
            <LedgerView
              initialPaymentId={targetLedgerPaymentId}
              onNavigateToCheckout={() => setActiveTab('checkout')}
            />
          )}

          {/* Tab 5: Webhooks */}
          {activeTab === 'webhooks' && (
            <WebhooksView onNavigateToCheckout={() => setActiveTab('checkout')} />
          )}

          {/* Bottom Telemetry Footer */}
          <footer className="pt-6 pb-2 border-t border-[#182030] text-[11px] font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              PayFlow Sandbox Financial Architecture • TypeScript, Express, PostgreSQL & Prisma
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>PostgreSQL 16</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ledger Invariant Checked</span>
              </span>
            </div>
          </footer>
        </main>
      </div>

      {/* Audit Lookup Modal */}
      <PaymentLookupModal isOpen={lookupOpen} onClose={() => setLookupOpen(false)} />
    </div>
  );
};

export default App;
