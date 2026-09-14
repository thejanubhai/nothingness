import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import InvoiceActionBar from './InvoiceActionBar';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  FileText, 
  AlertCircle 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tax Invoice & Official Stay Voucher | Nothingness',
  description: 'Statutory GST Tax Invoice and Official Reservation Voucher for Nothingness sanctuaries.',
  robots: {
    index: false,
    follow: false,
  },
};

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingInvoicePage({ params }: InvoicePageProps) {
  const { id: bookingId } = await params;

  if (!bookingId || !/^[0-9a-fA-F-]{36}$/.test(bookingId)) {
    notFound();
  }

  const supabase = createAdminClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      created_at,
      status,
      payment_status,
      payment_method,
      payment_order_id,
      total_price,
      check_in,
      check_out,
      guest_name,
      guest_email,
      guest_phone,
      guests,
      spaces (
        id,
        title,
        city,
        state,
        area,
        check_in_time,
        check_out_time
      ),
      booking_guests (
        id,
        guest_index,
        name,
        phone,
        email,
        is_primary,
        verification_status
      )
    `)
    .eq('id', bookingId)
    .maybeSingle();

  if (error || !booking) {
    return (
      <main className="min-h-screen pt-36 pb-24 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-white mb-2">Reservation Record Not Found</h1>
        <p className="text-zinc-400 text-sm max-w-md mb-8">
          We could not locate an active booking record with ID <code className="text-accent-gold font-mono">{bookingId}</code>.
        </p>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-accent-gold text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider hover:bg-white transition-colors"
        >
          Return to Member Dashboard
        </Link>
      </main>
    );
  }

  const space: any = Array.isArray(booking.spaces) ? booking.spaces[0] : booking.spaces;
  const guestsList = booking.booking_guests || [];
  const primaryGuestRecord = guestsList.find((g: any) => g.is_primary);

  const primaryGuestName = booking.guest_name || primaryGuestRecord?.name || 'Sanctuary Guest';
  const primaryGuestEmail = booking.guest_email || primaryGuestRecord?.email || 'Registered Guest';
  const primaryGuestPhone = booking.guest_phone || primaryGuestRecord?.phone || 'On Record';

  const isPaid = booking.payment_status === 'paid' || booking.status === 'confirmed';
  const totalAmount = Number(booking.total_price) || 0;

  // Indian Hospitality GST Breakdown (SAC 996311, 18% inclusive)
  const basePrice = Math.round(totalAmount / 1.18);
  const totalGst = totalAmount - basePrice;
  const cgst = Math.round(totalGst / 2);
  const sgst = totalGst - cgst;

  // Calculate nights
  const checkInDateObj = new Date(booking.check_in);
  const checkOutDateObj = new Date(booking.check_out);
  const diffTime = Math.abs(checkOutDateObj.getTime() - checkInDateObj.getTime());
  const nightsCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const invoiceYear = new Date(booking.created_at || Date.now()).getFullYear();
  const invoiceNumber = `INV-NOTH-${invoiceYear}-${booking.id.slice(0, 8).toUpperCase()}`;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-24 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto text-zinc-300">
      {/* Interactive Action Bar (hidden during browser printing) */}
      <InvoiceActionBar bookingId={booking.id} isPaid={isPaid} />

      {/* Printable Invoice Container */}
      <article className="invoice-container bg-[#0d0d10] border border-white/10 rounded-3xl p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        
        {/* Watermark / Header Seal */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-white/10 print:border-zinc-300">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-serif text-2xl sm:text-3xl text-white tracking-wider uppercase font-bold print:text-black">
                Nothingness
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-accent-gold/20 text-accent-gold border border-accent-gold/30 print:border-zinc-400 print:text-black print:bg-zinc-100">
                Official
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono print:text-zinc-600">
              Tax Invoice &amp; Official Stay Voucher
            </p>
            <p className="text-[11px] text-zinc-500 font-mono mt-1 print:text-zinc-600">
              Generated in accordance with Section 31 of CGST Act, 2017
            </p>
          </div>

          <div className="sm:text-right space-y-1 font-mono text-xs text-zinc-400 print:text-zinc-700">
            <div className="text-sm font-bold text-white print:text-black">
              Invoice #{invoiceNumber}
            </div>
            <div>
              <span className="text-zinc-500 print:text-zinc-500">Date of Issue: </span>
              <span className="text-zinc-300 print:text-black">{formatDate(booking.created_at)}</span>
            </div>
            <div>
              <span className="text-zinc-500 print:text-zinc-500">SAC Code: </span>
              <span className="text-accent-gold font-bold print:text-black">996311 (Accommodation)</span>
            </div>
            <div>
              <span className="text-zinc-500 print:text-zinc-500">Payment Status: </span>
              <span className={`font-bold ${isPaid ? 'text-emerald-400 print:text-emerald-700' : 'text-amber-400 print:text-amber-700'}`}>
                {isPaid ? 'PAID & CONFIRMED' : 'PAYMENT PENDING'}
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Entity & Guest Manifest */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-white/10 print:border-zinc-300 text-xs">
          {/* Supplier Details */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-mono text-accent-gold font-semibold print:text-zinc-800">
              Supplier &amp; Operating Merchant
            </p>
            <p className="text-sm font-bold text-white print:text-black">
              SHEIKH ARSALAN ULLAH CHISHTI
            </p>
            <p className="text-zinc-400 print:text-zinc-600 leading-relaxed">
              Trading As: <strong className="text-zinc-200 print:text-black">Nothingness</strong> (Hotels and Events)<br />
              B-80, Ground Floor, Street 8, Ghaffar Manzil<br />
              Jamia Nagar, Okhla, New Delhi - 110025, Delhi, India
            </p>
            <p className="text-zinc-400 print:text-zinc-600 font-mono text-[11px] pt-1">
              Official Email: concierge@nothingness.asia<br />
              Concierge Desk: +91 85279 76791<br />
              Portal: https://nothingness.asia
            </p>
          </div>

          {/* Billed To / Guest Details */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest font-mono text-accent-gold font-semibold print:text-zinc-800">
              Billed To (Primary Booker)
            </p>
            <p className="text-sm font-bold text-white print:text-black">
              {primaryGuestName}
            </p>
            <p className="text-zinc-400 print:text-zinc-600 leading-relaxed">
              Email: <span className="text-zinc-200 print:text-black">{primaryGuestEmail}</span><br />
              Phone: <span className="text-zinc-200 print:text-black">{primaryGuestPhone}</span><br />
              Total Registered Guests: <span className="text-zinc-200 print:text-black">{booking.guests || guestsList.length || 1}</span>
            </p>
            <div className="pt-2">
              <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-1 rounded bg-white/5 border border-white/10 text-zinc-300 print:bg-zinc-100 print:text-black print:border-zinc-300">
                Booking Reference: {booking.id}
              </span>
            </div>
          </div>
        </div>

        {/* Sanctuary Stay & Schedule Details */}
        <div className="py-6 border-b border-white/10 print:border-zinc-300">
          <p className="text-[11px] uppercase tracking-widest font-mono text-accent-gold font-semibold mb-4 print:text-zinc-800">
            Sanctuary &amp; Stay Itinerary
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 print:bg-zinc-50 print:border-zinc-200">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block mb-1">Sanctuary</span>
              <span className="text-sm font-bold text-white print:text-black block">
                {space?.title || 'Sanctuary Suite'}
              </span>
              <span className="text-xs text-zinc-400 print:text-zinc-600">
                {space?.city || 'New Delhi'}, {space?.state || 'India'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block mb-1">Check-in</span>
              <span className="text-sm font-bold text-white print:text-black block">
                {formatDate(booking.check_in)}
              </span>
              <span className="text-xs text-zinc-400 print:text-zinc-600">
                {space?.check_in_time || '3:00 PM onwards'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block mb-1">Check-out</span>
              <span className="text-sm font-bold text-white print:text-black block">
                {formatDate(booking.check_out)}
              </span>
              <span className="text-xs text-zinc-400 print:text-zinc-600">
                {space?.check_out_time || 'Strictly 11:00 AM'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block mb-1">Duration</span>
              <span className="text-sm font-bold text-white print:text-black block">
                {nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'}
              </span>
              <span className="text-xs text-zinc-400 print:text-zinc-600">
                All Inclusive Stay
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Financial Ledger */}
        <div className="py-6 border-b border-white/10 print:border-zinc-300">
          <p className="text-[11px] uppercase tracking-widest font-mono text-accent-gold font-semibold mb-4 print:text-zinc-800">
            Itemized Tariffs &amp; Statutory GST
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 print:border-zinc-300 print:text-zinc-700">
                  <th className="pb-3 font-semibold">Service Description</th>
                  <th className="pb-3 font-semibold text-center">SAC</th>
                  <th className="pb-3 font-semibold text-center">Qty</th>
                  <th className="pb-3 font-semibold text-right">Taxable Value</th>
                  <th className="pb-3 font-semibold text-right">CGST (9%)</th>
                  <th className="pb-3 font-semibold text-right">SGST (9%)</th>
                  <th className="pb-3 font-semibold text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-zinc-200">
                <tr>
                  <td className="py-4">
                    <div className="font-sans font-medium text-white print:text-black">
                      Private Sanctuary Accommodation: {space?.title || 'Sanctuary Suite'}
                    </div>
                    <div className="text-[11px] text-zinc-400 print:text-zinc-500 font-sans mt-0.5">
                      Check-in {formatDate(booking.check_in)} to {formatDate(booking.check_out)} ({nightsCount} nights)
                    </div>
                  </td>
                  <td className="py-4 text-center text-zinc-300 print:text-black">996311</td>
                  <td className="py-4 text-center text-zinc-300 print:text-black">{nightsCount} N</td>
                  <td className="py-4 text-right text-zinc-300 print:text-black">₹{basePrice.toLocaleString('en-IN')}</td>
                  <td className="py-4 text-right text-zinc-300 print:text-black">₹{cgst.toLocaleString('en-IN')}</td>
                  <td className="py-4 text-right text-zinc-300 print:text-black">₹{sgst.toLocaleString('en-IN')}</td>
                  <td className="py-4 text-right font-bold text-white print:text-black">₹{totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="mt-4 pt-4 border-t border-white/10 print:border-zinc-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono">
            <div className="text-zinc-400 print:text-zinc-600 text-[11px] space-y-1">
              <p>• GST Rate: 18% Total (9% CGST + 9% SGST) applied under Accommodation Services.</p>
              <p>• Place of Supply: {space?.city || 'Delhi'}, State Code: 07 (India).</p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-right">
              <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                <span>Taxable Amount:</span>
                <span className="text-zinc-200 print:text-black">₹{basePrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                <span>CGST (9.0%):</span>
                <span className="text-zinc-200 print:text-black">₹{cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                <span>SGST (9.0%):</span>
                <span className="text-zinc-200 print:text-black">₹{sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-accent-gold border-t border-white/10 pt-2 print:border-zinc-300 print:text-black">
                <span>Total Amount Paid:</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateway & Settlement Manifest */}
        <div className="py-6 border-b border-white/10 print:border-zinc-300 text-xs">
          <p className="text-[11px] uppercase tracking-widest font-mono text-accent-gold font-semibold mb-3 print:text-zinc-800">
            Payment &amp; Transaction Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-[11px] print:bg-zinc-50 print:border-zinc-200">
            <div>
              <span className="text-zinc-500 block mb-0.5">Payment Method:</span>
              <span className="text-zinc-200 print:text-black font-medium">
                PayU India (UPI / Cards / Net Banking)
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-0.5">Statement Descriptor:</span>
              <span className="text-accent-gold print:text-black font-bold">
                PAYU*NOTHINGNESS
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-0.5">Transaction / Order Reference:</span>
              <span className="text-zinc-200 print:text-black truncate block">
                {booking.payment_order_id || booking.id.slice(0, 16)}
              </span>
            </div>
          </div>
        </div>

        {/* Verified Guests Compliance Manifest */}
        {guestsList.length > 0 && (
          <div className="py-6 border-b border-white/10 print:border-zinc-300 text-xs">
            <p className="text-[11px] uppercase tracking-widest font-mono text-accent-gold font-semibold mb-3 print:text-zinc-800">
              Statutory Guest Verification Ledger
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 print:border-zinc-300 print:text-zinc-700">
                    <th className="pb-2 font-semibold">Guest #</th>
                    <th className="pb-2 font-semibold">Registered Full Name</th>
                    <th className="pb-2 font-semibold">Role</th>
                    <th className="pb-2 font-semibold text-right">ID Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-zinc-200">
                  {guestsList.map((g: any, idx: number) => {
                    const isVerified = g.verification_status === 'verified';
                    return (
                      <tr key={g.id || idx}>
                        <td className="py-2.5 text-zinc-400 print:text-zinc-600">Guest {idx + 1}</td>
                        <td className="py-2.5 font-medium text-zinc-200 print:text-black">
                          {g.name || 'Pending Submission'}
                        </td>
                        <td className="py-2.5 text-zinc-400 print:text-zinc-600">
                          {g.is_primary ? 'Primary Booker' : 'Co-Guest'}
                        </td>
                        <td className="py-2.5 text-right font-semibold">
                          <span className={isVerified ? 'text-emerald-400 print:text-emerald-700' : 'text-amber-400 print:text-amber-700'}>
                            {isVerified ? '✓ Verified Compliant' : 'Awaiting Document'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compliance Footer & Legal Notes */}
        <div className="pt-6 space-y-3 text-[10px] text-zinc-500 font-mono leading-relaxed print:text-zinc-600">
          <p>
            <strong className="text-zinc-400 print:text-black">Statutory Declaration:</strong> This is a computer-generated Tax Invoice and Official Stay Voucher issued under Rule 46 of the CGST Rules, 2017. As an authentic digital invoice, no physical ink signature is required.
          </p>
          <p>
            <strong className="text-zinc-400 print:text-black">Discretion &amp; Security Protocol:</strong> For the privacy and security of all patrons, sanctuary premises operate under autonomous keyless access. Digital entry credentials and exact directional access notes remain accessible exclusively through the verified guest portal.
          </p>
          <p>
            <strong className="text-zinc-400 print:text-black">Merchant Contact:</strong> SHEIKH ARSALAN ULLAH CHISHTI, B-80 Ground Floor, Ghaffar Manzil, Jamia Nagar, Okhla, New Delhi - 110025, India. Inquiries: concierge@nothingness.asia.
          </p>
        </div>
      </article>

      {/* Return to Portal Link */}
      <div className="print:hidden text-center mt-8">
        <Link
          href={`/booking/${booking.id}/verify`}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent-gold hover:text-white transition-colors"
        >
          <span>Return to Identity Verification &amp; Passcode Portal →</span>
        </Link>
      </div>

      {/* Embedded Print CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
          }
          header, nav, footer, .print\\:hidden {
            display: none !important;
          }
          .invoice-container {
            border: 1px solid #d4d4d8 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}} />
    </main>
  );
}
