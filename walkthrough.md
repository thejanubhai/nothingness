# Walkthrough - Admin Sanctuary Pass & Kinkster Profile In-Profile CRUD & Real-Time Reflection

## Summary

We have built a dedicated **In-Profile Manual CRUD & Feature Control Center** directly inside the Admin Guest Profiling interface (`/admin/guests/[id]`), backed by **Supabase Realtime** synchronization so that any changes made by an admin reflect immediately on both the admin interface and the user's dashboard/portal without requiring page reloads.

---

## What Was Implemented

### 1. Database & Schema Enhancements
- Added dedicated tracking columns to `sanctuary_passes`:
  - `pass_tier` (default `'Noir Luminary'`)
  - `expires_at` (`timestamptz`, nullable for lifetime passes)
  - `admin_notes` (text for concierge memos)
  - `guest_profile_id` (uuid for direct guest-to-pass linkage)
- Added moderation columns to `kinkster_profiles`:
  - `guest_profile_id` (uuid)
  - `user_id` (uuid)
  - `admin_notes` (text)
  - `is_id_verified` (boolean)
  - `id_verified_at` (timestamptz)
- Enrolled `guest_profiles`, `sanctuary_passes`, and `kinkster_profiles` into the `supabase_realtime` publication for instant pub/sub state updates.

---

### 2. Admin API Endpoints for Full CRUD

#### A. Sanctuary Pass Management Route
[`app/api/admin/guests/[id]/sanctuary-pass/route.ts`](file:///c:/Users/hudav/Documents/GitHub/nothingness/app/api/admin/guests/[id]/sanctuary-pass/route.ts):
- **`GET`**: Fetches the active Sanctuary Pass associated with this guest.
- **`POST`**: Issues a new Sanctuary Pass manually (status, tier, tariff, comp reference ID, expiration, notes).
- **`PATCH`**: Updates pass attributes or performs 1-click activation/suspension.
- **`DELETE`**: Completely revokes / deletes the Sanctuary Pass.
- Automates cache revalidation across `/admin/guests/[id]`, `/admin/sanctuary-pass`, `/dashboard`, and `/sanctuary-pass`.

#### B. Kinkster Profile Management Route
[`app/api/admin/guests/[id]/kinkster-profile/route.ts`](file:///c:/Users/hudav/Documents/GitHub/nothingness/app/api/admin/guests/[id]/kinkster-profile/route.ts):
- **`GET`**: Fetches the guest's Kinkster Profile.
- **`POST`**: Initializes a new Kinkster profile with a customized or auto-generated `@alias`, bio, and vetted credentials.
- **`PATCH`**: Edits profile metadata or toggles specific features:
  - `is_activated` (Ecosystem Access)
  - `stay_verified` (Stay Verified Badge)
  - `face_id_vetted` (3D Face ID Biometrically Vetted)
  - `in_person_vetted` (Physical Gatekeeper Vetted)
  - `is_trusted_host` (Trusted Host 👑)
  - `confidentiality_agreed` (NDA Signed)
- Automatically synchronizes biometric & vetting flags with the underlying `guest_profiles` record.
- **`DELETE`**: Deactivates (soft) or permanently removes (hard) the Kinkster profile.

---

### 3. Luxury Admin Command Centers in Guest Profiling
[`components/admin/AdminGuestProfileClient.tsx`](file:///c:/Users/hudav/Documents/GitHub/nothingness/components/admin/AdminGuestProfileClient.tsx):
- **Sanctuary Pass VIP Control Center**:
  - Golden luxury aesthetic with status pills (`ACTIVE MEMBER`, `SUSPENDED`, `NOT ISSUED`).
  - 1-Click Toggle: Instantly toggle pass state between Active and Suspended with optimistic UI.
  - Issue / Edit Pass Modal: Configure Tier (`Noir Luminary`, `Standard`, `Lifetime Founder`), Tariff, Comp Order ID, Expiry date, and Concierge notes.
  - Revoke button with confirmation protection.
- **Kinkster Lifestyle Profile Control Center**:
  - Rose/crimson luxury aesthetic displaying `@alias` and member status.
  - **6 Interactive Live Toggles**:
    1. ⚡ **Ecosystem Access (`is_activated`)**: Toggle feed & community presence ON/OFF.
    2. 🏰 **Sanctuary Stay Verified (`stay_verified`)**: Toggle verified stay badge ON/OFF.
    3. 👁️ **3D Face ID Vetted (`face_id_vetted`)**: Toggle door gatekeeper biometric approval ON/OFF.
    4. 🚪 **In-Person Gatekeeper Vetted (`in_person_vetted`)**: Toggle host/concierge vetting ON/OFF.
    5. 👑 **Trusted Host Status (`is_trusted_host`)**: Toggle co-stay hosting eligibility ON/OFF.
    6. 📜 **NDA / Confidentiality Signed (`confidentiality_agreed`)**: Toggle consent & confidentiality status ON/OFF.
  - Initialize / Edit Profile Modal: Edit alias, bio, comma-separated interest tags, and feature flags.
  - One-click Deactivate Profile button.
- **Real-Time Supabase Sync**:
  - The client component subscribes to Supabase postgres change events on `sanctuary_passes`, `kinkster_profiles`, and `guest_profiles`. Any update made updates local state reactively.

---

### 4. User Frontend Real-Time Reflection
[`app/dashboard/page.tsx`](file:///c:/Users/hudav/Documents/GitHub/nothingness/app/dashboard/page.tsx) & [`components/dashboard/UserDashboardClient.tsx`](file:///c:/Users/hudav/Documents/GitHub/nothingness/components/dashboard/UserDashboardClient.tsx):
- Passes both `sanctuaryPass` and `kinksterProfile` into the user dashboard.
- Subscribes to Supabase Realtime so that when an admin activates or modifies a pass or profile in `/admin/guests/[id]`:
  - **Sanctuary Pass Card (Option B)** dynamically switches from standard promo to:
    - Glowing golden card: `✓ Noir Luminary` (or active tier).
    - Status message: *"Your VIP Sanctuary Pass is active. You have full clearance to secret munches, noir masquerades, and intimate salon soirées."*
    - Direct action button: `Enter Sanctuary Events Vault →`
  - **Lifestyle Circle Card (Option C)** dynamically switches to:
    - Glowing rose card: `Active • @alias`
    - Badges: `Stay Verified ✓`, `3D Face ID ✓`, `Trusted Host 👑`
    - Direct action button: `Enter Lifestyle Feed →`

---

## Verification & Build Results

- **`pnpm test` (`tsc --noEmit`)**: Passed with 0 errors (Exit code 0).
- **`pnpm build` (`next build`)**: Successfully compiled all 117 pages and dynamic routes with 0 errors (Exit code 0).
