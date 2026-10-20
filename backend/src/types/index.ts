import {
  OrderStatus,
  PaymentStatus,
  Order,
  PaymentAttempt,
  IdempotencyRecord,
  IdempotencyStatus,
  LedgerEntryDirection,
  LedgerAccountType,
  LedgerTransaction,
  LedgerEntry,
  RefundStatus,
  Refund,
  WebhookEventStatus,
  WebhookEvent,
} from '@prisma/client';

export {
  OrderStatus,
  PaymentStatus,
  Order,
  PaymentAttempt,
  IdempotencyRecord,
  IdempotencyStatus,
  LedgerEntryDirection,
  LedgerAccountType,
  LedgerTransaction,
  LedgerEntry,
  RefundStatus,
  Refund,
  WebhookEventStatus,
  WebhookEvent,
};

export interface ProductCatalogItem {
  id: string;
  name: string;
  description: string;
  unitPriceMinor: number; // e.g. 99900 for INR 999.00
  currency: 'INR';
}

export type SimulatedOutcome = 'SUCCESS' | 'DECLINE' | 'TIMEOUT';

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
