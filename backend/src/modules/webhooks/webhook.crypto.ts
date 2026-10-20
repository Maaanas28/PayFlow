import { createHmac, timingSafeEqual } from 'crypto';

export interface SignatureResult {
  header: string;
  timestamp: number;
  signature: string;
}

export class WebhookCrypto {
  /**
   * Generates an HMAC-SHA256 signature header: t=timestamp,v1=signature
   */
  static generateSignature(
    payload: string | Record<string, unknown>,
    secret: string,
    customTimestamp?: number
  ): SignatureResult {
    const timestamp = customTimestamp ?? Math.floor(Date.now() / 1000);
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signedPayload = `${timestamp}.${payloadString}`;

    const signature = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    const header = `t=${timestamp},v1=${signature}`;

    return {
      header,
      timestamp,
      signature,
    };
  }

  /**
   * Verifies an incoming webhook signature using constant-time comparison
   * and timestamp drift check.
   */
  static verifySignature(
    payload: string | Record<string, unknown>,
    header: string,
    secret: string,
    toleranceSeconds = 300
  ): boolean {
    if (!header || !secret) return false;

    // Parse header format: t=123456789,v1=abcdef...
    const elements = header.split(',');
    let timestampStr: string | undefined;
    let signatureHex: string | undefined;

    for (const element of elements) {
      const [key, value] = element.split('=');
      if (key === 't') timestampStr = value;
      if (key === 'v1') signatureHex = value;
    }

    if (!timestampStr || !signatureHex) return false;

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Replay attack prevention: verify timestamp freshness
    const now = Math.floor(Date.now() / 1000);
    if (toleranceSeconds > 0 && Math.abs(now - timestamp) > toleranceSeconds) {
      return false;
    }

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignedPayload = `${timestamp}.${payloadString}`;
    const expectedSignatureHex = createHmac('sha256', secret)
      .update(expectedSignedPayload)
      .digest('hex');

    try {
      const expectedBuffer = Buffer.from(expectedSignatureHex, 'hex');
      const actualBuffer = Buffer.from(signatureHex, 'hex');

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      return timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }
}
