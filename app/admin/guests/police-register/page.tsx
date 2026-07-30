import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, Download, UserCheck, ArrowLeft, FileText, Globe } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function DelhiPoliceRegisterPage() {
  const supabase = await createClient();

  const { data: guests } = await supabase
    .from('guest_profiles')
    .select(`
      *,
      booking_guests (
        bookings (id, check_in, check_out, spaces(title))
      )
    `)
    .order('verification_timestamp', { ascending: false });

  const totalVerified = guests?.filter(g => g.is_verified)?.length || 0;
  const foreignNationals = guests?.filter(g => g.is_foreign_national)?.length || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/guests" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl mb-1 text-white">Delhi Police Digital Guest Register</h1>
            <p className="text-white/50 text-sm tracking-wide">
              Official guest check-in records formatted for Delhi Police &amp; Form C compliance requirements.
            </p>
          </div>
        </div>

        <a
          href="/api/admin/police-register/export"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-accent-gold text-black px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-accent-gold/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Police Report (CSV)
        </a>
      </div>

      {/* Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Compliant Records</p>
          <p className="text-2xl font-serif text-white flex items-center justify-between">
            {totalVerified}
            <ShieldCheck className="w-5 h-5 text-green-400" />
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Foreign Nationals (Form C)</p>
          <p className="text-2xl font-serif text-accent-gold flex items-center justify-between">
            {foreignNationals}
            <Globe className="w-5 h-5 text-accent-gold/60" />
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Compliance Standard</p>
          <p className="text-sm font-medium text-green-400 mt-2 flex items-center gap-2">
            ✓ Delhi Hotel &amp; BnB Check-in Law (18+ Verified)
          </p>
        </div>
      </div>

      {/* Register Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xs font-semibold text-white uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent-gold" />
            Digital Police Guest Log
          </h2>
          <span className="text-[10px] text-white/40 font-mono">Live Sync</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.01] border-b border-white/5 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-6 py-4 font-medium">Guest Name &amp; DOB</th>
                <th className="px-6 py-4 font-medium">ID Document</th>
                <th className="px-6 py-4 font-medium">Permanent Residential Address</th>
                <th className="px-6 py-4 font-medium">Nationality / Form C</th>
                <th className="px-6 py-4 font-medium">Verification Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {guests?.map((guest) => (
                <tr key={guest.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{guest.full_name}</p>
                    {guest.dob && <p className="text-white/40 text-[10px] mt-0.5">DOB: {guest.dob}</p>}
                  </td>

                  <td className="px-6 py-4 font-mono">
                    <p className="text-white/90">{guest.id_document_type}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">{guest.document_number}</p>
                  </td>

                  <td className="px-6 py-4 max-w-xs truncate text-white/70">
                    {guest.permanent_address || 'Address recorded on ID'}
                  </td>

                  <td className="px-6 py-4">
                    {guest.is_foreign_national ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-gold/10 text-accent-gold border border-accent-gold/20 text-[10px] uppercase tracking-wider">
                        <Globe className="w-3 h-3" /> Form C Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] uppercase tracking-wider">
                        <UserCheck className="w-3 h-3" /> Indian Resident
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-white/40 font-mono text-[10px]">
                    {guest.verification_timestamp 
                      ? format(new Date(guest.verification_timestamp), 'MMM dd, yyyy HH:mm')
                      : format(new Date(guest.created_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}

              {(!guests || guests.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/30">
                    No verified guest check-in records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
