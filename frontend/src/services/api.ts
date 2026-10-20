import {
  Order,
  PaymentAttempt,
  ProductCatalogItem,
  SimulatedOutcome,
  ApiResponse,
  Refund,
  LedgerTransaction,
  WebhookEvent,
} from '../types';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
export const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const body: ApiResponse<T> = await res.json();

  if (!res.ok || !body.success) {
    let errorMsg = body.error?.message || `Request failed with status ${res.status}`;
    if (body.error?.details && Array.isArray(body.error.details) && body.error.details.length > 0) {
      const issueDetails = (body.error.details as any[])
        .map((d) => (d.message ? `${d.path ? d.path + ': ' : ''}${d.message}` : JSON.stringify(d)))
        .join(', ');
      errorMsg = `${errorMsg} (${issueDetails})`;
    }
    const err = new Error(errorMsg) as Error & { code?: string; details?: unknown };
    err.code = body.error?.code;
    err.details = body.error?.details;
    throw err;
  }

  return body.data as T;
}

export const api = {
  getHealth: async (): Promise<{ status: string; service: string; version: string }> => {
    const res = await fetch(`${BASE_URL}/api/v1/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  getProducts: async (): Promise<ProductCatalogItem[]> => {
    return request<ProductCatalogItem[]>('/api/v1/orders/products');
  },

  createOrder: async (productId: string, quantity: number): Promise<Order> => {
    return request<Order>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  createPayment: async (
    orderId: string,
    simulatedOutcome: SimulatedOutcome,
    idempotencyKey?: string
  ): Promise<PaymentAttempt> => {
    const key = idempotencyKey || `ik_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return request<PaymentAttempt>('/api/v1/payments', {
      method: 'POST',
      headers: {
        'Idempotency-Key': key,
      },
      body: JSON.stringify({ orderId, simulatedOutcome }),
    });
  },

  reconcilePayment: async (
    paymentIdOrRef: string,
    resolution: 'SUCCESS' | 'DECLINE'
  ): Promise<PaymentAttempt> => {
    return request<PaymentAttempt>(`/api/v1/payments/${encodeURIComponent(paymentIdOrRef)}/reconcile`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    });
  },

  getPayment: async (paymentIdOrRef: string): Promise<PaymentAttempt> => {
    return request<PaymentAttempt>(`/api/v1/payments/${encodeURIComponent(paymentIdOrRef)}`);
  },

  getPayments: async (limit = 50): Promise<PaymentAttempt[]> => {
    return request<PaymentAttempt[]>(`/api/v1/payments?limit=${limit}`);
  },

  createRefund: async (
    paymentIdOrRef: string,
    amountMinor?: number,
    reason?: string
  ): Promise<Refund> => {
    return request<Refund>(`/api/v1/payments/${encodeURIComponent(paymentIdOrRef)}/refunds`, {
      method: 'POST',
      body: JSON.stringify({ amountMinor, reason }),
    });
  },

  getRefunds: async (paymentIdOrRef: string): Promise<Refund[]> => {
    return request<Refund[]>(`/api/v1/payments/${encodeURIComponent(paymentIdOrRef)}/refunds`);
  },

  getAllRefunds: async (limit = 50): Promise<Refund[]> => {
    return request<Refund[]>(`/api/v1/refunds?limit=${limit}`);
  },

  getLedgerTransactions: async (limit = 50): Promise<LedgerTransaction[]> => {
    return request<LedgerTransaction[]>(`/api/v1/ledger/transactions?limit=${limit}`);
  },

  getLedgerForPayment: async (paymentId: string): Promise<LedgerTransaction> => {
    return request<LedgerTransaction>(`/api/v1/ledger/payments/${encodeURIComponent(paymentId)}`);
  },

  getWebhookEvents: async (limit = 50): Promise<WebhookEvent[]> => {
    return request<WebhookEvent[]>(`/api/v1/webhooks/events?limit=${limit}`);
  },

  getWebhookEvent: async (id: string): Promise<WebhookEvent> => {
    return request<WebhookEvent>(`/api/v1/webhooks/events/${encodeURIComponent(id)}`);
  },

  deliverWebhook: async (
    id: string,
    options?: { targetUrl?: string; forceFail?: boolean }
  ): Promise<WebhookEvent> => {
    return request<WebhookEvent>(`/api/v1/webhooks/events/${encodeURIComponent(id)}/deliver`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },
};
