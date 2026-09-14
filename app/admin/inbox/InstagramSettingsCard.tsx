'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Zap, ArrowRight } from 'lucide-react';

interface InstagramSettingsCardProps {
  isConfigured: boolean;
  appId: string;
  appName: string;
}

function maskAppId(id: string): string {
  if (!id) return 'Not Configured';
  if (id.length <= 6) return id;
  return `${id.slice(0, 4)}••••${id.slice(-4)}`;
}

export default function InstagramSettingsCard({
  isConfigured,
  appId,
  appName,
}: InstagramSettingsCardProps) {
  const [pinging, setPinging] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    connected?: boolean;
    latency?: number;
    appName?: string;
    appId?: string;
    permissions?: string[];
    error?: string;
    verifiedAt?: string;
    graphApiVersion?: string;
  } | null>(null);

  const handlePing = async () => {
    setPinging(true);
    setStatusResult(null);
    try {
      const res = await fetch('/api/admin/instagram/status', {
        method: 'POST',
      });
      const data = await res.json();
      setStatusResult(data);
    } catch (err: any) {
      setStatusResult({
        connected: false,
        error: err.message || 'Failed to ping Meta Graph API',
      });
    } finally {
      setPinging(false);
    }
  };

  const isFailed = statusResult !== null && statusResult.connected === false;
  const isVerifiedActive = statusResult !== null && statusResult.connected === true;
  const isAwaitingEnv = !isConfigured && statusResult === null;

  return (
    <div className="p-6 border border-white/5 bg-white/[0.01] rounded-2xl space-y-4 hover:border-white/10 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center text-pink-500 shrink-0 mt-0.5">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-medium text-base">Instagram Direct (Meta Graph API)</h3>
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
                  Connected & Active via Meta Graph API
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                  Credentials Pending
                </span>
              )}
            </div>
            <p className="text-xs text-white/50 mt-1">
              Realtime 2-way DM messaging, story replies, and AI guest ID verification.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={handlePing}
            disabled={pinging}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg border border-white/10 transition-colors disabled:opacity-50"
            title="Ping Meta Graph API to test live connectivity"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin text-accent-gold' : 'text-white/60'}`} />
            {pinging ? 'Pinging Meta...' : 'Test Connection / Ping'}
          </button>

          <Link
            href="/admin/inbox?tab=messages&channel=instagram"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 hover:text-white text-xs font-medium rounded-lg border border-pink-500/30 transition-colors"
          >
            <span>View Instagram Inquiries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Meta App Metadata & Ping Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-white/5">
        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-white/40 block">App Name</span>
          <span className="text-xs font-mono text-white/90 truncate block mt-0.5">
            {statusResult?.appName || appName || 'nothingness'}
          </span>
        </div>

        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-white/40 block">App ID</span>
          <span className="text-xs font-mono text-white/90 truncate block mt-0.5">
            {maskAppId(statusResult?.appId || appId)}
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
                  Verified (Meta Graph {statusResult?.graphApiVersion || 'v21.0'})
                </span>
              </>
            ) : isConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-400 font-medium truncate">Ready (Meta Graph v21.0)</span>
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {statusResult.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="font-medium">
                {statusResult.connected
                  ? 'Meta Graph API connection verified in real time!'
                  : `Ping Failed: ${statusResult.error || 'Check credentials'}`}
              </span>
            </div>
            {typeof statusResult.latency === 'number' && (
              <span className="font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded border border-white/10">
                Latency: {statusResult.latency}ms
              </span>
            )}
          </div>

          {statusResult.permissions && statusResult.permissions.length > 0 && (
            <div className="mt-2 text-[11px] text-white/60 flex items-center gap-1.5 flex-wrap">
              <span className="text-white/40">Active Permissions:</span>
              {statusResult.permissions.map((perm) => (
                <span key={perm} className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-white/80 font-mono">
                  {perm}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
