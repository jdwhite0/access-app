# ACCESS — Account function vs user operations

Every signed-in user hits two layers. Problems are classified so **JYSON** (intelligence layer) can fix or guide — not leave people on dead-end screens.

## Layer 1 — Account function (who you are in ACCESS)

What the system stores and maintains for the user:

| Area | What it is |
|------|------------|
| **Auth** | Clerk session |
| **Identity** | ACCESS handle, profile row |
| **Blueprint** | Founder spec in Supabase |
| **Vault (cloud)** | Synced brain-folder context in `vault_chunks` |
| **Package** | Founder OS materialization (optional on device) |

If account function is incomplete, **some operations are limited** — but cloud vault + identity should still allow JYSON chat when possible.

## Layer 2 — User operations (what you do in the OS)

What the user is trying to accomplish:

| Operation | Blocked when |
|-----------|----------------|
| **Talk to JYSON** | No identity, no cloud context, hard error |
| **Sync vault** | No path, connector offline (prod), path missing on device |
| **Local bridge** | No heartbeat / not on desktop |
| **Agents / tools** | OpenJarvis down (optional — cloud still works) |

**Rule:** Never block revenue work without an on-screen **recovery plan** — title, explanation, buttons, optional one-question router, and **Ask JYSON** prompt.

## Intelligence layer responsibility

JYSON should:

1. **Detect** the blocker (diagnostics API, companion load, vault sync, device status).
2. **Classify** account vs operation layer.
3. **Offer actions** — primary fix, alternates, micro-question (“What are you trying to do?”).
4. **Auto-attempt** safe server fixes (retry load, refresh context) when `jysonCanAutoFix` is true.
5. **Guide** when user action is required (blueprint, pairing, desktop-only sync).

Code implements **RecoveryPlan** (`lib/access/recovery-framework.ts`) and **AccessRecoveryGuide** UI. Product copy must stay non-technical.

## Anti-patterns (do not ship)

- “Your world is not ready” with no button
- Terminal-only instructions without copy action
- Same repair flow for every account (draft blueprint ≠ no vault)
- Mobile treated as broken desktop

## See also

- `lib/access/recovery-plans.ts` — maps diagnostics → plans
- `components/platform/AccessRecoveryGuide.tsx` — shared recovery UI
- `app/api/access/recovery/plan/route.ts` — JYSON / client fetch
