import { createClient } from "@/lib/supabase/server";
import { Building2, Plus, Edit2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function AdminSpaces() {
  const supabase = await createClient();
  
  const { data: spaces } = await supabase
    .from('spaces')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Spaces</h1>
          <p className="text-white/50 text-sm tracking-wide">Manage your sanctuary portfolio.</p>
        </div>
        <Link href="/admin/spaces/new" className="flex items-center gap-2 bg-accent-gold text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors">
          <Plus className="w-4 h-4" />
          Add Space
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {spaces?.map((space) => (
          <div key={space.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row gap-8 items-center group">
            <div className="relative w-full md:w-64 h-40 rounded-xl overflow-hidden bg-white/5 shrink-0">
              {space.featured_image ? (
                <Image 
                  src={space.featured_image} 
                  alt={space.title} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <Building2 className="w-8 h-8" />
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-serif text-2xl text-white">{space.title}</h3>
                    {space.active ? (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                        <XCircle className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/50">{space.area}, {space.city}</p>
                </div>
                
                <button className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Nightly Rate</p>
                  <p className="text-white text-sm">₹{space.nightly_price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Max Guests</p>
                  <p className="text-white text-sm">{space.max_guests}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Bedrooms</p>
                  <p className="text-white text-sm">{space.bedrooms}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
