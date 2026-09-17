import { createClient } from "@/lib/supabase/server";
import { MessageSquare, Send, Mail, Phone, Globe, Bot, Plus, Zap, ToggleLeft, ToggleRight, Settings, Camera, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import ComingSoonButton from "@/components/ComingSoonButton";
import InboxClient from "./InboxClient";
import InstagramSettingsCard from "./InstagramSettingsCard";
import WhatsAppSettingsCard from "./WhatsAppSettingsCard";
import FacebookSettingsCard from "./FacebookSettingsCard";
import { env } from "@/lib/env";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";

export const dynamic = 'force-dynamic';

export default async function AdminInbox({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; channel?: string; connected?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams?.tab || 'messages';
  const currentChannel = resolvedSearchParams?.channel;
  const supabase = await createClient();

  const whatsappPhoneNumberId =
    env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.whatsapp_phone_number_id ||
    process.env.whatsappPhoneNumberId ||
    '';
  const whatsappWabaId =
    env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
    process.env.whatsapp_business_account_id ||
    process.env.whatsappBusinessAccountId ||
    '';
  const isWhatsAppConfigured = Boolean(whatsappPhoneNumberId);

  const instagramAppId =
    env.Instagram_app_ID ||
    env.INSTAGRAM_APP_ID ||
    process.env.Instagram_app_ID ||
    process.env.INSTAGRAM_APP_ID ||
    env.meta_App_ID ||
    env.META_APP_ID ||
    '';
  const instagramAppName =
    env.Instagram_app_name ||
    env.INSTAGRAM_APP_NAME ||
    process.env.Instagram_app_name ||
    process.env.INSTAGRAM_APP_NAME ||
    'nothingness';
  const isInstagramConfigured = Boolean(instagramAppId);

  const facebookConfigId =
    env.Facebook_login_Configuration_ID ||
    env.FACEBOOK_LOGIN_CONFIGURATION_ID ||
    env.facebook_login_configuration_id ||
    env.FACEBOOK_CONFIG_ID ||
    env.NEXT_PUBLIC_FACEBOOK_LOGIN_CONFIGURATION_ID ||
    env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID ||
    process.env.Facebook_login_Configuration_ID ||
    process.env.FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.facebook_login_configuration_id ||
    process.env.FACEBOOK_CONFIG_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID ||
    '';
  const isFacebookConfigured = Boolean(facebookConfigId);
  
  // Fetch conversations with their messages and guest profile for the live 2-way inbox
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      guest_profiles (id, full_name, phone, document_number, is_verified),
      bookings (id, check_in, check_out, spaces (title)),
      conversation_messages (*)
    `)
    .order('updated_at', { ascending: false });

  // Fetch chatflows
  const { data: chatflows } = await supabase
    .from('chatflows')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <AdminPageHeader
        title="Inbox & Automations"
        description="Manage conversations, AI flows, and omnichannel connections."
        badge="Omnichannel"
        actions={
          <div className="flex p-1 bg-white/[0.02] border border-white/10 rounded-xl">
            <Link 
              href="/admin/inbox?tab=messages" 
              className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${currentTab === 'messages' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
            >
              Messages
            </Link>
            <Link 
              href="/admin/inbox?tab=chatflows" 
              className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${currentTab === 'chatflows' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
            >
              Chatflows
            </Link>
            <Link 
              href="/admin/inbox?tab=settings" 
              className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${currentTab === 'settings' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
            >
              Settings
            </Link>
          </div>
        }
      />

      <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
        {/* ============================================================== */}
        {/* MESSAGES TAB: Real-Time Omnichannel 2-Way Inbox */}
        {/* ============================================================== */}
        {currentTab === 'messages' && (
          <div className="flex-1 overflow-hidden h-full">
            <InboxClient initialConversations={conversations || []} initialChannel={currentChannel} />
          </div>
        )}

        {/* ============================================================== */}
        {/* CHATFLOWS TAB */}
        {/* ============================================================== */}
        {currentTab === 'chatflows' && (
          <div className="p-6 md:p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl text-white font-serif">Automated Flows</h2>
              <Link 
                href="/admin/inbox/flows/new" 
                className="flex items-center gap-2 bg-accent-gold text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Create Flow
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chatflows?.map((flow) => (
                <div key={flow.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col group relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50">
                      <Bot className="w-5 h-5" />
                    </div>
                    <Link href={`/admin/inbox/flows/${flow.id}`} className="text-white/30 hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  <h3 className="text-lg text-white font-medium mb-1">{flow.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/50 mb-6">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    Trigger: {flow.trigger_event}
                  </div>
                  
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 mb-6 flex-1">
                    <p className="text-xs text-white/60 line-clamp-3">"{flow.response_template}"</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-white/40 uppercase tracking-wider">
                      <MessageSquare className="w-3 h-3" />
                      {flow.channel}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${flow.is_active ? 'text-green-400' : 'text-white/30'}`}>
                        {flow.is_active ? 'Active' : 'Paused'}
                      </span>
                      {flow.is_active ? (
                        <ToggleRight className="w-5 h-5 text-green-400 cursor-pointer" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-white/30 cursor-pointer" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Link href="/admin/inbox/flows/new" className="bg-white/[0.01] border border-white/5 border-dashed p-6 rounded-2xl flex flex-col items-center justify-center min-h-[250px] cursor-pointer hover:bg-white/[0.03] transition-colors group">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-accent-gold group-hover:bg-accent-gold/10 transition-colors mb-4">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="text-white font-medium text-sm">Create New Chatflow</p>
                <p className="text-white/40 text-xs mt-1 text-center max-w-[200px]">Automate responses for bookings, check-ins, or common questions.</p>
              </Link>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SETTINGS TAB */}
        {/* ============================================================== */}
        {currentTab === 'settings' && (
          <div className="p-6 md:p-8 h-full overflow-y-auto space-y-8">
            <div>
              <h2 className="text-xl text-white font-serif mb-2">Omnichannel Connections</h2>
              <p className="text-sm text-white/50">Connect your social and messaging accounts to route all customer inquiries into this inbox.</p>
            </div>

            <div className="space-y-4 max-w-3xl">
              {/* WhatsApp Connection (Realtime Meta WhatsApp Cloud API) */}
              <WhatsAppSettingsCard
                isConfigured={isWhatsAppConfigured}
                phoneNumberId={whatsappPhoneNumberId}
                wabaId={whatsappWabaId}
              />

              {/* Instagram Connection (Realtime Meta Graph API) */}
              <InstagramSettingsCard
                isConfigured={isInstagramConfigured}
                appId={instagramAppId}
                appName={instagramAppName}
              />

              {/* Facebook Login for Business Connection (Meta Graph API) */}
              <FacebookSettingsCard
                isConfigured={isFacebookConfigured}
                configId={facebookConfigId}
                appId={instagramAppId}
                initialConnected={resolvedSearchParams?.connected === 'facebook'}
                initialError={resolvedSearchParams?.error}
              />

              {/* Email Connection */}
              <div className="p-5 border border-white/5 bg-white/[0.01] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-500/10 rounded-xl flex items-center justify-center text-zinc-400">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Email Inbound</h3>
                    <p className="text-xs text-white/50 mt-1">Receive and reply to support emails.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg border border-white/10 transition-colors">
                  Configure
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
