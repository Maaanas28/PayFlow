export type OrderStatus = 'CREATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type PaymentStatus = 'CREATED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'UNCERTAIN';
export type SimulatedOutcome = 'SUCCESS' | 'DECLINE' | 'TIMEOUT';

export type LedgerAccountType = 'CUSTOMER_FUNDS' | 'MERCHANT_SETTLEMENT' | 'GATEWAY_FEES';
export type LedgerEntryDirection = 'DEBIT' | 'CREDIT';
export type RefundStatus = 'CREATED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
export type WebhookEventStatus = 'PENDING' | 'DELIVERED' | 'FAILED';

export interface ProductCatalogItem {
  id: string;
  name: string;
  description: string;
  unitPriceMinor: number;
  currency: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceMinor: number;
  totalPriceMinor: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  payments?: PaymentAttempt[];
}

export interface PaymentAttempt {
  id: string;
  paymentReference: string;
  orderId: string;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  simulatedOutcome: string;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  refunds?: Refund[];
}

export interface Refund {
  id: string;
  refundReference: string;
  paymentAttemptId: string;
  amountMinor: number;
  currency: string;
  reason?: string | null;
  status: RefundStatus;
  createdAt: string;
  paymentAttempt?: PaymentAttempt;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountType: LedgerAccountType;
  direction: LedgerEntryDirection;
  amountMinor: number;
  currency: string;
  createdAt: string;
}

export interface LedgerTransaction {
  id: string;
  referenceType: string;
  referenceId: string;
  description: string;
  createdAt: string;
  entries: LedgerEntry[];
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  payload: Record<string, any>;
  targetUrl?: string | null;
  status: WebhookEventStatus;
  attempts: number;
  maxAttempts?: number;
  nextRetryAt?: string | null;
  lastError?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    isSimulation: boolean;
    disclaimer: string;
    timestamp: string;
  };
}
