'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Sparkles, ArrowUpRight } from 'lucide-react';

interface StateData {
  name: string;
  budgetAdr: number;
  luxuryAdr: number;
  tierDescription: string;
}

const REGION_DATA: Record<string, StateData> = {
  delhi: {
    name: 'Delhi (Flagship)',
    budgetAdr: 3200,
    luxuryAdr: 6800,
    tierDescription: 'High demand in South Delhi, Hauz Khas & Vasant Vihar.'
  },
  haryana: {
    name: 'Haryana (Gurgaon / NCR)',
    budgetAdr: 3400,
    luxuryAdr: 7200,
    tierDescription: 'Corporate & luxury private hub across Cybercity & Golf Course Ext.'
  },
  uttar_pradesh: {
    name: 'Uttar Pradesh (Noida / Lucknow)',
    budgetAdr: 3000,
    luxuryAdr: 6200,
    tierDescription: 'Rapidly growing residential sanctuary catchments.'
  },
  maharashtra: {
    name: 'Maharashtra (Mumbai / Pune)',
    budgetAdr: 3900,
    luxuryAdr: 8800,
    tierDescription: 'Ultra-high ADR potential in Bandra, Juhu & Koregaon Park.'
  },
  karnataka: {
    name: 'Karnataka (Bengaluru)',
    budgetAdr: 3500,
    luxuryAdr: 7500,
    tierDescription: 'Strong year-round occupancy in Indiranagar & Koramangala.'
  },
  goa: {
    name: 'Goa',
    budgetAdr: 3600,
    luxuryAdr: 8200,
    tierDescription: 'Year-round leisure & retreat demand in Assagao & Anjuna.'
  },
  manipur: {
    name: 'Manipur (Imphal / Hills)',
    budgetAdr: 2800,
    luxuryAdr: 5500,
    tierDescription: 'Emerging exclusive destination & scenic retreat market.'
  },
  pan_india: {
    name: 'Other State / Tier 1-2 City',
    budgetAdr: 3000,
    luxuryAdr: 6000,
    tierDescription: 'Hyperlocalised private sanctuary tailored to local luxury demand.'
  }
};

export default function PartnerCalculator() {
  const [selectedRegion, setSelectedRegion] = useState<string>('delhi');
  const [spaceType, setSpaceType] = useState<'budget' | 'luxury' | 'hybrid'>('luxury');
  const [unitCount, setUnitCount] = useState<number>(2);
  const [occupancyRate, setOccupancyRate] = useState<number>(80);
  const [includeEventsRevenue, setIncludeEventsRevenue] = useState<boolean>(true);

  // Financial Calculations based on nothingness. economics
  const calculations = useMemo(() => {
    const region = REGION_DATA[selectedRegion] || REGION_DATA.delhi;
    const baseSetupFee = 300000; // ₹3 Lakhs base partner onboarding PAN India

    // Fit-out landing costs per space:
    // Budget: ~₹1.5 Lakhs (between 1-2 Lakhs)
    // Luxury: ~₹3.0 Lakhs (between 2-4 Lakhs)
    let fitoutCostPerUnit = 300000;
    let avgAdr = region.luxuryAdr;

    if (spaceType === 'budget') {
      fitoutCostPerUnit = 150000;
      avgAdr = region.budgetAdr;
    } else if (spaceType === 'luxury') {
      fitoutCostPerUnit = 300000;
      avgAdr = region.luxuryAdr;
    } else {
      // Hybrid: 50% budget, 50% luxury
      fitoutCostPerUnit = 225000;
      avgAdr = Math.round((region.budgetAdr + region.luxuryAdr) / 2);
    }

    const totalFitoutCost = fitoutCostPerUnit * unitCount;
    const totalInitialInvestment = baseSetupFee + totalFitoutCost;

    // Monthly Stays Gross
    const occupiedDaysPerMonth = 30 * (occupancyRate / 100);
    const monthlyGrossStays = unitCount * avgAdr * occupiedDaysPerMonth;

    // Add-on: Integrated Vetted Members-Only Events revenue share (~₹12,000 to ₹25,000 / month based on unit count)
    const monthlyEventsRevenue = includeEventsRevenue ? Math.min(unitCount * 12000, 48000) : 0;

    // Add-on: nothingness. Lounge Unlock (Available if > 2 properties in same state)
    const isLoungeEligible = unitCount >= 3;
    const monthlyLoungeRevenue = isLoungeEligible ? 45000 : 0;

    const totalMonthlyGross = monthlyGrossStays + monthlyEventsRevenue + monthlyLoungeRevenue;

    // Operational expenses & revenue distribution
    // Platform operations, tech OS & marketing support: ~20%
    // Local housekeeping, linen turnover & consumables: ~14%
    // Utilities & maintenance reserve: ~8%
    const platformAndOpsFee = totalMonthlyGross * 0.20;
    const housekeepingAndConsumables = unitCount * 9000;
    const utilitiesAndBuffer = unitCount * 4500;

    const totalMonthlyExpenses = platformAndOpsFee + housekeepingAndConsumables + utilitiesAndBuffer;
    const monthlyNetPartnerTakeHome = Math.max(0, totalMonthlyGross - totalMonthlyExpenses);
    const annualNetPartnerIncome = monthlyNetPartnerTakeHome * 12;

    // Realistic Payback period in months
    const paybackMonths = monthlyNetPartnerTakeHome > 0
      ? (totalInitialInvestment / monthlyNetPartnerTakeHome).toFixed(1)
      : 'N/A';

    // Standard Residential Rent Benchmark (for comparison)
    const standardResidentialRent = unitCount * (spaceType === 'budget' ? 22000 : 40000);
    const yieldMultiplier = standardResidentialRent > 0
      ? (monthlyNetPartnerTakeHome / standardResidentialRent).toFixed(1)
      : '2.5';

    return {
      region,
      baseSetupFee,
      totalFitoutCost,
      totalInitialInvestment,
      avgAdr,
      monthlyGrossStays,
      monthlyEventsRevenue,
      monthlyLoungeRevenue,
      isLoungeEligible,
      totalMonthlyGross,
      totalMonthlyExpenses,
      monthlyNetPartnerTakeHome,
      annualNetPartnerIncome,
      paybackMonths,
      standardResidentialRent,
      yieldMultiplier
    };
  }, [selectedRegion, spaceType, unitCount, occupancyRate, includeEventsRevenue]);

  return (
    <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-6 sm:p-8 md:p-12 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      {/* Decorative gradient */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-mono uppercase tracking-widest mb-3">
            <Calculator className="w-3.5 h-3.5" /> Interactive Yield Modeler
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white">
            Project Your <span className="text-accent-gold italic">nothingness.</span> Returns
          </h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
            Simulate realistic revenue based on the ₹3L partner setup, cost-to-cost fit-out landing, local ADRs, and events integration.
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/80 font-mono">Real-time Dynamic Projections</span>
        </div>
      </div>

      {/* Main Grid: Controls vs Results */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-8">
        
        {/* Left Column: Interactive Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Target Region / State */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/50 flex items-center justify-between">
              <span>Target State / Market</span>
              <span className="text-accent-gold">{REGION_DATA[selectedRegion]?.name}</span>
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              aria-label="Target State / Market"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
            >
              {Object.entries(REGION_DATA).map(([key, data]) => (
                <option key={key} value={key} className="bg-black text-white">
                  {data.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-white/40 italic">
              {calculations.region.tierDescription}
            </p>
          </div>

          {/* Space Tier Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/50">
              Space Category &amp; Fit-Out Tier
            </label>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {[
                { id: 'budget', label: 'Budget Space', cost: '₹1L – ₹2L', desc: 'Sleek & Minimal' },
                { id: 'luxury', label: 'Luxury Space', cost: '₹2L – ₹4L', desc: 'Bespoke Finishes' },
                { id: 'hybrid', label: 'Hybrid Portfolio', cost: 'Mixed Tier', desc: 'Balanced Mix' }
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSpaceType(tier.id as any)}
                  className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                    spaceType === tier.id
                      ? 'bg-accent-gold/10 border-accent-gold text-white shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                      : 'bg-white/[0.02] border-white/5 text-white/60 hover:border-white/20'
                  }`}
                >
                  <p className="font-serif text-xs sm:text-sm font-semibold text-white">{tier.label}</p>
                  <p className="text-[10px] font-mono text-accent-gold mt-0.5">{tier.cost} <span className="text-white/40">/space</span></p>
                  <p className="text-[10px] text-white/40 mt-1 hidden sm:block">{tier.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Number of Spaces */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-mono uppercase tracking-[0.2em] text-white/50">
              <span>Active Spaces / Properties</span>
              <span className="text-white font-bold text-sm bg-white/10 px-2.5 py-0.5 rounded-md font-mono">
                {unitCount} {unitCount === 1 ? 'Space' : 'Spaces'}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={unitCount}
              onChange={(e) => setUnitCount(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-gold"
            />
            <div className="flex justify-between text-[10px] text-white/30 font-mono">
              <span>1 Unit</span>
              <span>2 Units</span>
              <span>3 Units (Lounge Unlock ✨)</span>
              <span>8 Units</span>
            </div>
          </div>

          {/* Target Occupancy Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-mono uppercase tracking-[0.2em] text-white/50">
              <span>Projected Monthly Occupancy</span>
              <span className="text-accent-gold font-bold text-sm font-mono">{occupancyRate}%</span>
            </div>
            <input
              type="range"
              min={60}
              max={95}
              step={5}
              value={occupancyRate}
              onChange={(e) => setOccupancyRate(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-gold"
            />
            <div className="flex justify-between text-[10px] text-white/30 font-mono">
              <span>60% (Conservative)</span>
              <span>75% (Standard)</span>
              <span>85%+ (nothingness. Average)</span>
            </div>
          </div>

          {/* Toggles & Add-ons */}
          <div className="pt-2 space-y-3">
            {/* Events Business Access */}
            <div 
              onClick={() => setIncludeEventsRevenue(!includeEventsRevenue)}
              className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center text-xs transition-colors ${
                  includeEventsRevenue ? 'bg-accent-gold text-black font-bold' : 'border border-white/20'
                }`}>
                  {includeEventsRevenue && '✓'}
                </div>
                <div>
                  <p className="text-xs text-white font-medium">Vetted Members-Only Events Revenue Integration</p>
                  <p className="text-[10px] text-white/40">Includes member ticketing commissions &amp; curated gathering access</p>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-mono">+₹{(calculations.monthlyEventsRevenue).toLocaleString('en-IN')}/mo</span>
            </div>

            {/* nothingness. Lounge Unlock Banner */}
            <div className={`p-4 rounded-xl border transition-all ${
              calculations.isLoungeEligible
                ? 'bg-amber-500/[0.07] border-amber-500/30'
                : 'bg-white/[0.01] border-white/5 opacity-60'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${calculations.isLoungeEligible ? 'text-accent-gold' : 'text-white/30'}`} />
                    <p className="text-xs font-semibold text-white">
                      nothingness. Lounge Stream {calculations.isLoungeEligible ? '(UNLOCKED 🎉)' : '(Requires > 2 Spaces in Same State)'}
                    </p>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Exclusive gated community lounge revenue stream for vetted members. Unlocks automatically when operating 3 or more spaces in the same state.
                  </p>
                </div>
                {calculations.isLoungeEligible && (
                  <span className="text-xs text-amber-300 font-mono whitespace-nowrap font-semibold">
                    +₹45,000/mo
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Calculated Yield & Payout Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-black/60 border border-accent-gold/30 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-2xl">
          
          {/* Subtle gold glow accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/15 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            {/* Top Stat: Monthly Net Payout */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent-gold mb-1">
                Projected Partner Net Take-Home
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                  ₹{Math.round(calculations.monthlyNetPartnerTakeHome).toLocaleString('en-IN')}
                </h3>
                <span className="text-xs text-white/50 font-mono">/ month</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>~{calculations.yieldMultiplier}x vs standard residential leasing (₹{calculations.standardResidentialRent.toLocaleString('en-IN')}/mo)</span>
              </p>
            </div>

            {/* Annual Net Income */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Annualized Net Profit</p>
                <p className="text-lg font-serif text-accent-gold font-semibold">
                  ₹{Math.round(calculations.annualNetPartnerIncome).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Est. Payback</p>
                <p className="text-lg font-mono text-white font-bold">{calculations.paybackMonths} Months</p>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Setup Fee (PAN India):</span>
                <span className="font-mono text-white">₹3,00,000 (One-time)</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Fit-Out Landing ({unitCount} {unitCount === 1 ? 'Space' : 'Spaces'}):</span>
                <span className="font-mono text-white">₹{calculations.totalFitoutCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-accent-gold font-medium pt-1 border-t border-white/5">
                <span>Total Initial Capital:</span>
                <span className="font-mono font-bold">₹{calculations.totalInitialInvestment.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex justify-between text-white/60">
                  <span>Projected ADR ({selectedRegion}):</span>
                  <span className="font-mono text-white">₹{calculations.avgAdr.toLocaleString('en-IN')} / night</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Monthly Gross Revenue:</span>
                  <span className="font-mono text-white">₹{Math.round(calculations.totalMonthlyGross).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-white/50 text-[11px]">
                  <span>Est. Ops, Cleaning &amp; Tech Share:</span>
                  <span className="font-mono text-rose-400/80">-₹{Math.round(calculations.totalMonthlyExpenses).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA within card */}
          <div className="pt-6 mt-6 border-t border-white/10 relative z-10">
            <a
              href="#apply-section"
              className="w-full flex items-center justify-center gap-2 bg-accent-gold hover:bg-white text-black py-3.5 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 shadow-xl"
            >
              <span>Apply for this Model</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <p className="text-[10px] text-center text-white/40 mt-2">
              Cost-to-cost vendor transparency. Discretion guaranteed.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
