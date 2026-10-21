import React, { useState, useEffect } from 'react';
import {
  Webhook,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Loader2,
  Lock,
  AlertCircle,
  Globe,
  Database,
  Clock,
} from 'lucide-react';
import { WebhookEvent } from '../types';
import { api, BASE_URL } from '../services/api';
import { StatusBadge, Badge } from './Badge';
import { MetricCard } from './MetricCard';

interface WebhooksViewProps {
  onNavigateToCheckout: () => void;
}

export const WebhooksView: React.FC<WebhooksViewProps> = ({ onNavigateToCheckout }) => {
  const defaultWebhookTarget = BASE_URL
    ? `${BASE_URL}/api/v1/webhooks/test-target`
    : 'http://localhost:4000/api/v1/webhooks/test-target';

  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [deliveryResult, setDeliveryResult] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [endpointUrl, setEndpointUrl] = useState<string>(defaultWebhookTarget);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getWebhookEvents(100);
      setEvents(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch webhook outbox events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCopy = (text: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Deliver or retry webhook to the configured endpoint or built-in test-target
  const handleDeliver = async (eventId: string, forceFail = false) => {
    try {
      setDeliveringId(eventId);
      setDeliveryResult(null);

      const targetUrl = endpointUrl.trim() || undefined;
      const updated = await api.deliverWebhook(eventId, { targetUrl, forceFail });

      // Update in local state
      setEvents((prev: WebhookEvent[]) =>
        prev.map((e: WebhookEvent) => (e.id === eventId ? updated : e))
      );
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(updated);
      }

      setDeliveryResult({
        eventId,
        status: updated.status,
        message:
          updated.status === 'DELIVERED'
            ? 'Webhook dispatched & delivered! HMAC-SHA256 signature verified by server.'
            : updated.lastError ||
              (forceFail
                ? 'Simulated failure recorded! Exponential backoff retry scheduled.'
                : 'Delivery attempt failed.'),
      });

      setTimeout(() => setDeliveryResult(null), 7000);
    } catch (err: any) {
      setDeliveryResult({
        eventId,
        status: 'FAILED',
        message: `Delivery error: ${err.message}`,
      });
    } finally {
      setDeliveringId(null);
    }
  };

  // Metrics
  const deliveredCount = events.filter((e: WebhookEvent) => e.status === 'DELIVERED').length;
  const pendingCount = events.filter((e: WebhookEvent) => e.status === 'PENDING').length;
  const failedCount = events.filter((e: WebhookEvent) => e.status === 'FAILED').length;

  return (
    <div className="space-y-5">
      {/* Top Header Command Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-900">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight font-mono uppercase flex items-center space-x-2">
              <Webhook className="w-5 h-5 text-white" />
              <span>WEBHOOK OUTBOX & CRYPTOGRAPHY</span>
            </h2>
            <Badge variant="neutral" size="xs">
              {events.length} EVENTS
            </Badge>
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Reliable event persistence with exponential backoff retries and HMAC-SHA256 signatures
          </p>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3 py-1.5 bg-black hover:bg-neutral-900 text-neutral-300 border border-neutral-800 rounded-sm text-xs font-mono font-medium transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-white' : ''}`} />
          <span>Sync Outbox</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-sm bg-neutral-900 border border-red-900/40 text-xs font-mono text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Architecture Explainer */}
      <div className="p-3.5 rounded-sm bg-[#050505] border border-neutral-850 text-xs font-mono space-y-1">
        <div className="flex items-center space-x-2 text-white font-bold text-[11px] uppercase tracking-wider">
          <Lock className="w-4 h-4 text-white" />
          <span>OUTBOX PATTERN & HMAC-SHA256 CRYPTOGRAPHIC SIGNATURES</span>
        </div>
        <p className="text-neutral-400 text-[11px] leading-relaxed">
          Events are transactionally saved directly into PostgreSQL alongside payments and refunds. Each payload is signed with a SHA-256 HMAC header:{' '}
          <code className="text-neutral-300 font-mono bg-black px-1.5 py-0.5 rounded-sm border border-neutral-800">
            X-PayFlow-Signature: t=...,v1=...
          </code>
          . Delivered events are verified with constant-time equality checks to prevent timing attacks.
        </p>
      </div>

      {/* Sandbox Endpoint Configuration */}
      <div className="p-3.5 rounded-sm bg-[#050505] border border-neutral-850 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2 text-white font-bold text-[11px] uppercase tracking-wider">
            <Globe className="w-4 h-4 text-white" />
            <span>Sandbox Merchant Destination URL</span>
          </div>
          <p className="text-neutral-400 text-[11px]">
            Target endpoint for live signature verification. Test Deliver dispatches a signed HTTP POST.
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <input
            type="text"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            placeholder={defaultWebhookTarget}
            className="w-full md:w-96 px-3 py-1.5 bg-black border border-neutral-800 focus:border-neutral-600 rounded-sm font-mono text-xs text-white outline-none transition-colors"
          />
          <button
            onClick={() => setEndpointUrl(defaultWebhookTarget)}
            className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-sm text-xs whitespace-nowrap transition-colors cursor-pointer"
            title="Reset to default sandbox test receiver"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Finance OS Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total Outbox Events"
          value={events.length}
          subvalue="Persisted in PostgreSQL"
          badgeText="OUTBOX"
          badgeVariant="neutral"
          icon={Database}
        />
        <MetricCard
          label="Verified Delivered"
          value={deliveredCount}
          subvalue="Verified HMAC signatures"
          status="gain"
          badgeText="DELIVERED"
          badgeVariant="neutral"
          icon={CheckCircle2}
        />
        <MetricCard
          label="Pending Dispatch"
          value={pendingCount}
          subvalue="Awaiting delivery"
          badgeText="QUEUED"
          badgeVariant="neutral"
          icon={Clock}
        />
        <MetricCard
          label="Failed Deliveries"
          value={failedCount}
          subvalue="Backoff retry scheduled"
          status={failedCount > 0 ? 'loss' : 'neutral'}
          badgeText="RETRIES"
          badgeVariant={failedCount > 0 ? 'loss' : 'neutral'}
          icon={XCircle}
        />
      </div>

      {/* Delivery Result Toast */}
      {deliveryResult && (
        <div
          className={`p-3 rounded-sm border flex items-center justify-between text-xs font-mono animate-in fade-in ${
            deliveryResult.status === 'DELIVERED'
              ? 'bg-[#062419] border-[#0d5c3a] text-emerald-300'
              : 'bg-[#2a0e14] border-[#6b1d28] text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {deliveryResult.status === 'DELIVERED' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{deliveryResult.message}</span>
          </div>
          <button
            onClick={() => setDeliveryResult(null)}
            className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Outbox Table */}
      <div className="bg-[#050505] rounded-sm border border-neutral-850 overflow-hidden font-mono">
        <div className="p-3.5 border-b border-neutral-900 bg-[#0a0a0a] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              OUTBOX EVENT QUEUE
            </h3>
            <p className="text-[11px] text-neutral-400">
              Transactionally queued webhook payloads with cryptographic headers
            </p>
          </div>
          <Badge variant="neutral" size="xs">
            {events.length} QUEUED
          </Badge>
        </div>

        {loading ? (
          <div className="py-16 text-center text-neutral-400 text-xs flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-white" />
            <span>QUERYING WEBHOOK OUTBOX TABLE...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-xs flex flex-col items-center justify-center space-y-3">
            <Webhook className="w-6 h-6 text-neutral-600" />
            <div>
              <p className="font-bold text-white">NO WEBHOOK EVENTS RECORDED</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Trigger a payment or refund in the sandbox to automatically generate outbox events.
              </p>
            </div>
            <button
              onClick={onNavigateToCheckout}
              className="mt-2 px-3 py-1.5 bg-white hover:bg-neutral-200 text-black font-bold rounded-sm text-xs transition-colors cursor-pointer"
            >
              Go to Checkout Terminal
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-900 bg-[#0a0a0a] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-2.5 px-4 sm:px-5">Event ID</th>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Attempts</th>
                  <th className="py-2.5 px-4 hidden md:table-cell">Timestamp</th>
                  <th className="py-2.5 px-4 sm:px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {events.map((event: WebhookEvent) => (
                  <tr
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="hover:bg-neutral-950 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 sm:px-5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-white select-all">
                          {event.id.slice(0, 8)}...{event.id.slice(-4)}
                        </span>
                        <button
                          onClick={(e) => handleCopy(event.id, event.id, e)}
                          className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
                        >
                          {copiedKey === event.id ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-white font-bold text-xs">
                      {event.eventType}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={event.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-neutral-300 tabular-nums">
                      {event.attempts} / 5
                      {event.nextRetryAt && event.status !== 'DELIVERED' && (
                        <span className="block text-[10px] text-neutral-400">
                          Retry: {new Date(event.nextRetryAt).toLocaleTimeString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 hidden md:table-cell font-mono text-[11px] text-neutral-400 tabular-nums">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </td>

                    <td className="py-3 px-4 sm:px-5 text-right">
                      <div
                        className="inline-flex items-center space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleDeliver(event.id, false)}
                          disabled={deliveringId === event.id}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-sm text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
                          title="Deliver to configured webhook destination"
                        >
                          {deliveringId === event.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-white" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>Test Deliver</span>
                        </button>

                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="px-2 py-1 bg-black hover:bg-neutral-900 text-neutral-300 rounded-sm text-xs font-medium border border-neutral-800 transition-colors cursor-pointer"
                        >
                          Payload
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Event Payload Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#050505] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm p-5 border border-neutral-800 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-900">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {selectedEvent.eventType}
                  </span>
                  <StatusBadge status={selectedEvent.status} size="sm" />
                </div>
                <h3 className="text-xs text-neutral-400 mt-1 select-all">
                  Event ID: <span className="text-white font-bold">{selectedEvent.id}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-sm text-neutral-400 hover:text-white hover:bg-neutral-900 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-black rounded-sm border border-neutral-850">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                  Attempts:
                </span>
                <span className="font-bold text-white tabular-nums">
                  {selectedEvent.attempts} of 5
                </span>
              </div>
              <div className="p-2.5 bg-black rounded-sm border border-neutral-850">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                  Delivered At:
                </span>
                <span className="text-white tabular-nums">
                  {selectedEvent.deliveredAt
                    ? new Date(selectedEvent.deliveredAt).toLocaleString()
                    : 'Pending / Not Delivered'}
                </span>
              </div>
              <div className="p-2.5 bg-black rounded-sm border border-neutral-850 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                  Next Retry:
                </span>
                <span className="text-neutral-300 tabular-nums">
                  {selectedEvent.nextRetryAt
                    ? new Date(selectedEvent.nextRetryAt).toLocaleTimeString()
                    : 'None Scheduled'}
                </span>
              </div>
              <div className="p-2.5 bg-black rounded-sm border border-neutral-850 col-span-2 sm:col-span-3">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                  Destination Endpoint:
                </span>
                <span className="text-neutral-300 text-[11px] break-all">
                  {selectedEvent.targetUrl || 'Not configured in event (targetUrl omitted)'}
                </span>
              </div>
            </div>

            {selectedEvent.lastError && (
              <div className="p-3 bg-neutral-900 border border-red-900/40 rounded-sm text-red-300 text-xs">
                <span className="font-bold">LAST DELIVERY ERROR:</span> {selectedEvent.lastError}
              </div>
            )}

            {/* Cryptographic Signature & Headers */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Cryptographic Signature Headers (Generated on dispatch)
              </span>
              <div className="p-3 bg-black rounded-sm border border-neutral-850 text-[11px] text-neutral-300 space-y-1">
                <div>X-PayFlow-Event-Id: {selectedEvent.id}</div>
                <div>X-PayFlow-Event-Type: {selectedEvent.eventType}</div>
                <div className="text-neutral-500">
                  X-PayFlow-Signature: t={'{timestamp}'},v1={'{HMAC_SHA256_HEX}'}
                </div>
              </div>
            </div>

            {/* JSON Payload Viewer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-bold uppercase tracking-wider text-[10px]">JSON Payload</span>
                <button
                  onClick={() =>
                    handleCopy(JSON.stringify(selectedEvent.payload, null, 2), 'payload')
                  }
                  className="flex items-center space-x-1 hover:text-white cursor-pointer"
                >
                  {copiedKey === 'payload' ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy JSON</span>
                </button>
              </div>
              <pre className="p-4 bg-black rounded-sm border border-neutral-850 font-mono text-xs text-neutral-200 overflow-x-auto max-h-64">
                {JSON.stringify(selectedEvent.payload, null, 2)}
              </pre>
            </div>

            {/* Action Bar inside modal */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-900">
              <button
                onClick={() => handleDeliver(selectedEvent.id, true)}
                disabled={deliveringId === selectedEvent.id}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-sm text-xs font-semibold transition-colors cursor-pointer"
                title="Force a delivery failure to inspect backoff retry logic"
              >
                Simulate Delivery Failure
              </button>

              <button
                onClick={() => handleDeliver(selectedEvent.id, false)}
                disabled={deliveringId === selectedEvent.id}
                className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-sm text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                {deliveringId === selectedEvent.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-black" />
                )}
                <span>Deliver to Test Receiver</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
