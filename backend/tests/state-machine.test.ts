import { describe, it, expect } from 'vitest';
import { canTransition, assertValidTransition, isTerminalState } from '../src/modules/payments/payment.state-machine';
import { PaymentStatus } from '../src/types';
import { AppError } from '../src/errors/app-error';

describe('Payment State Machine', () => {
  it('allows CREATED -> PROCESSING transition', () => {
    expect(canTransition(PaymentStatus.CREATED, PaymentStatus.PROCESSING)).toBe(true);
    expect(() => assertValidTransition(PaymentStatus.CREATED, PaymentStatus.PROCESSING)).not.toThrow();
  });

  it('allows PROCESSING -> SUCCEEDED transition', () => {
    expect(canTransition(PaymentStatus.PROCESSING, PaymentStatus.SUCCEEDED)).toBe(true);
    expect(() => assertValidTransition(PaymentStatus.PROCESSING, PaymentStatus.SUCCEEDED)).not.toThrow();
  });

  it('allows PROCESSING -> FAILED transition', () => {
    expect(canTransition(PaymentStatus.PROCESSING, PaymentStatus.FAILED)).toBe(true);
    expect(() => assertValidTransition(PaymentStatus.PROCESSING, PaymentStatus.FAILED)).not.toThrow();
  });

  it('allows PROCESSING -> UNCERTAIN transition for provider timeouts', () => {
    expect(canTransition(PaymentStatus.PROCESSING, PaymentStatus.UNCERTAIN)).toBe(true);
    expect(() => assertValidTransition(PaymentStatus.PROCESSING, PaymentStatus.UNCERTAIN)).not.toThrow();
  });

  it('allows UNCERTAIN -> SUCCEEDED transition upon reconciliation', () => {
    expect(canTransition(PaymentStatus.UNCERTAIN, PaymentStatus.SUCCEEDED)).toBe(true);
    expect(() => assertValidTransition(PaymentStatus.UNCERTAIN, PaymentStatus.SUCCEEDED)).not.toThrow();
  });

  it('allows UNCERTAIN -> FAILED transition upon reconciliation', () => {
    expect(canTransition(PaymentStatus.UNCERTAIN, PaymentStatus.FAILED)).toBe(true);
    expect(() => assertValidTransition(PaymentStatus.UNCERTAIN, PaymentStatus.FAILED)).not.toThrow();
  });

  it('identifies terminal states correctly', () => {
    expect(isTerminalState(PaymentStatus.SUCCEEDED)).toBe(true);
    expect(isTerminalState(PaymentStatus.FAILED)).toBe(true);
    expect(isTerminalState(PaymentStatus.CREATED)).toBe(false);
    expect(isTerminalState(PaymentStatus.PROCESSING)).toBe(false);
    expect(isTerminalState(PaymentStatus.UNCERTAIN)).toBe(false);
  });

  it('rejects direct CREATED -> SUCCEEDED transition', () => {
    expect(canTransition(PaymentStatus.CREATED, PaymentStatus.SUCCEEDED)).toBe(false);
    expect(() => assertValidTransition(PaymentStatus.CREATED, PaymentStatus.SUCCEEDED)).toThrow(AppError);
  });

  it('rejects terminal state modification from SUCCEEDED with TERMINAL_STATE_CONFLICT', () => {
    expect(canTransition(PaymentStatus.SUCCEEDED, PaymentStatus.FAILED)).toBe(false);
    try {
      assertValidTransition(PaymentStatus.SUCCEEDED, PaymentStatus.FAILED);
      expect.fail('Should have thrown error');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.code).toBe('TERMINAL_STATE_CONFLICT');
      expect(err.statusCode).toBe(409);
    }
  });

  it('rejects terminal state modification from FAILED with TERMINAL_STATE_CONFLICT', () => {
    expect(canTransition(PaymentStatus.FAILED, PaymentStatus.PROCESSING)).toBe(false);
    try {
      assertValidTransition(PaymentStatus.FAILED, PaymentStatus.PROCESSING);
      expect.fail('Should have thrown error');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.code).toBe('TERMINAL_STATE_CONFLICT');
      expect(err.statusCode).toBe(409);
    }
  });
});
