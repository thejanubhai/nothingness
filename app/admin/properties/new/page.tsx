'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AddPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    area: '',
    city: '',
    state: 'Delhi',
    country: 'India',
    nightly_price: 15000,
    max_guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    featured_image: '',
    active: true,
  });

  const [amenities, setAmenities] = useState<string[]>(['']);
  const [rules, setRules] = useState<string[]>(['']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { error: insertError } = await supabase
        .from('properties')
        .insert({
          ...formData,
          amenities: amenities.filter(a => a.trim() !== ''),
          rules: rules.filter(r => r.trim() !== '').join('\n'),
        });

      if (insertError) throw insertError;
      
      router.push('/admin/properties');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  const handleArrayChange = (setter: any, index: number, value: string, array: string[]) => {
    const newArray = [...array];
    newArray[index] = value;
    setter(newArray);
  };

  const addArrayItem = (setter: any, array: string[]) => {
    setter([...array, '']);
  };

  const removeArrayItem = (setter: any, index: number, array: string[]) => {
    setter(array.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/properties" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl mb-1 text-white">Add Property</h1>
            <p className="text-white/50 text-sm tracking-wide">Create a new sanctuary listing.</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-accent-gold text-black px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Property'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form className="space-y-8">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="font-serif text-xl text-white border-b border-white/10 pb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Property Title</label>
              <input 
                required
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                placeholder="e.g., The Chamber"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">URL Slug</label>
              <input 
                required
                type="text" 
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40">Description</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Featured Image URL</label>
              <input 
                type="url" 
                value={formData.featured_image}
                onChange={(e) => setFormData({...formData, featured_image: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                placeholder="https://..."
              />
            </div>
            
            <div className="flex items-center h-full pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="w-4 h-4 rounded border-white/10 text-accent-gold focus:ring-accent-gold"
                />
                <span className="text-sm text-white">Active Listing</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="font-serif text-xl text-white border-b border-white/10 pb-4">Location & Specs</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Area / Neighborhood</label>
              <input 
                required
                type="text" 
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">City</label>
              <input 
                required
                type="text" 
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Nightly Price (₹)</label>
              <input 
                required
                type="number" 
                value={formData.nightly_price}
                onChange={(e) => setFormData({...formData, nightly_price: Number(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Max Guests</label>
              <input 
                required
                type="number" 
                value={formData.max_guests}
                onChange={(e) => setFormData({...formData, max_guests: Number(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="font-serif text-xl text-white border-b border-white/10 pb-4">Features & Rules</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Amenities</label>
              {amenities.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    type="text" 
                    value={item}
                    onChange={(e) => handleArrayChange(setAmenities, i, e.target.value, amenities)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                    placeholder="e.g., King Size Bed"
                  />
                  <button type="button" onClick={() => removeArrayItem(setAmenities, i, amenities)} className="p-3 text-white/30 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem(setAmenities, amenities)} className="flex items-center gap-2 text-xs text-accent-gold hover:text-accent-gold/80 transition-colors">
                <Plus className="w-3 h-3" /> Add Amenity
              </button>
            </div>
            
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest text-white/40">House Rules</label>
              {rules.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    type="text" 
                    value={item}
                    onChange={(e) => handleArrayChange(setRules, i, e.target.value, rules)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                    placeholder="e.g., No smoking indoors"
                  />
                  <button type="button" onClick={() => removeArrayItem(setRules, i, rules)} className="p-3 text-white/30 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem(setRules, rules)} className="flex items-center gap-2 text-xs text-accent-gold hover:text-accent-gold/80 transition-colors">
                <Plus className="w-3 h-3" /> Add Rule
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
