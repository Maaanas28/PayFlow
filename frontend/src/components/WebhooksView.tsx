import React, { useState, useEffect } from 'react';
import {
  Webhook,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Lock,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { WebhookEvent } from '../types';
import { api } from '../services/api';
import { StatusBadge } from './Badge';

interface WebhooksViewProps {
  onNavigateToCheckout: () => void;
}

export const WebhooksView: React.FC<WebhooksViewProps> = ({ onNavigateToCheckout }) => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [deliveryResult, setDeliveryResult] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [endpointUrl, setEndpointUrl] = useState<string>(
    'http://localhost:4000/api/v1/webhooks/test-target'
  );

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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <Webhook className="w-6 h-6 text-teal-400" />
            <span>Webhook Outbox & Cryptography</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reliable event persistence with exponential backoff retries and HMAC-SHA256 signatures.
          </p>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Architecture Explainer */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs sm:text-sm space-y-2">
        <div className="flex items-center space-x-2 text-white font-bold">
          <Lock className="w-4 h-4 text-teal-400" />
          <span>Outbox Pattern & HMAC-SHA256 Signatures</span>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">
          Events are transactionally saved directly into PostgreSQL alongside payments and refunds. Each payload is signed with a SHA-256 HMAC header:{' '}
          <code className="text-teal-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
            X-PayFlow-Signature: t=...,v1=...
          </code>
          . Delivered events are verified with constant-time equality checks to prevent timing attacks.
        </p>
      </div>

      {/* Sandbox Endpoint Configuration */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-white font-bold">
            <Globe className="w-4 h-4 text-teal-400" />
            <span>Sandbox Merchant Webhook Destination</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Target endpoint for live signature verification. Test Deliver dispatches a real signed HTTP POST.
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <input
            type="text"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            placeholder="http://localhost:4000/api/v1/webhooks/test-target"
            className="w-full md:w-96 px-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl font-mono text-xs text-teal-300 outline-none transition-colors"
          />
          <button
            onClick={() => setEndpointUrl('http://localhost:4000/api/v1/webhooks/test-target')}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs whitespace-nowrap transition-colors cursor-pointer"
            title="Reset to default sandbox test receiver"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Outbox Events</span>
          <span className="text-2xl font-mono font-extrabold text-white">{events.length}</span>
          <span className="block text-[11px] text-slate-500 mt-0.5">Persisted in PostgreSQL</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Delivered</span>
          <span className="text-2xl font-mono font-extrabold text-emerald-400">
            {deliveredCount}
          </span>
          <span className="block text-[11px] text-slate-500 mt-0.5">Verified signatures</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Pending Delivery</span>
          <span className="text-2xl font-mono font-extrabold text-sky-400">{pendingCount}</span>
          <span className="block text-[11px] text-slate-500 mt-0.5">Ready for dispatcher</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Failed Deliveries</span>
          <span className="text-2xl font-mono font-extrabold text-rose-400">{failedCount}</span>
          <span className="block text-[11px] text-slate-500 mt-0.5">Backoff retry scheduled</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-3 text-rose-300 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Delivery Feedback Banner */}
      {deliveryResult && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center space-x-3 animate-in fade-in ${
            deliveryResult.status === 'DELIVERED'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          {deliveryResult.status === 'DELIVERED' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          )}
          <span>{deliveryResult.message}</span>
        </div>
      )}

      {/* Events Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Outbox Event Queue</h3>
            <p className="text-xs text-slate-400">
              Select any event to inspect its cryptographic headers and payload.
            </p>
          </div>
          <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 font-mono">
            {events.length} queued
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-teal-400" />
            <span>Loading PostgreSQL outbox events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
            <Webhook className="w-8 h-8 text-slate-600" />
            <div>
              <p className="font-semibold text-slate-300">No webhook events recorded</p>
              <p className="text-xs text-slate-500 mt-1">
                Trigger a payment or refund in the sandbox to automatically generate outbox events.
              </p>
            </div>
            <button
              onClick={onNavigateToCheckout}
              className="mt-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Go to Checkout
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 sm:px-6">Event ID</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4 hidden md:table-cell">Created</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
                {events.map((event: WebhookEvent) => (
                  <tr
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-white select-all">
                          {event.id.slice(0, 8)}...{event.id.slice(-4)}
                        </span>
                        <button
                          onClick={(e) => handleCopy(event.id, event.id, e)}
                          className="text-slate-500 hover:text-white p-0.5"
                        >
                          {copiedKey === event.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-teal-300 font-semibold text-xs">
                      {event.eventType}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={event.status} />
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {event.attempts} / {event.maxAttempts || 5}
                      {event.nextRetryAt && event.status !== 'DELIVERED' && (
                        <span className="block text-[10px] text-amber-400/80">
                          Retry: {new Date(event.nextRetryAt).toLocaleTimeString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 hidden md:table-cell font-mono text-xs text-slate-400">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div
                        className="inline-flex items-center space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleDeliver(event.id, false)}
                          disabled={deliveringId === event.id}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-lg text-xs font-semibold border border-teal-500/30 transition-colors cursor-pointer disabled:opacity-50"
                          title="Deliver to configured webhook destination"
                        >
                          {deliveringId === event.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>Test Deliver</span>
                        </button>

                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono">
                    {selectedEvent.eventType}
                  </span>
                  <StatusBadge status={selectedEvent.status} />
                </div>
                <h3 className="font-mono text-sm text-slate-300 mt-1 select-all">
                  Event ID: {selectedEvent.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-xl">
                <span className="text-slate-400 block">Attempts:</span>
                <span className="font-mono font-bold text-white">
                  {selectedEvent.attempts} of {selectedEvent.maxAttempts || 5}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl">
                <span className="text-slate-400 block">Delivered At:</span>
                <span className="font-mono text-emerald-400">
                  {selectedEvent.deliveredAt
                    ? new Date(selectedEvent.deliveredAt).toLocaleString()
                    : 'Pending / Not Delivered'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-slate-400 block">Next Retry:</span>
                <span className="font-mono text-amber-300">
                  {selectedEvent.nextRetryAt
                    ? new Date(selectedEvent.nextRetryAt).toLocaleTimeString()
                    : 'None Scheduled'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl col-span-2 sm:col-span-3">
                <span className="text-slate-400 block">Destination Endpoint:</span>
                <span className="font-mono text-teal-300 text-[11px] break-all">
                  {selectedEvent.targetUrl || 'Not configured in event (targetUrl omitted)'}
                </span>
              </div>
            </div>

            {selectedEvent.lastError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                <span className="font-bold">Last Delivery Error:</span> {selectedEvent.lastError}
              </div>
            )}

            {/* Cryptographic Signature & Headers */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-slate-400">
                Cryptographic Signature Headers (Generated on dispatch)
              </span>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-teal-300 space-y-1">
                <div>X-PayFlow-Event-Id: {selectedEvent.id}</div>
                <div>X-PayFlow-Event-Type: {selectedEvent.eventType}</div>
                <div className="text-slate-400">
                  X-PayFlow-Signature: t={'{timestamp}'},v1={'{HMAC_SHA256_HEX}'}
                </div>
              </div>
            </div>

            {/* JSON Payload Viewer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase">JSON Payload</span>
                <button
                  onClick={() =>
                    handleCopy(JSON.stringify(selectedEvent.payload, null, 2), 'payload')
                  }
                  className="flex items-center space-x-1 hover:text-white"
                >
                  {copiedKey === 'payload' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy Payload</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-64">
                {JSON.stringify(selectedEvent.payload, null, 2)}
              </pre>
            </div>

            {/* Action Bar inside modal */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleDeliver(selectedEvent.id, true)}
                disabled={deliveringId === selectedEvent.id}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Force a delivery failure to inspect backoff retry logic"
              >
                Simulate Delivery Failure
              </button>

              <button
                onClick={() => handleDeliver(selectedEvent.id, false)}
                disabled={deliveringId === selectedEvent.id}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                {deliveringId === selectedEvent.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
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
