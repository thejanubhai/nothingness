'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CloudinaryImage from '@/components/CloudinaryImage';
import { 
  Building2, Plus, Edit2, CheckCircle, XCircle, 
  Trash2, ExternalLink, Users, DollarSign, Search,
  Power
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Space {
  id: string;
  title: string;
  slug: string;
  city?: string;
  area?: string;
  state?: string;
  country?: string;
  nightly_price: number;
  default_guests?: number;
  max_guests?: number;
  max_additional_guests?: number;
  additional_guest_fee?: number;
  bedrooms?: number;
  bathrooms?: number;
  featured_image?: string;
  active: boolean;
  created_at: string;
}

export default function AdminSpacesClient({ initialSpaces }: { initialSpaces: Space[] }) {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredSpaces = spaces.filter((s) => {
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? s.active : !s.active;
    
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      !searchTerm ||
      s.title?.toLowerCase().includes(query) ||
      s.city?.toLowerCase().includes(query) ||
      s.area?.toLowerCase().includes(query) ||
      s.slug?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const handleToggleActive = async (spaceId: string, currentActive: boolean) => {
    setActionLoading(spaceId);
    try {
      const res = await fetch('/api/spaces', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: spaceId, active: !currentActive })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setSpaces(prev => prev.map(s => s.id === spaceId ? { ...s, active: !currentActive } : s));
      toast.success(`Space is now ${!currentActive ? 'Active' : 'Inactive'}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update space status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSpace = async (spaceId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(spaceId);
    try {
      const res = await fetch(`/api/spaces?id=${spaceId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete space');

      setSpaces(prev => prev.filter(s => s.id !== spaceId));
      toast.success(`"${title}" deleted successfully`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete space');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Sanctuary Spaces</h1>
          <p className="text-white/50 text-sm tracking-wide">
            Realtime sanctuary portfolio, capacity policies, and channel sync.
          </p>
        </div>
        <Link 
          href="/admin/spaces/new" 
          className="inline-flex items-center justify-center gap-2 bg-accent-gold hover:bg-white text-black px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Space
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by sanctuary name, city, area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-accent-gold/50"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {(['all', 'active', 'inactive'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setStatusFilter(mode)}
              className={`px-3 py-2 rounded-xl text-xs font-mono capitalize transition-all ${
                statusFilter === mode 
                  ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30 font-bold' 
                  : 'bg-white/[0.02] text-white/50 border border-white/5 hover:text-white'
              }`}
            >
              {mode} ({mode === 'all' ? spaces.length : spaces.filter(s => mode === 'active' ? s.active : !s.active).length})
            </button>
          ))}
        </div>
      </div>

      {/* Spaces List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredSpaces.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl p-8 space-y-4">
            <Building2 className="w-12 h-12 text-accent-gold/60 mx-auto" />
            <h3 className="font-serif text-xl text-white">No Sanctuaries Match Filter</h3>
            <p className="text-sm text-white/50 max-w-sm mx-auto">
              No properties found for &quot;{searchTerm}&quot;. Try adjusting your search query or filter.
            </p>
          </div>
        ) : (
          filteredSpaces.map((space) => {
            const displayImg = space.featured_image || '/images/The Void.png';
            const defaultCount = space.default_guests || 2;
            const maxCount = space.max_guests || 4;
            const extraFee = space.additional_guest_fee || 500;

            return (
              <div 
                key={space.id} 
                className="bg-white/[0.02] border border-white/5 p-5 md:p-6 rounded-2xl flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center group hover:border-white/15 transition-all shadow-xl"
              >
                {/* Image */}
                <div className="relative w-full md:w-64 h-48 md:h-40 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/5">
                  {space.featured_image ? (
                    <CloudinaryImage 
                      src={space.featured_image} 
                      alt={space.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      transformOptions={{ width: 500, height: 350, crop: 'fill', quality: 'auto' }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.02] text-white/30 font-mono text-xs gap-1.5 p-4 text-center">
                      <Building2 className="w-7 h-7 text-accent-gold/40" />
                      <span className="truncate max-w-[180px]">{space.title}</span>
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5">
                    {space.active ? (
                      <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-emerald-300 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/30 font-mono font-bold">
                        <CheckCircle className="w-3 h-3 text-emerald-400" /> Live
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-red-300 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-red-500/30 font-mono font-bold">
                        <XCircle className="w-3 h-3 text-red-400" /> Hidden
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <Link 
                          href={`/admin/spaces/${space.id}`} 
                          className="font-serif text-2xl text-white hover:text-accent-gold transition-colors font-semibold"
                        >
                          {space.title}
                        </Link>
                      </div>
                      <p className="text-xs md:text-sm text-white/50 font-mono">
                        {space.area || 'Secret Location'}, {space.city || 'Delhi NCR'} • {space.state || 'Delhi'}, {space.country || 'India'}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleToggleActive(space.id, space.active)}
                        disabled={actionLoading === space.id}
                        title={space.active ? "Pause / Hide Listing" : "Make Listing Live"}
                        className={`p-2 rounded-lg text-xs transition-colors border ${
                          space.active 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-white/5 text-white/40 border-white/10 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <Link 
                        href={`/spaces/${space.slug}`} 
                        target="_blank"
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-accent-gold" />
                        <span>Live Page</span>
                      </Link>

                      <Link 
                        href={`/admin/spaces/${space.id}`}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors bg-white/5 border border-white/10"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDeleteSpace(space.id, space.title)}
                        disabled={actionLoading === space.id}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400/60 hover:text-red-400 transition-colors bg-red-500/5 border border-red-500/10"
                        title="Delete Space"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/5 pt-3.5 bg-white/[0.01] p-3 rounded-xl">
                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono mb-0.5">Nightly Tariff</p>
                      <p className="text-white text-sm font-bold font-mono">₹{space.nightly_price?.toLocaleString('en-IN')}</p>
                    </div>

                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono mb-0.5">Included Guests</p>
                      <p className="text-accent-gold text-sm font-mono font-medium">{defaultCount} Guests Base</p>
                    </div>

                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono mb-0.5">Max Capacity</p>
                      <p className="text-white text-sm font-mono">{maxCount} Guests (+₹{extraFee}/nt)</p>
                    </div>

                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono mb-0.5">Bedrooms / Baths</p>
                      <p className="text-white text-sm font-mono">{space.bedrooms || 1} Bed • {space.bathrooms || 1} Bath</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
