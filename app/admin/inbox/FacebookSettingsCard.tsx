'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Layers,
  MessageSquare,
  Camera,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export interface FacebookSettingsCardProps {
  isConfigured: boolean;
  configId: string;
  appId?: string;
  initialConnected?: boolean;
  initialError?: string;
}

export function maskId(id: string | null | undefined): string {
  if (!id) return 'Not Configured';
  if (id.length <= 6) return id;
  return `${id.slice(0, 4)}••••${id.slice(-4)}`;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function FacebookSettingsCard({
  isConfigured,
  configId,
  appId,
  initialConnected = false,
  initialError,
}: FacebookSettingsCardProps) {
  const [pinging, setPinging] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    connected?: boolean;
    latency?: number;
    appName?: string;
    appId?: string;
    configId?: string;
    products?: string[];
    error?: string;
    verifiedAt?: string;
    graphApiVersion?: string;
  } | null>(null);

  useEffect(() => {
    if (initialConnected) {
      toast.success('Facebook Business Login connected successfully! Linked assets are now synchronized.');
    }
    if (initialError) {
      toast.error(`Facebook Business Login authorization failed: ${initialError}`);
    }
  }, [initialConnected, initialError]);

  const handlePing = async () => {
    setPinging(true);
    setStatusResult(null);
    try {
      const res = await fetch('/api/admin/facebook/status', {
        method: 'POST',
      });
      const data = await res.json();
      setStatusResult(data);
      if (data.connected) {
        toast.success(`Facebook Business Login verified! Latency: ${data.latency}ms`);
      } else {
        toast.error(data.error || 'Facebook Business Login Ping Failed');
      }
    } catch (err: any) {
      setStatusResult({
        connected: false,
        error: err.message || 'Failed to ping Meta Graph API for Facebook Login',
      });
      toast.error('Network error during Facebook Login ping');
    } finally {
      setPinging(false);
    }
  };

  const isFailed = (statusResult !== null && statusResult.connected === false) || Boolean(initialError);
  const isVerifiedActive = statusResult !== null && statusResult.connected === true;

  const configuredProducts = [
    {
      name: 'WhatsApp Cloud API',
      description: 'Marketing Messages, Messaging, View Phone Assets',
      icon: MessageSquare,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      name: 'Instagram Direct',
      description: 'Realtime 2-way DM messaging, story replies & AI concierge',
      icon: Camera,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    },
    {
      name: 'Facebook Messenger',
      description: 'Conversations API for Business Messaging & Page Inquiries',
      icon: MessageCircle,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
  ];

  return (
    <div className="p-6 border border-white/5 bg-white/[0.01] rounded-2xl space-y-5 hover:border-white/10 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600/15 border border-blue-500/25 rounded-xl flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
            <FacebookIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-medium text-base">Facebook Login for Business (Meta)</h3>
              {isFailed ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  Connection Issue
                </span>
              ) : isVerifiedActive || isConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Meta Business Login Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                  Configuration ID Pending
                </span>
              )}
            </div>
            <p className="text-xs text-white/50 mt-1">
              Unified OAuth authorization for WhatsApp Cloud API, Instagram Messaging, and Facebook Messenger Pages.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={handlePing}
            disabled={pinging}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg border border-white/10 transition-colors disabled:opacity-50"
            title="Ping Meta Graph API to test Facebook Login configuration health"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin text-accent-gold' : 'text-white/60'}`} />
            {pinging ? 'Pinging Meta...' : 'Test Connection / Ping'}
          </button>

          <a
            href={isConfigured ? '/api/auth/facebook' : '#'}
            onClick={(e) => {
              if (!isConfigured) {
                e.preventDefault();
                toast.error('Facebook_login_Configuration_ID is missing in Vercel environment variables.');
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 ${
              isConfigured
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10'
            } text-xs font-medium rounded-lg transition-colors shadow-sm`}
            title={
              isConfigured
                ? 'Authenticate and link business assets via Meta Business Login'
                : 'Configure Facebook_login_Configuration_ID first'
            }
          >
            <FacebookIcon className="w-3.5 h-3.5" />
            <span>Connect via Facebook Business Login</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
          </a>
        </div>
      </div>

      {/* Initial Error Banner from OAuth Redirect */}
      {initialError && (
        <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="font-semibold text-red-200 block">OAuth Authorization Notice</span>
            <p className="mt-0.5 text-white/70">
              Facebook Business Login could not complete: <code className="font-mono text-red-300 bg-black/40 px-1 py-0.5 rounded">{initialError}</code>. Check that permissions are granted and configuration ID matches.
            </p>
          </div>
        </div>
      )}

      {/* Meta App & Configuration ID Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-white/5">
        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-white/40 block">
            Facebook_login_Configuration_ID
          </span>
          <span className="text-xs font-mono text-white/90 truncate block mt-0.5">
            {maskId(statusResult?.configId || configId)}
          </span>
        </div>

        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-white/40 block">Meta App ID</span>
          <span className="text-xs font-mono text-white/90 truncate block mt-0.5">
            {maskId(statusResult?.appId || appId || '')}
          </span>
        </div>

        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-white/40 block">OAuth Status</span>
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
                <span className="text-xs text-emerald-400 font-medium truncate">Configured & Ready</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-400 font-medium truncate">Awaiting Configuration ID</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Configured Business Products List */}
      <div className="pt-2">
        <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-2">
          Configured Business Products
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {configuredProducts.map((prod) => {
            const Icon = prod.icon;
            return (
              <div
                key={prod.name}
                className="bg-black/25 border border-white/5 rounded-xl p-3 flex items-start gap-3 hover:border-white/10 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${prod.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white font-medium truncate">{prod.name}</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-[11px] text-white/40 leading-snug mt-0.5 line-clamp-2">
                    {prod.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Realtime Ping Live Output */}
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
                  ? 'Facebook Login configuration verified in real time! Meta App & Business Assets are active.'
                  : `Ping Failed: ${statusResult.error || 'Check Facebook_login_Configuration_ID'}`}
              </span>
            </div>
            {typeof statusResult.latency === 'number' && (
              <span className="font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded border border-white/10">
                Latency: {statusResult.latency}ms
              </span>
            )}
          </div>

          {statusResult.products && statusResult.products.length > 0 && (
            <div className="mt-2 text-[11px] text-white/60 flex items-center gap-1.5 flex-wrap">
              <span className="text-white/40">Active Products:</span>
              {statusResult.products.map((p) => (
                <span key={p} className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-white/80 font-mono">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
