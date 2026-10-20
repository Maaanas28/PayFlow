import { PaymentStatus } from '../../types';
import { AppError } from '../../errors/app-error';

const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.CREATED]: [PaymentStatus.PROCESSING],
  [PaymentStatus.PROCESSING]: [PaymentStatus.SUCCEEDED, PaymentStatus.FAILED, PaymentStatus.UNCERTAIN],
  [PaymentStatus.UNCERTAIN]: [PaymentStatus.SUCCEEDED, PaymentStatus.FAILED],
  [PaymentStatus.SUCCEEDED]: [], // Terminal state
  [PaymentStatus.FAILED]: [],    // Terminal state
};

export function isTerminalState(status: PaymentStatus): boolean {
  return status === PaymentStatus.SUCCEEDED || status === PaymentStatus.FAILED;
}

export function canTransition(current: PaymentStatus, target: PaymentStatus): boolean {
  const allowed = VALID_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

export function assertValidTransition(current: PaymentStatus, target: PaymentStatus): void {
  // Prevent any modification of terminal states
  if (isTerminalState(current)) {
    throw AppError.conflict(
      `Payment is already in terminal state '${current}' and cannot transition to '${target}'`,
      'TERMINAL_STATE_CONFLICT',
      { current, target }
    );
  }

  if (!canTransition(current, target)) {
    throw AppError.badRequest(
      `Illegal payment state transition from '${current}' to '${target}'`,
      'INVALID_STATE_TRANSITION',
      { current, target, allowedNextStates: VALID_TRANSITIONS[current] || [] }
    );
  }
}
