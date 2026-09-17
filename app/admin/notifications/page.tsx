import { createClient } from "@/lib/supabase/server";
import { Bell, Users, Send, Radio } from "lucide-react";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminMetricCard from "@/components/admin/ui/AdminMetricCard";
import AdminNotificationsClient from "@/components/admin/AdminNotificationsClient";

export const dynamic = 'force-dynamic';

export default async function AdminNotifications() {
  const supabase = await createClient();
  
  // Count push subscribers
  const { count: subscriberCount } = await supabase
    .from('web_push_subscriptions')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-8 max-w-5xl">
      <AdminPageHeader
        title="Push Broadcasts"
        description="Send push notifications to all subscribed guest devices across the platform."
        badge="Communications"
      />

      {/* Subscriber Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AdminMetricCard
          label="Active Subscribers"
          value={subscriberCount || 0}
          subtext="Devices with web push enabled"
          icon={Users}
          highlightColor="gold"
        />
        <AdminMetricCard
          label="Broadcast Engine"
          value="Operational"
          subtext="Web Push API readiness"
          icon={Radio}
          highlightColor="emerald"
        />
      </div>

      {/* Live Compose Broadcast Component */}
      <AdminNotificationsClient initialSubscriberCount={subscriberCount || 0} />
    </div>
  );
}
