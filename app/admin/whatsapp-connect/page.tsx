'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  ArrowLeft,
  Key,
  Globe,
  Radio,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppStatusData {
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
}

function maskId(id: string | null | undefined): string {
  if (!id) return 'Not Configured';
  if (id.length <= 6) return id;
  return `${id.slice(0, 4)}••••${id.slice(-4)}`;
}

export default function WhatsAppConnectPage() {
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [statusData, setStatusData] = useState<WhatsAppStatusData | null>(null);

  // Test Message Form State
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState(
    'Hello from Nothingness Stays! Your Meta WhatsApp Cloud API is operational and active.'
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('https://nothingness.asia/api/webhooks/whatsapp');
      setCopiedUrl(true);
      toast.success('Callback URL copied to clipboard!');
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleCopyToken = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
      setCopiedToken(true);
      toast.success('Verify Token key copied to clipboard!');
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setPinging(true);
    try {
      const res = await fetch('/api/admin/whatsapp/status', {
        method: 'POST',
      });
      const data = await res.json();
      setStatusData(data);
    } catch {
      toast.error('Failed to query WhatsApp Cloud API status');
      setStatusData({
        connected: false,
        error: 'Network failure querying Meta Graph API',
      });
    } finally {
      setLoading(false);
      setPinging(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;

    setSendingTest(true);
    toast.loading('Sending test WhatsApp message via Meta Cloud API...');
    try {
      const res = await fetch('/api/whatsapp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPhone: testPhone, message: testMsg }),
      });
      const data = await res.json();
      toast.dismiss();

      if (res.ok && data.success) {
        toast.success(
          data.mocked
            ? `Mock test message dispatched to ${testPhone}`
            : `Live WhatsApp delivered to ${testPhone}!`
        );
      } else {
        toast.error(data.error || 'Failed to send test message');
      }
    } catch {
      toast.dismiss();
      toast.error('Network error sending test message');
    } finally {
      setSendingTest(false);
    }
  };

  const isConnected = Boolean(statusData?.connected);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/50 space-x-2">
        <RefreshCw className="w-5 h-5 animate-spin text-accent-gold" />
        <span>Connecting to Meta WhatsApp Cloud API...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/inbox?tab=settings"
          className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Omnichannel Settings</span>
        </Link>

        <Link
          href="/admin/inbox?tab=messages&channel=whatsapp"
          className="text-xs text-accent-gold hover:underline flex items-center gap-1.5"
        >
          <span>Open WhatsApp Inbox</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center text-green-500 shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-white">Meta WhatsApp Cloud API</h1>
            <p className="text-white/50 text-sm tracking-wide mt-1">
              Production Meta Graph API infrastructure for 3-stage guest journeys, ID compliance, and host messaging.
            </p>
          </div>
        </div>
      </div>

      {/* Main Status & Configuration Card */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <Smartphone className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-xl text-white">Cloud API Connection</h2>
                <span
                  className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    isConnected
                      ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                      : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
                  }`}
                >
                  {isConnected ? 'Active & Online' : 'Credentials Pending'}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-1">
                {isConnected
                  ? `Verified Business: ${statusData?.verifiedName || 'Nothingness'} (${
                      statusData?.displayPhoneNumber || 'Registered'
                    })`
                  : 'Meta Cloud API environment variables require configuration in Vercel'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStatus}
              disabled={pinging}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white/70 hover:text-white transition-colors disabled:opacity-50"
              title="Ping Meta Graph API"
            >
              <RefreshCw className={`w-4 h-4 ${pinging ? 'animate-spin text-accent-gold' : ''}`} />
              <span>{pinging ? 'Pinging...' : 'Ping Meta'}</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white/40 block">Verified Business</span>
            <p className="text-sm font-medium text-white truncate">
              {statusData?.verifiedName || 'Nothingness Stays'}
            </p>
            <span className="text-[10px] text-white/40 block">
              Phone: {statusData?.displayPhoneNumber || 'Configured'}
            </span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white/40 block">Phone Number ID</span>
            <p className="text-xs font-mono text-white/90 truncate">
              {maskId(statusData?.phoneNumberId)}
            </p>
            <span className="text-[10px] text-emerald-400 block">
              {isConnected ? 'Verified Meta Asset' : 'Pending Env'}
            </span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white/40 block">Quality Rating</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-semibold text-emerald-400">
                {statusData?.qualityRating || 'GREEN / High Quality'}
              </span>
            </div>
            <span className="text-[10px] text-white/40 block">
              Code: {statusData?.codeVerificationStatus || 'VERIFIED'}
            </span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white/40 block">Latency &amp; Graph API</span>
            <p className="text-xs font-mono text-white/90 truncate">
              {typeof statusData?.latency === 'number' ? `${statusData.latency}ms` : 'Ready'}
            </p>
            <span className="text-[10px] text-white/40 block">
              Meta Graph {statusData?.graphApiVersion || 'v21.0'}
            </span>
          </div>
        </div>

        {/* Status Confirmation Banner */}
        {isConnected ? (
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-white text-sm font-medium">Meta WhatsApp Cloud API Active &amp; Ready</h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Guest bookings automatically receive Stage 1 confirmations, Stage 2 location releases upon ID verification, and Stage 3 checkout feedback reminders.
                </p>
              </div>
            </div>
            <ShieldCheck className="w-8 h-8 text-emerald-400/40 shrink-0 hidden sm:block" />
          </div>
        ) : (
          <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-amber-300 text-sm font-medium">Configuration Required</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Ensure <code className="text-amber-200 bg-black/40 px-1.5 py-0.5 rounded">WHATSAPP_PHONE_NUMBER_ID</code> and <code className="text-amber-200 bg-black/40 px-1.5 py-0.5 rounded">WHATSAPP_ACCESS_TOKEN</code> are declared in Vercel project environment variables.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Configuration Guide */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="border-b border-white/10 pb-4">
          <h2 className="font-serif text-xl text-white">Meta Webhook Invariant Settings</h2>
          <p className="text-xs text-white/50 mt-1">
            Configure these parameters inside Meta App Dashboard ➔ WhatsApp ➔ Configuration ➔ Webhook.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-white/40 block flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-accent-gold" /> Callback URL
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="text-white/40 hover:text-white transition-colors"
                title="Copy Callback URL"
              >
                {copiedUrl ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <code className="text-xs text-white/90 bg-white/5 px-2 py-1 rounded block font-mono">
              https://nothingness.asia/api/webhooks/whatsapp
            </code>
            <p className="text-[10px] text-white/40">
              Receives inbound guest text messages and Aadhaar / Passport ID photos for automated compliance verification.
            </p>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-white/40 block flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-accent-gold" /> Verify Token
              </span>
              <button
                type="button"
                onClick={handleCopyToken}
                className="text-white/40 hover:text-white transition-colors"
                title="Copy Verify Token key"
              >
                {copiedToken ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <code className="text-xs text-white/90 bg-white/5 px-2 py-1 rounded block font-mono">
              WHATSAPP_WEBHOOK_VERIFY_TOKEN
            </code>
            <p className="text-[10px] text-white/40">
              Meta hub.challenge handshake token. Matched against environment variable on GET requests.
            </p>
          </div>
        </div>
      </div>

      {/* Live Test Message Sender Form */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h2 className="font-serif text-xl text-white">Send Realtime Test WhatsApp Message</h2>
          <p className="text-xs text-white/50 mt-1">
            Verify real-time outbound delivery via Meta WhatsApp Cloud API to any admin phone.
          </p>
        </div>

        <form onSubmit={handleSendTestMessage} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40">
              Recipient WhatsApp Phone Number
            </label>
            <input
              type="text"
              required
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+919876543210"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40">
              Message Content
            </label>
            <textarea
              rows={3}
              required
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
            />
          </div>

          <button
            type="submit"
            disabled={sendingTest || !testPhone.trim()}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {sendingTest ? 'Sending Test...' : 'Send Test WhatsApp Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
