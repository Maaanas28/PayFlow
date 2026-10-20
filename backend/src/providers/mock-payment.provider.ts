import { randomUUID } from 'crypto';
import { SimulatedOutcome } from '../types';

export interface MockPaymentResult {
  isSimulation: true;
  disclaimer: string;
  provider: 'MOCK_SANDBOX';
  gatewayTransactionId: string;
  status: 'SUCCEEDED' | 'FAILED' | 'UNCERTAIN';
  success: boolean;
  failureReason?: string;
}

export class MockPaymentProvider {
  static readonly DISCLAIMER = 'Sandbox only — no real money is processed.';
  static readonly PROVIDER_NAME = 'MOCK_SANDBOX';

  async processPayment(params: {
    amountMinor: number;
    currency: string;
    orderId: string;
    outcome: SimulatedOutcome;
  }): Promise<MockPaymentResult> {
    const gatewayTransactionId = `gtw_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

    if (params.outcome === 'SUCCESS') {
      return {
        isSimulation: true,
        disclaimer: MockPaymentProvider.DISCLAIMER,
        provider: MockPaymentProvider.PROVIDER_NAME,
        gatewayTransactionId,
        status: 'SUCCEEDED',
        success: true,
      };
    }

    if (params.outcome === 'TIMEOUT') {
      return {
        isSimulation: true,
        disclaimer: MockPaymentProvider.DISCLAIMER,
        provider: MockPaymentProvider.PROVIDER_NAME,
        gatewayTransactionId,
        status: 'UNCERTAIN',
        success: false,
        failureReason: 'GATEWAY_TIMEOUT_UNCERTAIN_STATUS',
      };
    }

    return {
      isSimulation: true,
      disclaimer: MockPaymentProvider.DISCLAIMER,
      provider: MockPaymentProvider.PROVIDER_NAME,
      gatewayTransactionId,
      status: 'FAILED',
      success: false,
      failureReason: 'CARD_DECLINED_INSUFFICIENT_FUNDS',
    };
  }

  async inquirePayment(gatewayTransactionId: string, resolution: 'SUCCESS' | 'DECLINE'): Promise<MockPaymentResult> {
    if (resolution === 'SUCCESS') {
      return {
        isSimulation: true,
        disclaimer: MockPaymentProvider.DISCLAIMER,
        provider: MockPaymentProvider.PROVIDER_NAME,
        gatewayTransactionId,
        status: 'SUCCEEDED',
        success: true,
      };
    }

    return {
      isSimulation: true,
      disclaimer: MockPaymentProvider.DISCLAIMER,
      provider: MockPaymentProvider.PROVIDER_NAME,
      gatewayTransactionId,
      status: 'FAILED',
      success: false,
      failureReason: 'TRANSACTION_DECLINED_ON_RECONCILIATION',
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
