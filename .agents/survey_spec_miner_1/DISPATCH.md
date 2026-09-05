# Dispatch: survey_spec_miner_1

**Mission**: Survey the database schema, migrations, data models, and backend/API contracts relevant to R1-R5.

**Mandatory Reading**:
- `c:\Users\hudav\Documents\GitHub\nothingness\ORIGINAL_REQUEST.md` (read this first)

**Scope of Investigation**:
1. Check Supabase schema, migrations (`supabase/migrations`, etc.), existing tables (`profiles`, `event_applications`, `sanctuary_passes`, `gathering_vettings`, `kinkster_resonances`, chats/messages, etc.).
2. Examine database types (e.g. `src/types/database.types.ts` or similar), RPCs, RLS policies.
3. Check existing data models for Level 1/2 vetting, consent marshalls, admin roles, and PIN verification.
4. Check data models for dual-blind desire resonance (48hr mutual lock, query patterns, RLS privacy preventing single-sided leak).
5. Check models/storage for ephemeral whispers, burn-on-read media, voice notes, and 24hr post-gathering auto-purge.
6. Report existing schemas, gaps, and required schema migrations or mocks for R1-R5.

**Output**: Write full report to `c:\Users\hudav\Documents\GitHub\nothingness\.agents\survey_spec_miner_1\report.md` and `handoff.md`.

## 2026-09-04T19:10:30Z
You are survey_spec_miner_1.
Your working directory: c:\Users\hudav\Documents\GitHub\nothingness\.agents\survey_spec_miner_1
Your parent orchestrator: teamwork_preview_orchestrator_1 (Conversation ID: 02c3aaab-5fbc-45c0-823f-14bab9365c11)

MANDATORY FIRST STEP:
Read c:\Users\hudav\Documents\GitHub\nothingness\ORIGINAL_REQUEST.md and c:\Users\hudav\Documents\GitHub\nothingness\.agents\survey_spec_miner_1\DISPATCH.md.

TASK:
Survey database schema, migrations, data models, and backend/API contracts relevant to R1-R5.
1. Check Supabase schema, migrations (`supabase/migrations`), existing tables: profiles, event_applications, sanctuary_passes, gathering_vettings, kinkster_resonances, chat/messages.
2. Check database types (TypeScript declarations), RPC functions, Row Level Security (RLS) policies.
3. Identify Level 1/2 vetting fields, Marshall PIN verification logic/auth.
4. Identify Dual-Blind Desire Resonance schema (kinkster_resonances, 48hr lock, mutual match detection without single-sided disclosure).
5. Identify Ephemeral chat / burn-on-read media / voice notes storage and 24hr post-gathering purge mechanism.
6. Detail exact fields, migrations needed, and mock/client interfaces.

Write your report to c:\Users\hudav\Documents\GitHub\nothingness\.agents\survey_spec_miner_1\report.md
Write your handoff to c:\Users\hudav\Documents\GitHub\nothingness\.agents\survey_spec_miner_1\handoff.md
Send a completion message back to parent when done.

