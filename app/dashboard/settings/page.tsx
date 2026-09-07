import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Settings, Smartphone, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import EmailUpdateForm from '@/components/EmailUpdateForm';
import RegisterPasskeyButton from '@/components/RegisterPasskeyButton';

export const metadata: Metadata = {
  title: 'Settings | Guest Portal',
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth?redirect=/dashboard/settings');
  }

  let passkeys: any[] = [];
  try {
    if (supabase.auth && (supabase.auth as any).passkey?.list) {
      const { data, error } = await (supabase.auth as any).passkey.list();
      if (!error && Array.isArray(data)) {
        passkeys = data;
      }
    }
  } catch (e) {
    console.warn('[Dashboard Settings] Passkey list retrieval warning:', e);
  }

  // Handle synthetic bridge emails (e.g. 8527976791@auth.nothingness.asia)
  const isSyntheticEmail = Boolean(user.email && user.email.includes('@auth.nothingness'));
  const realEmail = isSyntheticEmail ? (user.user_metadata?.email || '') : (user.email || '');
  const displayPhone = user.phone || user.user_metadata?.phone || (isSyntheticEmail && user.email ? `+${user.email.split('@')[0]}` : 'Phone Not Linked');

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="font-serif text-3xl md:text-4xl text-white mb-1 flex items-center gap-3">
          <Settings className="w-8 h-8 text-accent-gold" />
          Security &amp; Passkeys
        </h1>
        <p className="text-white/50 text-xs sm:text-sm">Manage your biometric passkeys, communication preferences, and sovereign credentials.</p>
      </div>

      <div className="space-y-6">
        
        {/* Email Form */}
        <div className="relative">
          <EmailUpdateForm initialEmail={realEmail} />
          <div className="absolute top-6 right-6 md:top-8 md:right-8">
            {(user.email_confirmed_at || user.user_metadata?.email_confirmed) && !isSyntheticEmail ? (
              <span className="flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            ) : realEmail ? (
              <span className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Pending
              </span>
            ) : null}
          </div>
        </div>

        {/* Primary Identity */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
              <Smartphone className="w-6 h-6 text-white/70" />
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Primary Login Identity</p>
              <p className="text-white font-mono text-lg">{displayPhone}</p>
            </div>
          </div>
          <div className="w-full md:w-auto shrink-0 flex flex-col md:items-end gap-2">
            <span className="bg-white/5 text-white/50 px-4 py-2 rounded-lg text-xs tracking-wide">Cannot be changed</span>
            {user.phone_confirmed_at && (
              <span className="flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </div>
        </div>

        {/* Passkeys */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-accent-gold/10 rounded-2xl flex items-center justify-center border border-accent-gold/20 shrink-0">
              <KeyRound className="w-6 h-6 text-accent-gold" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-white mb-1">Passkeys & Security</h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-lg">
                Setup a Passkey to log in effortlessly using FaceID, TouchID, or Windows Hello. 
                Say goodbye to OTP codes forever.
              </p>
            </div>
          </div>
          
          {passkeys && passkeys.length > 0 && (
            <div className="mb-6 space-y-3">
              {passkeys.map(pk => (
                <div key={pk.id} className="bg-white/[0.04] border border-white/10 px-5 py-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{pk.friendly_name || 'Passkey Device'}</p>
                    <p className="text-white/40 text-xs mt-1">Added {new Date(pk.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
            <RegisterPasskeyButton />
          </div>
        </div>

      </div>
    </div>
  );
}
