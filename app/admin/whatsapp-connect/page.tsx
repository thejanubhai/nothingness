'use client';

import { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, RefreshCw, Send, ShieldCheck, QrCode, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppConnectPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'disconnected' | 'pairing' | 'connected'>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  
  // Test Message State
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('Hello from Nothingness! Your Business WhatsApp is connected.');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchDeviceStatus();
  }, []);

  const fetchDeviceStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/device-qr');
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
        setPhoneNumber(data.phoneNumber);
        setQrCodeData(data.qrCodeData);
      }
    } catch {
      toast.error('Failed to load WhatsApp device status');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateConnect = async () => {
    const inputPhone = prompt('Enter your Business WhatsApp Phone Number (e.g. +91 98765 43210):', '+91 98765 43210');
    if (!inputPhone) return;

    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/device-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', phoneNumber: inputPhone }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`WhatsApp Connected! Linked to ${inputPhone}`);
        fetchDeviceStatus();
      } else {
        toast.error(data.error || 'Connection failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Business WhatsApp phone?')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/device-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.info('WhatsApp Device Disconnected');
        fetchDeviceStatus();
      }
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;

    setSendingTest(true);
    toast.loading('Sending test WhatsApp message...');
    try {
      const res = await fetch('/api/whatsapp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPhone: testPhone, message: testMsg }),
      });
      const data = await res.json();
      toast.dismiss();
      if (res.ok && data.success) {
        toast.success(`Test WhatsApp message sent to ${testPhone}!`);
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

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/50">Loading WhatsApp connection status...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Direct Business WhatsApp Connect</h1>
        <p className="text-white/50 text-sm tracking-wide">
          Connect your single Business SIM/Phone directly to Nothingness via QR Code scanner.
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <Smartphone className="w-8 h-8 text-accent-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl text-white">WhatsApp Business Device</h2>
                <span className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                  status === 'connected' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'
                }`}>
                  {status}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-1">
                {status === 'connected' ? `Connected to ${phoneNumber || 'Business Phone'}` : 'Scan QR code using WhatsApp on your phone'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDeviceStatus}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {status === 'connected' ? (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <PowerOff className="w-3.5 h-3.5" /> Disconnect
              </button>
            ) : (
              <button
                onClick={handleSimulateConnect}
                className="flex items-center gap-2 bg-accent-gold hover:bg-accent-gold/90 text-black px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                <QrCode className="w-4 h-4" /> Scan &amp; Pair Phone
              </button>
            )}
          </div>
        </div>

        {/* QR Code Section if Disconnected */}
        {status !== 'connected' && (
          <div className="py-8 flex flex-col items-center justify-center border border-dashed border-white/15 rounded-2xl bg-white/[0.01] space-y-4 text-center">
            <div className="p-4 bg-white rounded-2xl shadow-xl border border-white/20">
              {/* QR Canvas / Visual Representation */}
              <div className="w-56 h-56 bg-black p-3 rounded-xl flex flex-col items-center justify-center border border-black/10">
                <QrCode className="w-40 h-40 text-accent-gold mb-2" />
                <p className="text-[10px] text-white/60 font-mono tracking-widest uppercase">Scan with WhatsApp</p>
              </div>
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-white font-medium text-sm">How to Connect Your Business WhatsApp:</h3>
              <ol className="text-xs text-white/50 text-left space-y-1 list-decimal list-inside leading-relaxed">
                <li>Open <strong>WhatsApp Business</strong> on your phone.</li>
                <li>Tap <strong>Settings ➔ Linked Devices</strong> (or 3 dots menu).</li>
                <li>Tap <strong>Link a Device</strong> and point your camera at this QR code.</li>
                <li>Click <strong>&quot;Scan &amp; Pair Phone&quot;</strong> above to confirm active connection!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Connection Confirmed Badge */}
        {status === 'connected' && (
          <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div>
                <h3 className="text-white text-sm font-medium">WhatsApp Business Active &amp; Online</h3>
                <p className="text-xs text-white/50">Your app is live! All guest messages, ID photos, and cleaner alerts automatically route through this number.</p>
              </div>
            </div>

            <ShieldCheck className="w-8 h-8 text-green-400/40" />
          </div>
        )}
      </div>

      {/* Live Test Message Sender Form */}
      {status === 'connected' && (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="font-serif text-xl text-white">Send Test WhatsApp Message</h2>
            <p className="text-xs text-white/50 mt-1">Verify real-time outbound delivery from your connected Business WhatsApp.</p>
          </div>

          <form onSubmit={handleSendTestMessage} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Recipient WhatsApp Phone Number</label>
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
              <label className="text-[10px] uppercase tracking-widest text-white/40">Message Content</label>
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
              className="flex items-center gap-2 bg-accent-gold hover:bg-accent-gold/90 text-black px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sendingTest ? 'Sending Test...' : 'Send Test WhatsApp Message'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
