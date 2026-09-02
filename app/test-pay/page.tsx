'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

function TestPayContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const txnidParam = searchParams.get('txnid');
  const amountParam = searchParams.get('amount');
  const errorParam = searchParams.get('error');

  const [loading, setLoading] = useState(false);
  const [gatewayInfo, setGatewayInfo] = useState<{
    env: string;
    isTestMode: boolean;
    endpoint: string;
    keyPrefix: string;
    hasSalt: boolean;
  } | null>(null);

  const [amount, setAmount] = useState<number>(10);
  const [name, setName] = useState('Nothingness Tester');
  const [phone, setPhone] = useState('9910778576');
  const [email, setEmail] = useState('admin@nothingness.asia');

  useEffect(() => {
    fetch('/api/test-payment')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setGatewayInfo(data);
      })
      .catch((err) => console.warn('Could not fetch gateway status:', err));
  }, []);

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/test-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, name, phone, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate payment.');
      }

      toast.info(`Connecting to PayU ${data.mode} Gateway...`);

      // Dynamically submit standard PayU form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.paymentUrl;

      Object.entries(data.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      toast.error('Payment Error', { description: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-amber-500/30 selection:text-amber-200 py-16 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-mono uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PayU Gateway Verification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Transaction <span className="text-amber-400">Activator</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Verify your PayU Hosted Checkout integration by initiating a test transaction to activate your merchant account.
          </p>
        </div>

        {/* Callback Result Banner */}
        {statusParam === 'success' && (
          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Payment Successful &amp; Verified!</span>
            </div>
            <p className="text-xs text-zinc-300">
              PayU confirmed the transaction of <strong className="text-emerald-300 font-mono">₹{amountParam || 10}</strong>.
            </p>
            <div className="font-mono text-[11px] text-zinc-400 break-all bg-black/40 p-2.5 rounded-lg border border-emerald-500/20">
              Txn ID: {txnidParam}
            </div>
          </div>
        )}

        {statusParam === 'failed' && (
          <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Transaction Failed or Cancelled</span>
            </div>
            <p className="text-xs text-zinc-300">
              {errorParam || 'The payment could not be completed.'}
            </p>
            {txnidParam && (
              <div className="font-mono text-[11px] text-zinc-400 break-all bg-black/40 p-2.5 rounded-lg border border-rose-500/20">
                Txn ID: {txnidParam}
              </div>
            )}
          </div>
        )}

        {/* Live Gateway Mode Indicator */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">Gateway Status</span>
            {gatewayInfo ? (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${
                gatewayInfo.isTestMode
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}>
                {gatewayInfo.isTestMode ? '⚡ TEST / SANDBOX' : '🟢 LIVE PRODUCTION'}
              </span>
            ) : (
              <span className="text-xs text-zinc-500 font-mono">Resolving...</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1 text-zinc-400">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Endpoint</span>
              <span className="text-zinc-300 truncate block">{gatewayInfo?.endpoint || 'https://test.payu.in/_payment'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Active Key</span>
              <span className="text-zinc-300">{gatewayInfo?.keyPrefix || '••••'}</span>
            </div>
          </div>

          {gatewayInfo?.isTestMode && (
            <div className="mt-2 text-[11px] text-amber-400/90 bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/20 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Test Mode Active:</strong> Using <code className="text-amber-200">payUTESTKEY</code>. To go Live later, simply delete test keys from Vercel.
              </span>
            </div>
          )}
        </div>

        {/* Payment Initiation Form */}
        <form onSubmit={handleInitiatePayment} className="p-6 sm:p-8 rounded-3xl bg-zinc-950/90 border border-zinc-800 shadow-2xl space-y-5">
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-2">
              Select Amount
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[1, 10, 20].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`py-3 rounded-xl font-mono text-sm font-bold transition-all cursor-pointer ${
                    amount === amt
                      ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/10'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Customer Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Phone (10 Digits)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting to PayU...
              </span>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Pay ₹{amount} with PayU</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Test Credentials Reference Helper */}
        {gatewayInfo?.isTestMode && (
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 text-xs text-zinc-400">
            <span className="font-mono font-bold text-zinc-300 block uppercase text-[11px]">
              PayU Sandbox Test Instruments
            </span>
            <div className="space-y-1 font-mono text-[11px] text-zinc-300 bg-black/40 p-3 rounded-xl border border-zinc-800">
              <p>💳 <strong>Card:</strong> 5123 4567 8901 2346</p>
              <p>📅 <strong>Expiry:</strong> 12/2030 | <strong>CVV:</strong> 123</p>
              <p>🔑 <strong>OTP:</strong> 123456</p>
              <p className="pt-1 text-zinc-400">📱 <strong>UPI VPA:</strong> success@payu (or use test simulator)</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <a
            href="/"
            className="text-xs text-zinc-500 hover:text-white transition-colors font-mono"
          >
            ← Return to Nothingness Home
          </a>
        </div>

      </div>
    </div>
  );
}

export default function TestPayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
        Loading Verification Gateway...
      </div>
    }>
      <TestPayContent />
    </Suspense>
  );
}
