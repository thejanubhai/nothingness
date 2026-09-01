import { createAdminClient } from "@/lib/supabase/admin";
import AdminPartnersClient from "@/components/admin/AdminPartnersClient";

export const dynamic = 'force-dynamic';

export default async function AdminPartnersPage() {
  const adminSupabase = createAdminClient();

  // 1. Fetch Inbound Franchise Leads
  const { data: leads } = await adminSupabase
    .from('franchise_leads')
    .select('*')
    .order('created_at', { ascending: false });

  // 2. Fetch Partner Profiles with their properties
  const { data: partners } = await adminSupabase
    .from('partner_profiles')
    .select(`
      *,
      partner_properties (*)
    `)
    .order('created_at', { ascending: false });

  // 3. Fetch All Partner Properties
  const { data: properties } = await adminSupabase
    .from('partner_properties')
    .select(`
      *,
      partner_profiles (id, full_name, email, phone, status, payout_frequency, bank_name, bank_account_number, upi_id)
    `)
    .order('created_at', { ascending: false });

  // 4. Calculate Stats
  const leadsList = leads || [];
  const partnersList = partners || [];
  const propertiesList = properties || [];

  const totalLeads = leadsList.length;
  const newLeads = leadsList.filter(l => l.status === 'new').length;
  const activePartners = partnersList.filter(p => p.status === 'active' || p.verified_by_admin).length;
  const pendingVerification = partnersList.filter(p => p.status === 'under_review' || (p.affidavit_uploaded && !p.verified_by_admin)).length;
  const paidSetupCount = partnersList.filter(p => p.setup_fee_paid).length;
  const totalSetupRevenue = paidSetupCount * 300000;

  const stats = {
    totalLeads,
    newLeads,
    activePartners,
    pendingVerification,
    paidSetupCount,
    totalSetupRevenue,
  };

  return (
    <AdminPartnersClient
      initialLeads={leadsList as any}
      initialPartners={partnersList as any}
      initialProperties={propertiesList as any}
      initialStats={stats}
    />
  );
}
