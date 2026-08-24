'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X, Star, Link as LinkIcon, Download, Calendar, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AddSpacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [airbnbUrl, setAirbnbUrl] = useState('');
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
    airbnb_listing_id: '',
    airbnb_ical_url: '',
    check_in_time: '3:00 PM',
    check_out_time: '11:00 AM',
    key_instructions: '',
    pre_arrival_template: '',
    post_checkout_feedback_template: '',
    cleaner_name: 'Housekeeping Team',
    cleaner_phone: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>(['']);
  const [rules, setRules] = useState<string[]>(['']);
  
  // Calendar Sync Sources
  const [syncSources, setSyncSources] = useState<{platform: string, url: string}[]>([]);
  const [newSourcePlatform, setNewSourcePlatform] = useState('airbnb');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  const handleImportAirbnb = async () => {
    if (!airbnbUrl) return;
    
    setImporting(true);
    toast.info('Importing listing data from Airbnb...');
    
    try {
      const res = await fetch('/api/spaces/scrape-airbnb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: airbnbUrl })
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to import');
      }
      
      const data = result.data;
      
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        slug: data.slug || (data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : prev.slug),
        description: data.description || prev.description,
        area: data.location?.area || prev.area,
        city: data.location?.city || prev.city,
        state: data.location?.state || prev.state,
        country: data.location?.country || prev.country,
        nightly_price: data.price_per_night || prev.nightly_price,
        max_guests: data.max_guests || prev.max_guests,
        bedrooms: data.bedrooms || prev.bedrooms,
        bathrooms: data.bathrooms || prev.bathrooms,
        airbnb_listing_id: data.airbnb_listing_id || prev.airbnb_listing_id,
        airbnb_ical_url: data.airbnb_ical_url || prev.airbnb_ical_url,
        check_in_time: data.check_in_time || prev.check_in_time,
        check_out_time: data.check_out_time || prev.check_out_time,
        key_instructions: data.key_instructions || prev.key_instructions,
        pre_arrival_template: data.pre_arrival_template || prev.pre_arrival_template,
        post_checkout_feedback_template: data.post_checkout_feedback_template || prev.post_checkout_feedback_template,
        cleaner_name: data.cleaner_name || prev.cleaner_name,
        cleaner_phone: data.cleaner_phone || prev.cleaner_phone,
      }));
      
      if (data.photos && data.photos.length > 0) {
        setImages(data.photos);
        setFormData(prev => ({ ...prev, featured_image: data.photos[0] }));
      }
      
      if (data.amenities && data.amenities.length > 0) {
        setAmenities(data.amenities);
      }
      
      if (data.house_rules && data.house_rules.length > 0) {
        setRules(data.house_rules);
      }
      
      // Auto-add the iCal source if we got the placeholder URL
      if (data.airbnb_ical_url) {
        setSyncSources([{ platform: 'airbnb', url: data.airbnb_ical_url }]);
      }
      
      toast.success('Airbnb listing imported successfully with all photos, specs & amenities!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error importing Airbnb listing');
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Insert the space via /api/spaces
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images,
          amenities: amenities.filter(a => a.trim() !== ''),
          rules: rules.filter(r => r.trim() !== '').join('\n'),
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create space');
      
      const space = data.space;

      // 2. Insert calendar sync sources if any
      if (syncSources.length > 0 && space) {
        const supabase = createClient();
        const sourcesToInsert = syncSources.map(source => ({
          space_id: space.id,
          platform: source.platform,
          inbound_ical_url: source.url,
          is_active: true,
          sync_status: 'pending'
        }));
        
        const { error: syncError } = await supabase
          .from('calendar_sync_sources')
          .insert(sourcesToInsert);
          
        if (syncError) {
          console.error("Failed to add sync sources", syncError);
          toast.warning('Space created, but some calendar sources failed to save.');
        } else {
          // Trigger initial sync if real iCal URL provided (without YOUR_HASH_HERE)
          const validSources = syncSources.filter(s => !s.url.includes('YOUR_HASH_HERE'));
          if (validSources.length > 0) {
            fetch('/api/spaces/sync-calendar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ space_id: space.id })
            }).catch(console.error);
          }
        }
      }
      
      toast.success('Space created successfully in Supabase!');
      router.push('/admin/spaces');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create space');
      toast.error(err.message || 'Failed to create space');
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

  const removeArrayItem = (setter: any, index: number, array: any[]) => {
    setter(array.filter((_, i) => i !== index));
  };
  
  const addSyncSource = () => {
    if (!newSourceUrl.trim()) return;
    setSyncSources([...syncSources, { platform: newSourcePlatform, url: newSourceUrl }]);
    setNewSourceUrl('');
  };

  const addImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      setImages([...images, url]);
      if (!formData.featured_image) {
        setFormData({...formData, featured_image: url});
      }
    }
  };

  const toggleFeaturedImage = (url: string) => {
    setFormData({...formData, featured_image: url});
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/spaces" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl mb-1 text-white">Add Space</h1>
            <p className="text-white/50 text-sm tracking-wide">Create a new sanctuary listing.</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-accent-gold text-black px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Space'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}
      
      {/* Airbnb Auto-Import Section */}
      <div className="bg-gradient-to-r from-accent-gold/10 to-transparent border border-accent-gold/20 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Download className="w-5 h-5 text-accent-gold" />
          <h2 className="font-serif text-xl text-white">Import from Airbnb</h2>
        </div>
        <p className="text-sm text-white/50 mb-4">Paste an Airbnb listing URL to automatically extract details and photos.</p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="url" 
            value={airbnbUrl}
            onChange={(e) => setAirbnbUrl(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
            placeholder="https://www.airbnb.com/rooms/1234567"
          />
          <button 
            type="button"
            onClick={handleImportAirbnb}
            disabled={importing || !airbnbUrl}
            className="flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-50 border border-white/10 hover:border-white/20 whitespace-nowrap"
          >
            {importing ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Importing...
              </span>
            ) : (
              'Fetch Listing'
            )}
          </button>
        </div>
      </div>

      <form className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="font-serif text-xl text-white border-b border-white/10 pb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Space Title</label>
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
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
            />
          </div>
          
          <div className="flex items-center pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                className="w-4 h-4 rounded border-white/10 text-accent-gold focus:ring-accent-gold bg-transparent"
              />
              <span className="text-sm text-white">Active Listing (visible to public)</span>
            </label>
          </div>
        </div>
        
        {/* Gallery Section */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="font-serif text-xl text-white">Photo Gallery</h2>
            <button type="button" onClick={addImage} className="flex items-center gap-1 text-xs text-accent-gold hover:text-white transition-colors">
              <Plus className="w-3 h-3" /> Add Image
            </button>
          </div>
          
          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((url, idx) => (
                <div key={idx} className={`relative group aspect-square rounded-lg overflow-hidden border ${formData.featured_image === url ? 'border-accent-gold' : 'border-white/10'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Space image ${idx}`} className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <button 
                      type="button"
                      onClick={() => removeArrayItem(setImages, idx, images)} 
                      className="self-end p-1 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => toggleFeaturedImage(url)} 
                      className={`flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs transition-colors ${
                        formData.featured_image === url ? 'bg-accent-gold text-black' : 'bg-white/20 text-white hover:bg-white/40'
                      }`}
                    >
                      <Star className="w-3 h-3" fill={formData.featured_image === url ? 'currentColor' : 'none'} />
                      {formData.featured_image === url ? 'Featured' : 'Set Featured'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center border border-dashed border-white/20 rounded-xl bg-white/5">
              <ImageIcon className="w-8 h-8 text-white/30 mb-2" />
              <p className="text-sm text-white/50">No images added yet</p>
              <p className="text-xs text-white/30 mt-1">Import from Airbnb or add manually</p>
            </div>
          )}
        </div>

        {/* Location & Specs */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="font-serif text-xl text-white border-b border-white/10 pb-4">Location & Specs</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Bedrooms</label>
              <input 
                required
                type="number" 
                value={formData.bedrooms}
                onChange={(e) => setFormData({...formData, bedrooms: Number(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Bathrooms</label>
              <input 
                required
                type="number" 
                value={formData.bathrooms}
                onChange={(e) => setFormData({...formData, bathrooms: Number(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              />
            </div>
          </div>
        </div>

        {/* Features & Rules */}
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
        
        {/* Calendar Sync Setup */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Calendar className="w-5 h-5 text-accent-gold" />
            <h2 className="font-serif text-xl text-white">Calendar Sync (Two-Way iCal)</h2>
          </div>
          
          <div className="space-y-6">
            {/* Outbound Feed */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-accent-gold font-bold mb-2">Our Live iCal Feed (Export to Airbnb / Booking.com)</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : 'https://nothingness.asia'}/api/spaces/${formData.slug || '[slug]'}/ical`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white/70 font-mono focus:outline-none"
                />
                <button 
                  type="button"
                  onClick={() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nothingness.asia';
                    navigator.clipboard.writeText(`${origin}/api/spaces/${formData.slug || '[slug]'}/ical`);
                    toast.success('iCal URL copied to clipboard');
                  }}
                  className="px-5 bg-accent-gold text-black hover:bg-accent-gold/90 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                >
                  Copy Live URL
                </button>
              </div>
              <p className="text-xs text-white/40 mt-2">
                Paste this URL into Airbnb (Listing &gt; Pricing and availability &gt; Calendar sync &gt; Import calendar) so Airbnb blocks dates whenever someone books on Nothingness.
              </p>
            </div>

            {/* Inbound Feeds */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Connected Platforms (Import into Nothingness)</p>
              </div>
              
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs text-white/60 space-y-1">
                <p className="font-semibold text-accent-gold flex items-center gap-1.5">
                  <span>ℹ️</span> How to get your Airbnb Calendar Link:
                </p>
                <p className="text-[11px] text-white/40">
                  1. In Airbnb Host Mode, open this Listing &gt; Pricing and availability.<br />
                  2. Scroll down to <strong>Calendar sync</strong> &gt; Click <strong>Export calendar</strong>.<br />
                  3. Copy the full <code className="text-white/70 bg-white/10 px-1 py-0.5 rounded">.ics</code> URL and paste it below.
                </p>
              </div>
              
              {syncSources.map((source, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-lg">
                  <div className="bg-black/50 p-2 rounded-md">
                    <LinkIcon className="w-4 h-4 text-accent-gold" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-white capitalize">{source.platform}</p>
                      {source.url.includes('YOUR_HASH_HERE') && (
                        <span className="text-[9px] uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">
                          Replace with real .ics URL
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/50 truncate font-mono">{source.url}</p>
                  </div>
                  <button type="button" onClick={() => removeArrayItem(setSyncSources, i, syncSources)} className="p-2 text-white/30 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {syncSources.length === 0 && (
                <div className="text-sm text-white/30 py-2">No external calendars connected yet.</div>
              )}
              
              <div className="flex flex-col md:flex-row gap-3 pt-2">
                <select 
                  value={newSourcePlatform}
                  onChange={(e) => setNewSourcePlatform(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50 md:w-48"
                >
                  <option value="airbnb" className="bg-black text-white">Airbnb</option>
                  <option value="booking.com" className="bg-black text-white">Booking.com</option>
                  <option value="vrbo" className="bg-black text-white">VRBO</option>
                  <option value="custom" className="bg-black text-white">Custom iCal</option>
                </select>
                <input 
                  type="url" 
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="https://www.airbnb.com/calendar/ical/...ics?s=..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50 font-mono text-xs"
                />
                <button 
                  type="button" 
                  onClick={addSyncSource}
                  disabled={!newSourceUrl.trim()}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Add Source
                </button>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
