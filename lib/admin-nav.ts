import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Sparkles,
  Scan,
  Ticket,
  Users,
  ShieldCheck,
  Flag,
  Building2,
  MessageSquare,
  Smartphone,
  FileText,
  Bell,
  PenTool,
  BookOpen,
  CreditCard,
  ScrollText,
  Settings,
  Plus,
  type LucideIcon,
} from "lucide-react";

export interface AdminSubItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  desc?: string;
  exact?: boolean;
  keywords?: string[];
}

export interface AdminHub {
  id: string;
  name: string;
  shortName?: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  desc: string;
  keywords: string[];
  subItems: AdminSubItem[];
}

export const ADMIN_HUBS: AdminHub[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    shortName: "Command",
    href: "/admin",
    icon: LayoutDashboard,
    desc: "Autonomous Operations, Movement Queue & Live KPIs",
    keywords: ["home", "overview", "analytics", "kpi", "movements", "command center"],
    subItems: [
      {
        name: "Operations Overview",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
        desc: "Live Operations Command Center",
      },
    ],
  },
  {
    id: "reservations",
    name: "Reservations & Calendar",
    shortName: "Calendar",
    href: "/admin/calendar",
    icon: CalendarDays,
    badge: "2-Way OTA",
    desc: "Master Calendar, Reservations Stream & Invoicing",
    keywords: ["calendar", "availability", "airbnb", "booking.com", "ical", "reservations", "bookings", "tariff"],
    subItems: [
      {
        name: "Master Calendar",
        href: "/admin/calendar",
        icon: CalendarDays,
        desc: "Interactive 2-Way Calendar & Blocked Dates",
      },
      {
        name: "Reservations Stream",
        href: "/admin/bookings",
        icon: Clock,
        desc: "All Reservations, Payments & Statutory Invoices",
      },
      {
        name: "New Reservation",
        href: "/admin/bookings/new",
        icon: Plus,
        badge: "Create",
        desc: "Manual Direct Reservation Creation",
      },
    ],
  },
  {
    id: "guests",
    name: "Guest CRM & Compliance",
    shortName: "Guests",
    href: "/admin/guests",
    icon: Users,
    badge: "ID Vetting",
    desc: "Guest Identity KYC, Document Vetting & Statutory Police Form C",
    keywords: ["guests", "crm", "kyc", "aadhaar", "passport", "police", "form c", "compliance", "law", "vetting"],
    subItems: [
      {
        name: "Directory & ID Vetting",
        href: "/admin/guests",
        icon: Users,
        exact: true,
        badge: "KYC",
        desc: "180-Day Vetted Guest Profiles & Identity Documents",
      },
      {
        name: "Police Register (Form C)",
        href: "/admin/guests/police-register",
        icon: ShieldCheck,
        badge: "Statutory",
        desc: "Official Local Law Enforcement Police Register",
      },
    ],
  },
  {
    id: "events",
    name: "Gatherings & Access",
    shortName: "Gatherings",
    href: "/admin/events",
    icon: Sparkles,
    badge: "Gatekeeper",
    desc: "Sanctuary Munches, Membership Passes, QR Scanner & Moderation",
    keywords: ["events", "munches", "gatherings", "curation", "vetting", "scanner", "qr", "gatekeeper", "sanctuary pass", "safety", "moderation"],
    subItems: [
      {
        name: "Gatherings & Munches",
        href: "/admin/events",
        icon: Sparkles,
        badge: "Curation",
        desc: "AI Vetting & Sanctuary Private Gatherings",
      },
      {
        name: "Sanctuary Pass Tiers",
        href: "/admin/sanctuary-pass",
        icon: Ticket,
        desc: "Pass Tiers, Lifetime Pricing & Member Access",
      },
      {
        name: "Gatekeeper QR Scanner",
        href: "/admin/marshall-scanner",
        icon: Scan,
        badge: "Live Pass",
        desc: "Camera QR Scanner for Gathering & Suite Entry",
      },
      {
        name: "Safety & Moderation",
        href: "/admin/moderation",
        icon: Flag,
        badge: "Reports",
        desc: "Community Incident Triage, Flags & Member Safeguards",
      },
    ],
  },
  {
    id: "spaces",
    name: "Sanctuaries & Ops",
    shortName: "Sanctuaries",
    href: "/admin/spaces",
    icon: Building2,
    desc: "Suites & Spaces Inventory, Housekeeping Turnovers & Partners",
    keywords: ["spaces", "suites", "rooms", "villas", "properties", "housekeeping", "cleaning", "turnover", "cleaner", "partners", "franchise"],
    subItems: [
      {
        name: "Suites & Spaces",
        href: "/admin/spaces",
        icon: Building2,
        desc: "Property Inventory, Tariffs, Amenities & Photos",
      },
      {
        name: "Housekeeping Turnovers",
        href: "/admin/housekeeping",
        icon: ShieldCheck,
        badge: "Dispatch",
        desc: "Turnover Tasks, Squeeze Management & Cleaner Alerts",
      },
      {
        name: "Franchise & Partners",
        href: "/admin/partners",
        icon: Building2,
        desc: "Partner KYC, Inbound Investor Leads & NOC Verification",
      },
    ],
  },
  {
    id: "communications",
    name: "Communications Hub",
    shortName: "Inbox",
    href: "/admin/inbox",
    icon: MessageSquare,
    badge: "Omnichannel",
    desc: "Live Concierge Chats, Web Inquiries, Push Broadcasts & WhatsApp API",
    keywords: ["inbox", "chat", "messages", "bot", "flows", "whatsapp", "meta", "cloud api", "webhook", "inquiries", "push", "broadcast"],
    subItems: [
      {
        name: "Live Inbox & Flows",
        href: "/admin/inbox",
        icon: MessageSquare,
        exact: true,
        desc: "Omnichannel WhatsApp, IG, FB & Concierge Chatflows",
      },
      {
        name: "Contact Inquiries",
        href: "/admin/messages",
        icon: FileText,
        desc: "Public Web Form Inquiries & Inbound Leads",
      },
      {
        name: "Push Broadcasts",
        href: "/admin/notifications",
        icon: Bell,
        desc: "Instant Push Notification Dispatch to Devices",
      },
      {
        name: "WhatsApp Cloud API",
        href: "/admin/whatsapp-connect",
        icon: Smartphone,
        badge: "Meta API",
        desc: "Meta Cloud API Status, Webhook Diagnostics & Test Pings",
      },
    ],
  },
  {
    id: "brand",
    name: "Brand & Editorial",
    shortName: "Editorial",
    href: "/admin/cms",
    icon: PenTool,
    desc: "Homepage CMS Content Blocks & Editorial Journal",
    keywords: ["cms", "homepage", "copy", "brand", "journal", "articles", "blog", "editorial", "publishing"],
    subItems: [
      {
        name: "Homepage CMS",
        href: "/admin/cms",
        icon: PenTool,
        desc: "Hero, Trust Pillars, Philosophy & Experience Copy",
      },
      {
        name: "Editorial Journal",
        href: "/admin/journal",
        icon: BookOpen,
        desc: "Articles, AI Cover Art Generation & Cultural Essays",
      },
    ],
  },
  {
    id: "finance",
    name: "Finance & System",
    shortName: "System",
    href: "/admin/financials",
    icon: CreditCard,
    desc: "Ledger & GST Yields, Audit Log & Platform System Settings",
    keywords: ["financials", "revenue", "ledger", "gst", "accounting", "payouts", "audit", "logs", "security", "settings", "fees", "tax", "passkeys", "ai prompt"],
    subItems: [
      {
        name: "Financials & Ledger",
        href: "/admin/financials",
        icon: CreditCard,
        desc: "Gross Revenue, Statutory GST & Space Performance",
      },
      {
        name: "Audit Log",
        href: "/admin/audit",
        icon: ScrollText,
        desc: "Immutable Admin Action Ledger & Security Events",
      },
      {
        name: "Settings & Policies",
        href: "/admin/settings",
        icon: Settings,
        desc: "Tariffs, Policies, 2FA, Passkeys & Gemini AI Prompts",
      },
    ],
  },
];

/**
 * Finds the parent hub corresponding to a given pathname.
 */
export function findHubForPathname(pathname: string): AdminHub | undefined {
  if (pathname === '/admin') {
    return ADMIN_HUBS.find((h) => h.id === 'dashboard');
  }

  // Exact or subpath match on sub-items first
  for (const hub of ADMIN_HUBS) {
    if (hub.id === 'dashboard') continue;

    for (const sub of hub.subItems) {
      if (sub.exact) {
        if (pathname === sub.href) return hub;
      } else {
        if (pathname === sub.href || pathname.startsWith(`${sub.href}/`)) {
          return hub;
        }
      }
    }
  }

  // Fallback: check hub root href
  for (const hub of ADMIN_HUBS) {
    if (hub.id === 'dashboard') continue;
    if (pathname === hub.href || pathname.startsWith(`${hub.href}/`)) {
      return hub;
    }
  }

  return undefined;
}

/**
 * Flat list of all sub-items with parent hub info for Command Palette indexing.
 */
export interface AdminPaletteItem {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  desc?: string;
  parentHubName: string;
  keywords: string[];
}

export const ALL_ADMIN_PALETTE_ITEMS: AdminPaletteItem[] = ADMIN_HUBS.flatMap((hub) =>
  hub.subItems.map((sub) => ({
    id: `${hub.id}-${sub.href}`,
    name: sub.name,
    href: sub.href,
    icon: sub.icon,
    badge: sub.badge || hub.badge,
    desc: sub.desc || hub.desc,
    parentHubName: hub.name,
    keywords: [...hub.keywords, ...(sub.keywords || [])],
  }))
);

// Backward-compatibility export
export const ALL_ADMIN_NAV_ITEMS = ALL_ADMIN_PALETTE_ITEMS;
