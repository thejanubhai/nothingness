'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export default function FooterBrandStrips() {
  return (
    <div className="w-full border-b border-white/10">
      {/* 1. Featured On Section */}
      <div className="py-8 md:py-10 border-b border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.25em] text-white/50 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
              Featured On
            </span>
          </div>

          <div className="w-full flex flex-wrap items-center justify-center md:justify-end gap-4 sm:gap-6 md:gap-8">
            {/* ScoopWhoop */}
            <div
              className="group flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/40 hover:bg-red-500/[0.04] transition-all duration-300 shadow-sm cursor-default"
              title="Featured on ScoopWhoop"
            >
              <svg className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.08L2 22l5.08-1.38C8.54 21.49 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
              </svg>
              <div className="flex flex-col">
                <span className="font-black text-xs sm:text-sm tracking-tight text-white/80 group-hover:text-white transition-colors">
                  Scoop<span className="text-red-500">Whoop</span>
                </span>
                <span className="text-[9px] font-mono text-white/40 tracking-wider">Editorial Feature</span>
              </div>
            </div>

            {/* The Indian Express */}
            <div
              className="group flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-accent-gold/40 hover:bg-accent-gold/[0.04] transition-all duration-300 shadow-sm cursor-default"
              title="Featured in The Indian Express"
            >
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-serif font-black text-accent-gold group-hover:scale-110 transition-transform">
                IE
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-xs sm:text-[13px] tracking-wide text-white/80 group-hover:text-white transition-colors">
                  The Indian <span className="font-serif italic font-normal text-accent-gold">EXPRESS</span>
                </span>
                <span className="text-[9px] font-mono text-white/40 tracking-wider">Culture &amp; Lifestyle</span>
              </div>
            </div>

            {/* Reddit */}
            <div
              className="group flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#FF4500]/40 hover:bg-[#FF4500]/[0.04] transition-all duration-300 shadow-sm cursor-default"
              title="Trending on Reddit"
            >
              <svg className="w-5 h-5 text-[#FF4500] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
                <path fill="#fff" d="M12 4.5a1.5 1.5 0 0 1 1.48 1.25l2.4.5a1.25 1.25 0 1 1 .62 1.15l-2.65-.55-.7 3.28c1.3.08 2.5.47 3.4 1.1a1.65 1.65 0 0 1 1.7 2.72c.03.2.05.4.05.6 0 2.65-2.8 4.8-6.3 4.8s-6.3-2.15-6.3-4.8c0-.2.02-.4.05-.6a1.65 1.65 0 0 1 1.7-2.72c.9-.63 2.1-1.02 3.4-1.1l.9-4.23a1.5 1.5 0 0 1 .25-.3zm-2.5 8a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm-4.7 3.7c.3.4.9.8 2.2.8s1.9-.4 2.2-.8a.3.3 0 0 0-.4-.4c-.3.3-.8.6-1.8.6s-1.5-.3-1.8-.6a.3.3 0 0 0-.4.4z" />
              </svg>
              <div className="flex flex-col">
                <span className="font-bold text-xs sm:text-[13px] tracking-tight text-white/80 group-hover:text-white transition-colors">
                  reddit
                </span>
                <span className="text-[9px] font-mono text-white/40 tracking-wider">Community Spotlight</span>
              </div>
            </div>

            {/* Homegrown */}
            <div
              className="group hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/30 hover:bg-white/[0.04] transition-all duration-300 cursor-default"
              title="Featured on Homegrown"
            >
              <span className="font-mono font-black text-xs tracking-widest text-white/70 group-hover:text-white transition-colors uppercase">
                Homegrown
              </span>
              <span className="text-[9px] font-mono text-white/40 tracking-wider hidden lg:inline">Magazine</span>
            </div>

            {/* LBB */}
            <div
              className="group hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-400/40 hover:bg-amber-400/[0.04] transition-all duration-300 cursor-default"
              title="Featured on LBB"
            >
              <span className="font-bold text-xs tracking-wider text-amber-400/80 group-hover:text-amber-400 transition-colors uppercase">
                LBB
              </span>
              <span className="text-[9px] font-mono text-white/40 tracking-wider hidden lg:inline">Delhi Secret</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Listed On Section */}
      <div className="py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
            <h4 className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.25em] text-white/50 font-semibold">
              Listed On
            </h4>
          </div>

          {/* Grid / Row of Booking Platforms */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 items-center">
            {/* Airbnb */}
            <div className="group flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#FF5A5F]/40 hover:bg-[#FF5A5F]/[0.03] transition-all duration-300 cursor-default" title="Airbnb">
              <svg className="w-5 h-5 text-[#FF5A5F] opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 1c-2.4 0-4.5 1.5-5.3 3.7C9.9 2.5 7.8 1 5.4 1 2.4 1 0 3.4 0 6.4c0 4.7 6.4 10.4 10.7 14.1.4.3.9.3 1.3 0 4.3-3.7 10.7-9.4 10.7-14.1C22.7 3.4 20.3 1 17.3 1z" />
                <path d="M16 4.2c1.7 0 3.1 1.2 3.6 2.8.2.7.2 1.4.1 2.1-.5 2.5-2 4.9-3.7 7.2-1.7-2.3-3.2-4.7-3.7-7.2-.1-.7-.1-1.4.1-2.1.5-1.6 1.9-2.8 3.6-2.8z" fill="#000" />
                <path d="M16 2.5C13.2 2.5 11 4.7 11 7.5c0 3.8 3.2 7.7 5 9.7 1.8-2 5-5.9 5-9.7 0-2.8-2.2-5-5-5zm0 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
              </svg>
              <span className="text-xs font-semibold text-white/60 group-hover:text-white transition-colors">
                airbnb
              </span>
            </div>

            {/* MakeMyTrip */}
            <div className="group flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#EB2026]/40 hover:bg-[#EB2026]/[0.03] transition-all duration-300 cursor-default" title="MakeMyTrip">
              <span className="w-5 h-5 rounded-md bg-[#EB2026] text-[9px] font-black text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                my
              </span>
              <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors tracking-tight">
                makemytrip
              </span>
            </div>

            {/* Goibibo */}
            <div className="group flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#F26722]/40 hover:bg-[#F26722]/[0.03] transition-all duration-300 cursor-default" title="Goibibo">
              <span className="w-5 h-5 rounded-full bg-[#F26722] text-[10px] font-black text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                go
              </span>
              <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">
                goibibo
              </span>
            </div>

            {/* Vrbo */}
            <div className="group flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#2F5BEA]/40 hover:bg-[#2F5BEA]/[0.05] transition-all duration-300 cursor-default" title="Vrbo">
              <svg className="w-4 h-4 text-[#2F5BEA] group-hover:scale-105 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h3v12H4zm5 0h3v12H9zm5 0h3v12h-3zm5 0h3v12h-3z" />
              </svg>
              <span className="text-xs font-bold text-white/60 group-hover:text-[#6A94FE] transition-colors lowercase tracking-wide">
                vrbo
              </span>
            </div>

            {/* Booking.com */}
            <div className="group flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#003580]/80 hover:bg-[#003580]/[0.05] transition-all duration-300 cursor-default" title="Booking.com">
              <span className="w-4 h-4 rounded bg-[#003580] text-white text-[10px] font-black flex items-center justify-center group-hover:scale-105 transition-transform">
                B.
              </span>
              <span className="text-xs font-semibold text-white/60 group-hover:text-white transition-colors">
                Booking<span className="text-[#006CE4]">.com</span>
              </span>
            </div>

            {/* Agoda */}
            <div className="group flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-400/40 hover:bg-purple-400/[0.03] transition-all duration-300 cursor-default" title="Agoda">
              <div className="flex gap-0.5 group-hover:scale-105 transition-transform">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              </div>
              <span className="text-xs font-semibold text-white/60 group-hover:text-white transition-colors lowercase">
                agoda
              </span>
            </div>

            {/* Planet of Hotels */}
            <div className="group flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-teal-400/40 hover:bg-teal-400/[0.03] transition-all duration-300 cursor-default" title="Planet of Hotels">
              <svg className="w-4 h-4 text-teal-400/80 group-hover:text-teal-300 group-hover:scale-105 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="8" />
                <path d="M3 12h18" />
                <path d="M12 3a15 15 0 0 1 0 18" />
              </svg>
              <span className="text-[11px] font-medium text-white/60 group-hover:text-white transition-colors whitespace-nowrap">
                PlanetOfHotels
              </span>
            </div>

            {/* OwnerDirect */}
            <div className="group flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/[0.03] transition-all duration-300 cursor-default" title="OwnerDirect">
              <svg className="w-4 h-4 text-amber-400/80 group-hover:text-amber-300 group-hover:scale-105 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="text-[11px] font-medium text-white/60 group-hover:text-white transition-colors whitespace-nowrap">
                OwnerDirect
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
