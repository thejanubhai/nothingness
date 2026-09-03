'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  X, 
  CameraOff, 
  MessageCircle, 
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

interface LiveTicketQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    event_date: string | null;
    tier: string;
    dress_code?: string;
    consent_marshall_name?: string;
    secret_location_address?: string;
    secret_location_coordinates?: string;
    secret_location_instructions?: string;
    location_revealed_hours_before?: number;
  } | null;
  application: {
    id: string;
    category: string;
    qr_secret_token: string;
    status: string;
  } | null;
  userAlias?: string;
  onDropOutSuccess?: () => void;
}

export default function LiveTicketQRModal({
  isOpen,
  onClose,
  event,
  application,
  userAlias = 'Sanctuary Member',
  onDropOutSuccess,
}: LiveTicketQRModalProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showConsentPact, setShowConsentPact] = useState(true);
  const [showDropOutConfirm, setShowDropOutConfirm] = useState(false);
  const [droppingOut, setDroppingOut] = useState(false);

  useEffect(() => {
    if (application?.qr_secret_token && application?.id) {
      const qrPayload = JSON.stringify({
        appId: application.id,
        token: application.qr_secret_token,
        alias: userAlias,
        type: 'sanctuary_event_entry',
      });

      QRCode.toDataURL(qrPayload, {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [application, userAlias]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString().slice(17, 25) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen || !event || !application) return null;

  const eventDateStr = event.event_date;
  const eventTime = eventDateStr ? new Date(eventDateStr).getTime() : Date.now();
  const now = Date.now();
  const hoursUntilEvent = (eventTime - now) / (1000 * 60 * 60);
  const revealHours = event.location_revealed_hours_before || 3;
  const isLocationUnlocked = hoursUntilEvent <= revealHours;

  const handleDropOut = async () => {
    setDroppingOut(true);
    try {
      const res = await fetch(`/api/events/${event.id}/drop-out`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to release slot');

      toast.success('Slot Released', {
        description: 'Your pass has been cancelled and automatically offered to the next waitlisted member.',
      });
      onClose();
      if (onDropOutSuccess) onDropOutSuccess();
    } catch (err: any) {
      toast.error('Drop out error', { description: err.message });
    } finally {
      setDroppingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1-TAP CONSENT PACT OVERLAY */}
        {showConsentPact ? (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-mono uppercase tracking-widest mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sanctuary Gathering Etiquette</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">The 3 Golden Rules</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Adherence is mandatory for entry into all Nothingness Sanctuaries.
              </p>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                <CameraOff className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">1. Sacred Privacy &amp; Phone Protocol</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {event.tier === 'munch'
                      ? 'In Munches, phones are allowed in this social setting where physical vetting takes place.'
                      : 'All phones are safely stored outside the premises prior to entering. Zero cameras ensure total peace of mind.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">2. Explicit Verbal Consent</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    "No means No. Silence is NOT consent." Always ask verbally before any physical touch or scene engagement.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">3. Floor Consent Marshall On-Duty</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {event.consent_marshall_name || 'Aria (Floor Lead)'} is available in the lounge at all times if you feel uncomfortable.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowConsentPact(false)}
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>I Agree • Reveal In-App Dynamic QR</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* LIVE QR & PASS CARD */
          <div className="space-y-5">
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold">
                Dynamic Gatekeeper Pass
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">{event.title}</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">Attendee: @{userAlias} • {application.category}</p>
            </div>

            {/* Pulsing QR Display */}
            <div className="relative p-5 rounded-3xl bg-white flex flex-col items-center justify-center shadow-2xl mx-auto max-w-[260px]">
              <div className="absolute -top-2 px-3 py-0.5 rounded-full bg-black text-rose-400 font-mono text-[9px] font-bold border border-rose-500/40">
                LIVE • {currentTime}
              </div>
              {qrUrl ? (
                <img src={qrUrl} alt="Entry QR" className="w-48 h-48 rounded-xl object-contain" />
              ) : (
                <div className="w-48 h-48 bg-zinc-200 animate-pulse rounded-xl" />
              )}
              <span className="text-[9px] text-zinc-600 font-mono mt-2">
                Anti-Screenshot Dynamic Pulse
              </span>
            </div>

            <div className="text-center space-y-1">
              <span className="text-[11px] text-amber-300 font-mono font-bold block">
                ✦ Dual Event Entry &amp; In-Person Vetting QR
              </span>
              <p className="text-[10px] text-zinc-400 font-mono max-w-xs mx-auto">
                Admit yourself at the door, or present to a Nothingness team lead during the Munch for discreet in-person vetting.
              </p>
            </div>

            {/* Secret Location Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Secret Venue Coordinates
                </span>
                {isLocationUnlocked ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono">
                    UNLOCKED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[9px] font-mono">
                    LOCKED (T-{revealHours}H)
                  </span>
                )}
              </div>

              {isLocationUnlocked ? (
                <div className="space-y-2 pt-1 text-xs">
                  <p className="font-bold text-white">{event.secret_location_address || 'Discreet Sanctuary Penthouse'}</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {event.secret_location_instructions || 'Take private elevator to top floor. Whisper your @alias to the door host.'}
                  </p>
                  {event.secret_location_coordinates && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.secret_location_coordinates)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold font-mono pt-1"
                    >
                      <span>Open in Discreet Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                  Coordinates unlock automatically on your screen {revealHours} hours before the gathering starts.
                </p>
              )}
            </div>

            {/* Floor Marshall Tag */}
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-zinc-300">Floor Consent Lead:</span>
              </div>
              <span className="font-bold text-purple-300 font-mono">
                {event.consent_marshall_name || 'Aria (Floor Lead)'}
              </span>
            </div>

            {/* Release Slot / Drop Out */}
            <div className="pt-1 border-t border-zinc-900">
              {!showDropOutConfirm ? (
                <button
                  onClick={() => setShowDropOutConfirm(true)}
                  className="w-full text-center text-[11px] text-zinc-500 hover:text-rose-400 transition-colors font-mono cursor-pointer py-1"
                >
                  I Can No Longer Attend (Release My Slot)
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2 text-center">
                  <p className="text-xs text-rose-300 font-bold">Release your confirmed spot?</p>
                  <p className="text-[10px] text-zinc-400">
                    As per policy, passes are non-refundable. Your seat will be transferred to the next waitlisted member.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowDropOutConfirm(false)}
                      className="flex-1 py-1.5 bg-zinc-900 text-zinc-400 text-xs font-bold rounded-lg"
                    >
                      Keep Pass
                    </button>
                    <button
                      onClick={handleDropOut}
                      disabled={droppingOut}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg"
                    >
                      {droppingOut ? 'Releasing...' : 'Confirm Release'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
