'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  ArrowLeft, Mail, Phone, MapPin, ShieldCheck, 
  FileText, Printer, Download, Edit3, Trash2, X, 
  Check, User, Calendar, ExternalLink, Camera, Upload, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface GuestProfile {
  id: string;
  full_name: string;
  phone_number?: string;
  phone?: string;
  email?: string;
  id_document_type?: string;
  document_number?: string;
  is_verified?: boolean;
  created_at: string;
  permanent_address?: string;
  is_foreign_national?: boolean;
  visa_number?: string;
  nationality?: string;
  dob?: string;
  police_register_status?: string;
  verification_timestamp?: string;
  verification_expires_at?: string;
  id_front_url?: string;
  id_back_url?: string;
  id_document_url?: string;
  photo_url?: string;
  face_id_vetted?: boolean;
  live_face_url?: string;
  face_id_vetted_at?: string;
  booking_guests?: any[];
}

export default function AdminGuestProfileClient({ initialGuest }: { initialGuest: GuestProfile }) {
  const router = useRouter();
  const [guest, setGuest] = useState<GuestProfile>(initialGuest);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    full_name: guest.full_name || '',
    document_number: guest.document_number || '',
    id_document_type: guest.id_document_type || 'Aadhaar',
    dob: guest.dob || '',
    phone: guest.phone || guest.phone_number || '',
    permanent_address: guest.permanent_address || '',
    photo_url: guest.photo_url || '',
    live_face_url: guest.live_face_url || '',
    face_id_vetted: Boolean(guest.face_id_vetted),
    id_front_url: guest.id_front_url || guest.id_document_url || '',
    id_back_url: guest.id_back_url || '',
  });

  const stays = guest.booking_guests || [];
  const totalSpent = stays.reduce((sum: number, stay: any) => sum + (stay.bookings?.total_price || 0), 0);

  const frontDocUrl = guest.id_front_url || guest.id_document_url;
  const backDocUrl = guest.id_back_url;

  // Print ID Card Copy & Police Dossier
  const handlePrintIdDossier = () => {
    window.print();
  };

  // Save Edit Updates
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/guests/${guest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Guest details successfully updated!');
        setGuest(data.guest);
        setIsEditModalOpen(false);
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to update guest details');
      }
    } catch {
      toast.error('Network error saving updates');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Back & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/guests" 
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-white border border-zinc-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl md:text-4xl text-white font-bold">{guest.full_name}</h1>
              {guest.is_verified && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 180-Day Verified
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-xs font-mono mt-0.5 select-all">Guest ID: {guest.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrintIdDossier}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4 text-accent-gold" />
            <span>Print ID Copy &amp; Dossier</span>
          </button>

          <button
            onClick={() => {
              setEditFormData({
                full_name: guest.full_name || '',
                document_number: guest.document_number || '',
                id_document_type: guest.id_document_type || 'Aadhaar',
                dob: guest.dob || '',
                phone: guest.phone || guest.phone_number || '',
                permanent_address: guest.permanent_address || '',
                photo_url: guest.photo_url || '',
                live_face_url: guest.live_face_url || '',
                face_id_vetted: Boolean(guest.face_id_vetted),
                id_front_url: guest.id_front_url || guest.id_document_url || '',
                id_back_url: guest.id_back_url || '',
              });
              setIsEditModalOpen(true);
            }}
            className="px-4 py-2.5 bg-accent-gold hover:bg-white text-black text-xs font-mono font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Details</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Photo & Official ID Documents */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Physical Biometric Verification Card: 3D Face ID vs Official ID */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
                Physical Identity &amp; Biometrics
              </span>
              {guest.face_id_vetted ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  ✓ 3D Face ID Vetted
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                  ⚠ Old ID Only (No Face ID)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Real-Life 3D Face ID */}
              <div className="space-y-1.5 text-center">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-zinc-900 shadow-md flex items-center justify-center relative">
                  {guest.live_face_url ? (
                    <img src={guest.live_face_url} alt="Live 3D Face ID" className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-3 text-[10px] font-mono text-zinc-500">Not scanned yet</div>
                  )}
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                  Live 3D Face ID
                </span>
                <span className="text-[9px] font-mono text-zinc-500 block">Real-life match</span>
              </div>

              {/* Official Aadhaar / Passport Photo */}
              <div className="space-y-1.5 text-center">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-md flex items-center justify-center relative">
                  {guest.photo_url ? (
                    <img src={guest.photo_url} alt={guest.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-zinc-600" />
                  )}
                </div>
                <span className="text-[10px] font-mono text-zinc-300 font-bold block">
                  Official ID Photo
                </span>
                <span className="text-[9px] font-mono text-zinc-500 block">Aadhaar record</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-900 space-y-1">
              <p className="text-xs font-bold text-white font-mono">{guest.full_name}</p>
              <p className="text-[11px] font-mono text-accent-gold tracking-wider">
                {guest.id_document_type || 'Aadhaar'}: {guest.document_number || 'Pending'}
              </p>
            </div>
          </div>

          {/* Actual Uploaded ID Copies (Front & Back) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Official Uploaded ID Cards
              </span>
              <span className="text-[10px] font-mono text-emerald-400">On Record</span>
            </div>

            {/* Front Side */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-300 font-medium">Front Document Photo</p>
              {frontDocUrl ? (
                <div className="space-y-2">
                  <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video relative group">
                    <img src={frontDocUrl} alt="ID Front" className="w-full h-full object-contain" />
                    <a 
                      href={frontDocUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-mono"
                    >
                      <ExternalLink className="w-4 h-4" /> View Full Image
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={frontDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Full View
                    </a>
                    <a
                      href={frontDocUrl}
                      download={`ID_${guest.full_name}_front.jpg`}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-6 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs font-mono">
                  No front ID document scan uploaded yet. Click "Edit Details" to attach.
                </div>
              )}
            </div>

            {/* Back Side */}
            {backDocUrl && (
              <div className="space-y-2 pt-2 border-t border-zinc-900">
                <p className="text-xs text-zinc-300 font-medium">Back Document Photo</p>
                <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video relative group">
                  <img src={backDocUrl} alt="ID Back" className="w-full h-full object-contain" />
                  <a 
                    href={backDocUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-mono"
                  >
                    <ExternalLink className="w-4 h-4" /> View Full Image
                  </a>
                </div>
                <div className="flex gap-2">
                  <a
                    href={backDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Full View
                  </a>
                  <a
                    href={backDocUrl}
                    download={`ID_${guest.full_name}_back.jpg`}
                    className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Contact Details Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
              Contact &amp; Residence
            </span>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center gap-3 text-zinc-300">
                <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="select-all">{guest.phone || guest.phone_number || 'No phone on file'}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="select-all">{guest.email || 'No email on file'}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>{guest.permanent_address || 'Address recorded on ID'}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400 text-[11px] pt-2 border-t border-zinc-900">
                <Calendar className="w-4 h-4 text-zinc-600 shrink-0" />
                <span>Registered: {format(new Date(guest.created_at), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: KPIs & Stays History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-center shadow-lg">
              <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">Total Stays</p>
              <p className="text-3xl font-serif text-white font-bold">{stays.length}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-center shadow-lg">
              <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">Total Tariff Value</p>
              <p className="text-3xl font-serif text-accent-gold font-bold">₹{totalSpent.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Stays History */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
            <h2 className="text-xs font-mono font-bold text-white p-6 border-b border-zinc-800 uppercase tracking-widest">
              Sanctuary Stay History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/50 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Space</th>
                    <th className="px-6 py-4 font-medium">Check In</th>
                    <th className="px-6 py-4 font-medium">Check Out</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {stays.map((stay: any, idx: number) => {
                    const booking = stay.bookings;
                    if (!booking) return null;
                    return (
                      <tr key={idx} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white font-bold text-xs">{booking.spaces?.title || 'Sanctuary'}</p>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {format(new Date(booking.check_in), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                            booking.status === 'confirmed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                            booking.status === 'checked_in' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
                            'text-zinc-400 bg-zinc-900 border-zinc-700'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {stays.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-xs font-mono">
                        No sanctuary stay history recorded for this guest profile yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EDIT GUEST DETAILS MODAL                                                  */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-serif text-xl text-white font-bold">Edit Guest Identity Profile</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Update legal name, 12-digit Aadhaar number, contact, or photo URL.
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Document Type</label>
                  <select
                    value={editFormData.id_document_type}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, id_document_type: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Aadhaar">Aadhaar</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Document Number</label>
                  <input
                    type="text"
                    required
                    placeholder="XXXX XXXX XXXX"
                    value={editFormData.document_number}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, document_number: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Date of Birth / Year</label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={editFormData.dob}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editFormData.permanent_address}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, permanent_address: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Extracted Photo URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editFormData.photo_url}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, photo_url: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Front ID Document URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editFormData.id_front_url}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, id_front_url: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Back ID Document URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editFormData.id_back_url}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, id_back_url: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Live 3D Face ID URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editFormData.live_face_url}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, live_face_url: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="face_id_vetted"
                  checked={editFormData.face_id_vetted}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, face_id_vetted: e.target.checked }))}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="face_id_vetted" className="text-zinc-300 text-xs cursor-pointer">
                  Mark as 3D Face ID Vetted (Gatekeeper Physical Match Approved)
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-accent-gold hover:bg-white text-black font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT STYLED DOSSIER (Visible only during window.print())                 */}
      {/* ========================================================================= */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-9999 font-serif">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-wider">NOTHINGNESS SANCTUARY</h1>
            <p className="text-xs uppercase tracking-widest font-mono text-zinc-600">Police Compliance &amp; Guest Arrival Dossier</p>
          </div>
          <div className="text-right font-mono text-xs">
            <p>Verification Date: {guest.verification_timestamp ? format(new Date(guest.verification_timestamp), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}</p>
            <p>Status: 180-Day Police Compliant</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="col-span-1 flex gap-2">
            <div className="text-center">
              <p className="text-[9px] font-mono mb-0.5">OFFICIAL ID</p>
              {guest.photo_url ? (
                <img src={guest.photo_url} alt={guest.full_name} className="w-24 h-32 object-cover border border-black p-0.5" />
              ) : (
                <div className="w-24 h-32 border border-black flex items-center justify-center font-mono text-[9px]">ID Photo</div>
              )}
            </div>
            {guest.live_face_url && (
              <div className="text-center">
                <p className="text-[9px] font-mono mb-0.5 text-emerald-800 font-bold">3D FACE ID</p>
                <img src={guest.live_face_url} alt="Live Face ID" className="w-24 h-32 object-cover border-2 border-emerald-700 p-0.5" />
              </div>
            )}
          </div>
          <div className="col-span-2 space-y-2 font-mono text-xs">
            <p><strong>Guest Full Name:</strong> {guest.full_name}</p>
            <p><strong>Document Type:</strong> {guest.id_document_type || 'Aadhaar'}</p>
            <p><strong>Document Number:</strong> {guest.document_number}</p>
            <p><strong>Date of Birth / Year:</strong> {guest.dob || 'Recorded'}</p>
            <p><strong>Mobile Number:</strong> {guest.phone || guest.phone_number || 'Recorded'}</p>
            <p><strong>Permanent Address:</strong> {guest.permanent_address || 'Recorded on official ID'}</p>
            <p><strong>Nationality:</strong> {guest.nationality || 'Indian'}</p>
          </div>
        </div>

        <div className="border-t border-black pt-4 mb-6">
          <h2 className="font-bold text-sm mb-3 font-mono uppercase">Official ID Document Copies</h2>
          <div className="grid grid-cols-2 gap-4">
            {frontDocUrl && (
              <div className="border border-zinc-400 p-2 text-center">
                <p className="text-[10px] font-mono mb-1">FRONT ID COPY</p>
                <img src={frontDocUrl} alt="Front ID" className="max-h-48 mx-auto object-contain" />
              </div>
            )}
            {backDocUrl && (
              <div className="border border-zinc-400 p-2 text-center">
                <p className="text-[10px] font-mono mb-1">BACK ID COPY</p>
                <img src={backDocUrl} alt="Back ID" className="max-h-48 mx-auto object-contain" />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-black pt-4 mt-8 flex justify-between font-mono text-xs">
          <div>
            <p>Guest Signature: _______________________</p>
          </div>
          <div>
            <p>Duty Concierge Signature: _______________________</p>
          </div>
        </div>
      </div>

    </div>
  );
}
