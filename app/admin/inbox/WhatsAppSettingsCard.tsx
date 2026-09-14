'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppSettingsCardProps {
  isConfigured: boolean;
  phoneNumberId: string;
  wabaId: string;
  webhookUrl?: string;
}

function maskId(id: string): string {
  if (!id) return 'Not Configured';
  if (id.length <= 6) return id;
  return `${id.slice(0, 4)}••••${id.slice(-4)}`;
}

export default function WhatsAppSettingsCard({
  isConfigured,
  phoneNumberId,
  wabaId,
  webhookUrl = 'https://nothingness.asia/api/webhooks/whatsapp',
}: WhatsAppSettingsCardProps) {
  const [pinging, setPinging] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    connected?: boolean;
    configured?: boolean;
    phoneNumberId?: string | null;
    wabaId?: string | null;
    verifiedName?: string | null;
    displayPhoneNumber?: string | null;
    qualityRating?: string | null;
    codeVerificationStatus?: string | null;
    status?: string | null;
    latency?: number;
    error?: string;
    graphApiVersion?: string;
    verifiedAt?: string;
  } | null>(null);

  // Test Drawer / Form State
  const [isTestDrawerOpen, setIsTestDrawerOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState(
    'Hello from Nothingness Stays! Your Meta WhatsApp Cloud API is live and operational.'
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    messageId?: string;
    mocked?: boolean;
    error?: string;
  } | null>(null);

  const handleCopyWebhook = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      toast.success('Webhook callback URL copied to clipboard!');
      setTimeout(() => setCopiedWebhook(false), 2500);
    }
  };

  const handlePing = async () => {
    setPinging(true);
    setStatusResult(null);
    try {
      const res = await fetch('/api/admin/whatsapp/status', {
        method: 'POST',
      });
      const data = await res.json();
      setStatusResult(data);
      if (data.connected) {
        toast.success(`WhatsApp Cloud API verified! Latency: ${data.latency}ms`);
      } else {
        toast.error(data.error || 'WhatsApp Ping Failed');
      }
    } catch (err: any) {
      setStatusResult({
        connected: false,
        error: err.message || 'Failed to ping Meta Graph API for WhatsApp',
      });
      toast.error('Network error during WhatsApp ping');
    } finally {
      setPinging(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;

    setSendingTest(true);
    setTestResult(null);
    toast.loading('Sending test WhatsApp message via Meta Cloud API...');

    try {
      const res = await fetch('/api/whatsapp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPhone: testPhone,
          message: testMessage,
        }),
      });

      const data = await res.json();
      toast.dismiss();

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          messageId: data.messageId,
          mocked: data.mocked,
        });
        toast.success(
          data.mocked
            ? `Mock test message dispatched to ${testPhone}`
            : `Live WhatsApp delivered to ${testPhone}!`
        );
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Failed to deliver test message',
        });
        toast.error(data.error || 'Failed to deliver WhatsApp test message');
      }
    } catch (err: any) {
      toast.dismiss();
      setTestResult({
        success: false,
        error: err.message || 'Network error sending test message',
      });
      toast.error('Network error sending test WhatsApp message');
    } finally {
      setSendingTest(false);
    }
  };

  const isFailed = statusResult !== null && statusResult.connected === false;
  const isVerifiedActive = statusResult !== null && statusResult.connected === true;

  return (
    <div className="p-6 border border-white/5 bg-white/[0.01] rounded-2xl space-y-4 hover:border-white/10 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center text-green-500 shrink-0 mt-0.5">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-medium text-base">WhatsApp Business (Meta Cloud API)</h3>
              {isFailed ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  Connection Failed
                </span>
              ) : isVerifiedActive || isConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Connected & Active via Meta WhatsApp Cloud API
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                  Credentials Pending
                </span>
              )}
            </div>
            <p className="text-xs text-white/50 mt-1">
              Official WhatsApp Cloud API for automated 3-stage guest journeys, ID verification, and 2-way admin chat.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={handlePing}
            disabled={pinging}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg border border-white/10 transition-colors disabled:opacity-50"
            title="Ping Meta Graph API to test live WhatsApp connectivity"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin text-accent-gold' : 'text-white/60'}`} />
            {pinging ? 'Pinging Meta...' : 'Test Connection / Ping'}
          </button>

          <button
            onClick={() => setIsTestDrawerOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white text-xs font-medium rounded-lg border border-emerald-500/30 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test WhatsApp</span>
            {isTestDrawerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <Link
            href="/admin/whatsapp-connect"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium rounded-lg border border-white/10 transition-colors"
            title="Open Meta WhatsApp Cloud API Diagnostics Hub"
          >
            <span>Diagnostics Hub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/admin/inbox?tab=messages&channel=whatsapp"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium rounded-lg border border-white/10 transition-colors"
          >
            <span>View Inquiries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Meta WhatsApp App Metadata & Ping Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-white/5">
        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-white/40 block">Phone Number ID</span>
          <span className="text-xs font-mono text-white/90 truncate block mt-0.5">
            {maskId(statusResult?.phoneNumberId || phoneNumberId)}
          </span>
        </div>

        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-white/40 block">WABA ID</span>
          <span className="text-xs font-mono text-white/90 truncate block mt-0.5">
            {maskId(statusResult?.wabaId || wabaId)}
          </span>
        </div>

        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-white/40 block">Webhook Endpoint</span>
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="text-white/40 hover:text-white transition-colors"
              title="Copy Webhook Callback URL"
            >
              {copiedWebhook ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <span className="text-xs font-mono text-white/70 truncate block mt-0.5" title={webhookUrl}>
            /api/webhooks/whatsapp
          </span>
        </div>

        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-white/40 block">Live Status</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isFailed ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-xs text-red-400 font-medium truncate">Verification Error</span>
              </>
            ) : isVerifiedActive ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-400 font-medium truncate">
                  Verified ({statusResult?.qualityRating || 'GREEN'})
                </span>
              </>
            ) : isConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-400 font-medium truncate">Ready (Meta Cloud API)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-400 font-medium truncate">Awaiting Vercel Env</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Realtime Ping Live Output (if user clicked Ping) */}
      {statusResult && (
        <div
          className={`p-3.5 rounded-xl text-xs border transition-all ${
            statusResult.connected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {statusResult.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="font-medium">
                {statusResult.connected
                  ? `WhatsApp Cloud API connection verified in real time! Business: ${
                      statusResult.verifiedName || 'Nothingness'
                    } ${statusResult.displayPhoneNumber ? `(${statusResult.displayPhoneNumber})` : ''}`
                  : `Ping Failed: ${statusResult.error || 'Check WHATSAPP_ACCESS_TOKEN'}`}
              </span>
            </div>
            {typeof statusResult.latency === 'number' && (
              <span className="font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded border border-white/10">
                Latency: {statusResult.latency}ms
              </span>
            )}
          </div>

          {statusResult.connected && (
            <div className="mt-2 text-[11px] text-white/60 flex items-center gap-3 flex-wrap">
              <span>Quality Rating: <strong className="text-emerald-400">{statusResult.qualityRating || 'GREEN'}</strong></span>
              <span>Code Verification: <strong className="text-emerald-400">{statusResult.codeVerificationStatus || 'VERIFIED'}</strong></span>
              <span>API Version: <strong className="text-white/80">{statusResult.graphApiVersion || 'v21.0'}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Interactive "Send Realtime Test WhatsApp" Drawer/Form */}
      {isTestDrawerOpen && (
        <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-3 transition-all animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Send Realtime Test WhatsApp Message
              </h4>
            </div>
            <span className="text-[10px] text-white/40 font-mono">Dispatches via Meta Cloud API</span>
          </div>

          <form onSubmit={handleSendTestMessage} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-1">
                <label className="text-[10px] uppercase tracking-wider text-white/50 block">
                  Recipient Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-white/50 block">
                  Message Content
                </label>
                <input
                  type="text"
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Test message..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-white/40">
                Number must include country code (e.g. +91 for India, +1 for US).
              </span>
              <button
                type="submit"
                disabled={sendingTest || !testPhone.trim()}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingTest ? 'Sending...' : 'Deliver Test Message'}
              </button>
            </div>
          </form>

          {/* Test Dispatch Result Feedback */}
          {testResult && (
            <div
              className={`p-2.5 rounded-lg text-xs border ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/20 text-red-300'
              }`}
            >
              {testResult.success ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      Message dispatched successfully! {testResult.mocked && '(Mocked - check credentials)'}
                    </span>
                  </div>
                  {testResult.messageId && (
                    <span className="font-mono text-[10px] text-white/50">ID: {testResult.messageId}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>{testResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
