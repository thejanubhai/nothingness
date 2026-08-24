'use client';

import React from 'react';
import { MapPin, Sparkles, CheckCircle2, Compass, ArrowRight, ShieldCheck } from 'lucide-react';

interface ExpansionState {
  order: number;
  state: string;
  badge: 'Active Flagship' | 'Active & Onboarding' | 'Open for Onboarding' | 'Priority Rollout' | 'Strategic Expansion' | 'Upcoming';
  badgeColor: string;
  primeCatchments: string[];
  description: string;
  demandIndex: string;
  spacesTarget: string;
}

const EXPANSION_PIPELINE: ExpansionState[] = [
  {
    order: 1,
    state: 'Delhi (NCT)',
    badge: 'Active Flagship',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    primeCatchments: ['South Delhi', 'Hauz Khas', 'Greater Kailash', 'Vasant Vihar', 'Defence Colony'],
    description: 'High-density vetted member network, near-100% weekend occupancy and flagship brand recognition.',
    demandIndex: '98% Occupancy',
    spacesTarget: '12+ Sanctuaries Active'
  },
  {
    order: 2,
    state: 'Haryana',
    badge: 'Active & Onboarding',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    primeCatchments: ['Cybercity Gurgaon', 'Golf Course Ext Rd', 'Sohna Rd', 'Faridabad', 'Panchkula'],
    description: 'Corporate luxury, executive staycationers, and high-spending private clientele.',
    demandIndex: 'High ADR Growth',
    spacesTarget: '8 Active / Expanding'
  },
  {
    order: 3,
    state: 'Uttar Pradesh',
    badge: 'Open for Onboarding',
    badgeColor: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20',
    primeCatchments: ['Noida Expressway', 'Sector 128 / 137', 'Greater Noida', 'Lucknow Gomti Nagar'],
    description: 'Rapidly growing luxury apartment corridors with high residential privacy.',
    demandIndex: 'Rapid Scalability',
    spacesTarget: '6 Spaces in Pipeline'
  },
  {
    order: 4,
    state: 'Maharashtra',
    badge: 'Priority Rollout',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    primeCatchments: ['Bandra West', 'Juhu', 'BKC Hub', 'Khar', 'Pune Koregaon Park'],
    description: 'India’s premier luxury & entertainment capital. Highest projected ADR and private member waitlist.',
    demandIndex: 'Premium ADR Hub',
    spacesTarget: 'Immediate Launch Target'
  },
  {
    order: 5,
    state: 'Karnataka (Bengaluru)',
    badge: 'Priority Rollout',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    primeCatchments: ['Indiranagar', 'Koramangala', 'Lavelle Road', 'Whitefield', 'HSR Layout'],
    description: 'Tech founders, venture ecosystem, and high-disposable-income lifestyle demographic.',
    demandIndex: 'Consistent High Yield',
    spacesTarget: 'Immediate Launch Target'
  },
  {
    order: 6,
    state: 'Goa',
    badge: 'Priority Rollout',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    primeCatchments: ['Assagao', 'Anjuna', 'Vagator', 'Siolim', 'Morjim'],
    description: 'Year-round boutique sanctuary and villa retreats for vetted travelers and creators.',
    demandIndex: '3.2x RevPAR Potential',
    spacesTarget: 'Villa & Suite Model'
  },
  {
    order: 7,
    state: 'Manipur',
    badge: 'Strategic Expansion',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    primeCatchments: ['Imphal Central', 'Scenic Foothills', 'Bespoke Hill Retreats'],
    description: 'Pioneering exclusive luxury hospitality in the North East with scenic architectural retreats.',
    demandIndex: 'Exclusive Eco-Luxury',
    spacesTarget: 'Selective 2-3 Sanctuaries'
  },
  {
    order: 8,
    state: 'Pan-India Corridors',
    badge: 'Upcoming',
    badgeColor: 'bg-white/10 text-white/60 border-white/10',
    primeCatchments: ['Telangana (Hyderabad - Jubilee Hills)', 'Rajasthan (Jaipur)', 'Himachal / Uttarakhand'],
    description: 'Evaluating high-profile real estate assets with strategic local partners.',
    demandIndex: 'On-Demand Evaluation',
    spacesTarget: 'Phase 2 Pipeline'
  }
];

export default function ExpansionRoadmap() {
  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-gold/80 font-mono mb-2">
            Pan-India Blueprint
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white">
            Expansion <span className="text-accent-gold italic">Roadmap</span>
          </h2>
          <p className="text-white/60 text-xs sm:text-sm max-w-xl mt-1">
            We are expanding <span className="font-mono text-white">nothingness.</span> through vetted regional partners across key high-demand economic and luxury lifestyle corridors.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-white/50 bg-white/[0.02] border border-white/5 px-3.5 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-accent-gold" />
          <span>100% Digital State Police &amp; Statutory ID Compliance</span>
        </div>
      </div>

      {/* Grid of States */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {EXPANSION_PIPELINE.map((item) => (
          <div
            key={item.order}
            className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-5 sm:p-6 hover:border-accent-gold/30 hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Order Number & Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs text-white/60 group-hover:text-accent-gold group-hover:border-accent-gold/40 transition-colors">
                  0{item.order}
                </span>
                <span className={`text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border font-mono ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>

              {/* State Title */}
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-accent-gold transition-colors flex items-center gap-1.5">
                {item.state}
              </h3>

              <p className="text-xs text-white/60 leading-relaxed mb-4">
                {item.description}
              </p>

              {/* Prime Localities */}
              <div className="space-y-1.5 pt-3 border-t border-white/5">
                <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Prime Catchments:</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.primeCatchments.map((loc, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-white/70 border border-white/5"
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
              <span className="text-accent-gold font-medium">{item.demandIndex}</span>
              <span className="text-white/40">{item.spacesTarget}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
