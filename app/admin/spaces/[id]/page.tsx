'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X, Star, Link as LinkIcon, Download, Calendar, Image as ImageIcon, Trash2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function EditSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
  const [syncSources, setSyncSources] = useState<any[]>([]);
  const [newSourcePlatform, setNewSourcePlatform] = useState('airbnb');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  useEffect(() => {
    fetchSpace();
  }, [id]);

  const fetchSpace = async () => {
    try {
      const supabase = createClient();
      
      // Fetch space details
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', id)
        .single();
        
      if (spaceError) throw spaceError;
      
      setFormData({
        title: space.title || '',
        slug: space.slug || '',
        description: space.description || '',
        area: space.area || '',
        city: space.city || '',
        state: space.state || 'Delhi',
        country: space.country || 'India',
        nightly_price: space.nightly_price || 15000,
        max_guests: space.max_guests || 2,
        bedrooms: space.bedrooms || 1,
        bathrooms: space.bathrooms || 1,
        featured_image: space.featured_image || '',
        active: space.active !== false,
        airbnb_listing_id: space.airbnb_listing_id || '',
        airbnb_ical_url: space.airbnb_ical_url || '',
        check_in_time: space.check_in_time || '3:00 PM',
        check_out_time: space.check_out_time || '11:00 AM',
        key_instructions: space.key_instructions || 'Keys are kept in the lockbox near the main door (code 1234).',
        pre_arrival_template: space.pre_arrival_template || 'Hello {{guest_name}}! Check-in starts at {{check_in_time}}. Key location: {{key_instructions}}.',
        post_checkout_feedback_template: space.post_checkout_feedback_template || 'Dear {{guest_name}}, thank you for staying at {{space_title}}! Please share your private feedback with us.',
        cleaner_name: space.cleaner_name || 'Housekeeping Team',
        cleaner_phone: space.cleaner_phone || '',
      });
      
      setImages(space.images || []);
      setAmenities(space.amenities && space.amenities.length > 0 ? space.amenities : ['']);
      setRules(space.rules ? space.rules.split('\n') : ['']);
      
      // Fetch calendar sync sources
      const { data: sources, error: sourcesError } = await supabase
        .from('calendar_sync_sources')
        .select('*')
        .eq('space_id', id);
        
      if (!sourcesError && sources) {
        setSyncSources(sources);
      }
      
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load space details');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('spaces')
        .update({
          ...formData,
          images,
          amenities: amenities.filter(a => a.trim() !== ''),
          rules: rules.filter(r => r.trim() !== '').join('\n'),
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      toast.success('Space updated successfully!');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update space');
      toast.error('Failed to update space');
    } finally {
      setSaving(false);
    }
  };
  
  const handleManualSync = async () => {
    setSyncing(true);
    toast.info('Starting manual sync...');
    
    try {
      const res = await fetch('/api/spaces/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ space_id: id })
      });
      
      const result = await res.json();
      
      if (!result.success) throw new Error(result.error);
      
      toast.success(`Sync complete! ${result.synced} calendars synced.`);
      fetchSpace(); // Refresh data to get new sync times
    } catch (err: any) {
      console.error(err);
      toast.error('Sync failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this space? This will also delete all associated bookings and calendar sources. This action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Space deleted');
      router.push('/admin/spaces');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete space');
      setDeleting(false);
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
  
  const addSyncSource = async () => {
    if (!newSourceUrl.trim()) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('calendar_sync_sources')
        .insert({
          space_id: id,
          platform: newSourcePlatform,
          inbound_ical_url: newSourceUrl,
          is_active: true,
          sync_status: 'pending'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setSyncSources([...syncSources, data]);
      setNewSourceUrl('');
      toast.success('Calendar source added');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to add calendar source');
    }
  };
  
  const removeSyncSource = async (sourceId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('calendar_sync_sources')
        .delete()
        .eq('id', sourceId);
        
      if (error) throw error;
      
      setSyncSources(syncSources.filter(s => s.id !== sourceId));
      toast.success('Calendar source removed');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to remove source');
    }
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

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/50">Loading space details...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl pb-24">
      <div className="flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-10 py-4 -my-4 mb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/spaces" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl mb-1 text-white">Edit Space</h1>
            <p className="text-white/50 text-sm tracking-wide">{formData.title || 'Loading...'}</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-accent-gold text-black px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

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
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <p className="text-sm text-white/50">No images</p>
            </div>
          )}
        </div>

        {/* Location & Specs */}
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

        {/* Autonomous Operations, Key Storage & Cleaner Contacts */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="font-serif text-xl text-white">Autonomous Operations & Key Storage</h2>
            <p className="text-xs text-white/50 mt-1">Configure listing timings, key location instructions, cleaner contacts, and guest feedback templates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Check-in Start Time</label>
              <input 
                type="text" 
                value={formData.check_in_time}
                onChange={(e) => setFormData({...formData, check_in_time: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                placeholder="e.g. 3:00 PM"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Check-out Time</label>
              <input 
                type="text" 
                value={formData.check_out_time}
                onChange={(e) => setFormData({...formData, check_out_time: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                placeholder="e.g. 11:00 AM"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40">Key Location & Access Instructions</label>
            <textarea 
              rows={3}
              value={formData.key_instructions}
              onChange={(e) => setFormData({...formData, key_instructions: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              placeholder="e.g., Keys are kept in the lockbox near the main entrance door. Lockbox code is 4829."
            />
            <p className="text-[10px] text-white/30">Auto-sent when guests ask about keys, access, or lockbox location in chat.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Assigned Housekeeper Name</label>
              <input 
                type="text" 
                value={formData.cleaner_name}
                onChange={(e) => setFormData({...formData, cleaner_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                placeholder="e.g., Ramesh Kumar"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Housekeeper WhatsApp Phone</label>
              <input 
                type="text" 
                value={formData.cleaner_phone}
                onChange={(e) => setFormData({...formData, cleaner_phone: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50 font-mono"
                placeholder="e.g., +919876543210"
              />
              <p className="text-[10px] text-white/30">Receives auto-dispatched turnover WhatsApp alerts upon check-out.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40">Pre-Arrival Message Template</label>
            <textarea 
              rows={3}
              value={formData.pre_arrival_template}
              onChange={(e) => setFormData({...formData, pre_arrival_template: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              placeholder="Hello {{guest_name}}! Check-in starts at {{check_in_time}}. Key location: {{key_instructions}}"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40">Post-Checkout Private Feedback Request Template</label>
            <textarea 
              rows={3}
              value={formData.post_checkout_feedback_template}
              onChange={(e) => setFormData({...formData, post_checkout_feedback_template: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
              placeholder="Dear {{guest_name}}, thank you for staying at {{space_title}}! Please share your private feedback with our team."
            />
          </div>
        </div>
        
        {/* Calendar Sync Setup */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-accent-gold" />
              <h2 className="font-serif text-xl text-white">Calendar Sync (Two-Way iCal)</h2>
            </div>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing || syncSources.length === 0}
              className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-white"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Outbound Feed */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Our iCal Feed (Export)</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly
                  value={`https://nothingness.asia/api/spaces/${formData.slug}/ical`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white/50 focus:outline-none"
                />
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://nothingness.asia/api/spaces/${formData.slug}/ical`);
                    toast.success('iCal URL copied');
                  }}
                  className="px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Inbound Feeds */}
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-white/40">Connected Platforms (Import)</p>
              
              {syncSources.map((source, i) => (
                <div key={source.id || i} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-lg">
                  <div className="bg-black/50 p-2 rounded-md">
                    <LinkIcon className="w-4 h-4 text-accent-gold" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-white capitalize">{source.platform}</p>
                      <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${
                        source.sync_status === 'synced' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                        source.sync_status === 'error' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                        'text-accent-gold border-accent-gold/20 bg-accent-gold/10'
                      }`}>
                        {source.sync_status}
                      </span>
                      {source.last_synced_at && (
                        <span className="text-[9px] text-white/30 ml-2">Last synced: {new Date(source.last_synced_at).toLocaleTimeString()}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/50 truncate">{source.inbound_ical_url}</p>
                    {source.sync_error && (
                      <p className="text-[10px] text-red-400 mt-1 truncate">Error: {source.sync_error}</p>
                    )}
                  </div>
                  <button type="button" onClick={() => removeSyncSource(source.id)} className="p-2 text-white/30 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {syncSources.length === 0 && (
                <div className="text-sm text-white/30 py-2">No external calendars connected.</div>
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
                  placeholder="https://... (.ics url)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
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
        
        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="font-serif text-xl text-red-400">Danger Zone</h2>
          <p className="text-sm text-white/50">Deleting this space will also delete all associated bookings, calendar sources, and external blocked dates. This action cannot be undone.</p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete Space'}
          </button>
        </div>

      </form>
    </div>
  );
}
