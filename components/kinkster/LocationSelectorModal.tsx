'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Check, Globe, Shield, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Metro {
  id: string;
  name: string;
  city: string;
  region: string;
  country: string;
}

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationChanged?: (newLoc: { city: string; region: string; country: string; enabled: boolean }) => void;
}

export default function LocationSelectorModal({
  isOpen,
  onClose,
  onLocationChanged,
}: LocationSelectorModalProps) {
  const [metros, setMetros] = useState<Metro[]>([]);
  const [currentCity, setCurrentCity] = useState<string>('Delhi');
  const [discoveryEnabled, setDiscoveryEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchLocation = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/kinkster/location');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMetros(data.supportedMetros || []);
            if (data.currentLocation) {
              setCurrentCity(data.currentLocation.city || 'Delhi');
              setDiscoveryEnabled(data.currentLocation.enabled !== false);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load discovery location:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLocation();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectMetro = async (metro: Metro) => {
    setSaving(true);
    try {
      const isGlobal = metro.id === 'global' || !metro.city;
      const payload = {
        city: isGlobal ? '' : metro.city,
        region: isGlobal ? '' : metro.region,
        country: isGlobal ? '' : metro.country,
        enabled: isGlobal ? false : true,
      };

      const res = await fetch('/api/kinkster/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update discovery location.');

      setCurrentCity(payload.city);
      setDiscoveryEnabled(payload.enabled);
      toast.success(`Discovery metro set to ${metro.name}`);

      if (onLocationChanged) {
        onLocationChanged(payload);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('discovery-location-changed', { detail: payload }));
      }

      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-white animate-scaleUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 id="location-modal-title" className="text-base font-bold font-serif">Discovery Sanctuary Metro</h3>
              <p className="text-[11px] font-mono text-zinc-400">Calibrate local circles &amp; gatherings</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Privacy Assurance Pill */}
        <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-start gap-2 text-zinc-400 text-xs">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-zinc-200">Zero GPS Leaks:</strong> Exact coordinates are never tracked or revealed. Relevance is computed coarsely across sanctuary clusters.
          </p>
        </div>

        {/* Metro List */}
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-zinc-500 text-xs font-mono">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Loading sanctuary clusters...</span>
            </div>
          ) : (
            metros.map((metro) => {
              const isSelected = (!discoveryEnabled && metro.id === 'global') ||
                (discoveryEnabled && currentCity && metro.city && currentCity.toLowerCase() === metro.city.toLowerCase());

              return (
                <button
                  key={metro.id}
                  type="button"
                  disabled={saving}
                  onClick={() => handleSelectMetro(metro)}
                  className={`w-full px-4 py-3 rounded-2xl flex items-center justify-between text-left transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-bold'
                      : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {metro.id === 'global' ? (
                      <Globe className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <MapPin className="w-4 h-4 text-amber-400/70" />
                    )}
                    <div>
                      <div className="text-xs font-mono">{metro.name}</div>
                      {metro.region && (
                        <div className="text-[10px] text-zinc-500 font-mono">{metro.region}, {metro.country}</div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
