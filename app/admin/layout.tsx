import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUserAdminAsync } from "@/lib/auth-utils";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?redirect=/admin');
  }

  const isAdmin = await isUserAdminAsync(user);
  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <AdminShell userEmail={user.email}>
      {children}
    </AdminShell>
  );
}
