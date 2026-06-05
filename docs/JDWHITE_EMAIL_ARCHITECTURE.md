# JDWhite.world — Email System Architecture

**Version:** 1.0  
**Built:** June 2026  
**Status:** Phase 1 complete. Phase 2 (sequences) next.

---

## 1. Current State Audit

### What exists (as of June 2026)

| Component | Status |
|---|---|
| `landing_page/work-with-me/index.html` | Live — captures name, email, company, quiz answers, tier |
| `/api/concierge/lead` | Live — stores to Supabase `sales_leads` + notifies Jerry |
| `sales_leads` table | Live — id, name, email, company, recommendation, answers, status |
| Lead notification email | Live — dark cinematic email to Jerry on every submission |
| Confirmation to lead | **Phase 1 — just built** |
| Newsletter/ecosystem signup | **Phase 1 — just built** |
| `jdw_subscribers` table | **Phase 1 — just built** |
| `jdw_email_log` table | **Phase 1 — just built** |
| `layout-jdw.ts` email shell | **Phase 1 — just built** |

### What was missing before Phase 1

- No email sent back to the lead after form submission
- No newsletter or ecosystem subscribe endpoint
- No subscriber table (separate from ACCESS platform users)
- No email log for jdwhite.world sends
- No jdwhite.world visual identity for outbound emails

---

## 2. The Two-Track System

JDWhite.world serves two distinct audiences. Keep them separated permanently.

```
TRACK 1: BUSINESS DEVELOPMENT
  Audience: leads, prospects, clients
  Data table: sales_leads
  Purpose: qualify → convert → close

TRACK 2: ECOSYSTEM / AUDIENCE
  Audience: subscribers, followers, community
  Data table: jdw_subscribers
  Purpose: build relationship → trust → long-term routing
```

---

## 3. Email Categories

### Track 1 — Business Development

| ID | Email Type | Trigger | Status |
|---|---|---|---|
| BD-01 | `concierge_confirmation` | Lead submits Work With Me form | ✅ Phase 1 |
| BD-02 | `youre_on_my_radar` | 24h after BD-01, no reply from Jerry | Phase 2 |
| BD-03 | `discovery_scheduled` | Meeting booked via calendar | Phase 2 |
| BD-04 | `proposal_sent` | Proposal delivered | Phase 2 |
| BD-05 | `strategic_followup` | 5 days after BD-04, no response | Phase 2 |
| BD-06 | `opportunity_closed` | Lead → client conversion confirmed | Phase 2 |

### Track 2 — Ecosystem / Audience

#### Ecosystem Layer
| ID | Email Type | Trigger | Status |
|---|---|---|---|
| EC-01 | `welcome_ecosystem` | Newsletter or ecosystem signup | ✅ Phase 1 |
| EC-02 | `choose_your_path` | 3 days after EC-01 | Phase 2 |
| EC-03 | `registry_update` | New venture launches | Phase 3 |
| EC-04 | `world_activated` | New ecosystem world goes live | Phase 3 |

#### Founder Layer
| ID | Email Type | Trigger | Status |
|---|---|---|---|
| FD-01 | `founder_dispatch` | Manual send — Jerry writes | Phase 2 |
| FD-02 | `field_notes` | Manual send — shorter format | Phase 2 |
| FD-03 | `current_thesis` | Manual send — single idea | Phase 3 |
| FD-04 | `open_letter` | Manual send — public-facing message | Phase 3 |

#### Product Layer
| ID | Email Type | Trigger | Status |
|---|---|---|---|
| PD-01 | `product_update_access` | ACCESS ships major update | Phase 3 |
| PD-02 | `product_update_jyson` | JYSON ships | Phase 3 |
| PD-03 | `product_update_vault` | VAULT update | Phase 3 |
| PD-04 | `new_system_online` | Any new product goes live | Phase 3 |

#### Newsletter Layer
| ID | Email Type | Trigger | Status |
|---|---|---|---|
| NL-01 | `newsletter_build_what_comes_next` | Weekly/biweekly — evergreen | Phase 2 |
| NL-02 | `newsletter_ecosystem_update` | Monthly — full system snapshot | Phase 3 |

---

## 4. Data Model

### `sales_leads` (Business Dev track)
```
id, name, email, company, recommendation (launch/grow/scale),
answers (jsonb), status (new/contacted/converted/closed), created_at
```

### `jdw_subscribers` (Ecosystem track)
```
id, email, name,
source (newsletter/ecosystem/founder_dispatch/product_updates/field_notes),
selected_path (founder/ecosystem/product/builder/observer),
interest_tags (text[]),
subscriber_status (pending/confirmed/unsubscribed/bounced),
automation_stage (integer — position in sequence),
confirmed_at, unsubscribed_at, last_emailed_at,
metadata (jsonb), created_at, updated_at
```

### `jdw_email_log` (All sends — both tracks)
```
id, recipient_email, email_type, track (business_dev/ecosystem/founder/product/newsletter),
source_site (jdwhite.world), venture (jdwhite),
lead_id (FK → sales_leads), subscriber_id (FK → jdw_subscribers),
subject, resend_message_id, status (sent/failed/bounced),
automation_stage, metadata, sent_at
```

---

## 5. Template System

### Visual Identity

| Layout | File | Used for |
|---|---|---|
| `layout-jdw.ts` | Dark void, portal signal, personal | ALL jdwhite.world emails |
| `layout-jdp.ts` | Cream, editorial, Finimize | JD Productions venture emails |
| `layout-finimize.ts` | White, data-driven | ACCESS platform intelligence |
| `layout.ts` | Clean white, product SaaS | ACCESS platform transactional |

### JDW Design Tokens
```
bg:     #06070D  (void)
card:   #0B0D1A  (card surface)
text:   rgba(255,255,255,0.88)
muted:  rgba(255,255,255,0.42)
faint:  rgba(255,255,255,0.18)
signal: #7B9CFF  (portal signal accent)
border: rgba(255,255,255,0.07)
```

### Primitives
```typescript
jdwLabel(text)          // section label in signal blue
jdwLede(text)           // large serif opening line
jdwParagraph(text)      // body paragraph
jdwStep(num, html)      // numbered step
jdwBlock(html)          // subtle surface block
jdwCTA(label, href)     // dark button with signal accent
jdwDivider()            // subtle horizontal rule
jdwSignature(name)      // personal sign-off
```

---

## 6. API Endpoints

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/concierge/lead` | POST | Public (CORS) | Lead capture + Jerry notify + lead confirmation |
| `/api/jdw/subscribe` | POST | Public (CORS) | Newsletter/ecosystem subscribe + welcome email |
| `/api/internal/email/test-jdp` | POST | Internal secret | Test JDP layout emails |

---

## 7. Automation Logic

### Phase 1 (Live)
```
Lead submits Work With Me
  → sales_leads INSERT
  → notifyFounder() → Jerry gets dark cinematic email
  → confirmLead() → Lead gets "Your inquiry is in." (JDW dark layout)
  → jdw_email_log INSERT

Someone subscribes to newsletter/ecosystem
  → jdw_subscribers UPSERT
  → sendWelcomeEmail() → "Signal received." (JDW dark layout)
  → jdw_email_log INSERT
```

### Phase 2 (Next)
```
24h after lead confirmation, no response logged
  → queue BD-02 "You're on my radar"
  → automation_stage = 2

3 days after EC-01 welcome
  → queue EC-02 "Choose your path"
  → automation_stage = 2

Jerry triggers founder dispatch manually
  → query confirmed subscribers where source IN ('newsletter', 'founder_dispatch')
  → bulk send FD-01
```

### Phase 3 (Future)
```
New venture goes live
  → query subscribers where selected_path IN ('ecosystem', 'observer')
  → send EC-04 "World activated"

Product ships major update
  → query subscribers where selected_path IN ('product', 'builder')
  → send PD-01/02/03/04
```

---

## 8. Env Variables Required

| Variable | Purpose | Where to set |
|---|---|---|
| `RESEND_API_KEY` | All email sends | Vercel → access-app |
| `EMAIL_FROM` | Default FROM address | Vercel → access-app |
| `JDW_EMAIL_FROM` | jdwhite.world specific FROM | Vercel → access-app |
| `FOUNDER_TEST_EMAIL` | Jerry's email for notifications | Vercel → access-app |

### Recommended values
```
JDW_EMAIL_FROM = Jerry Devin <hello@jdwhite.world>
EMAIL_FROM     = JD Productions <notifications@jdwhite.world>
```

---

## 9. Files to Not Touch

| File | Why |
|---|---|
| `landing_page/index.html` | Cinematic portal — backup before every edit |
| `access-app/proxy.ts` | Clerk middleware — only edit public routes list |
| `access-app/supabase/schema.sql` | Core platform schema — use versioned schemas |

---

## 10. Implementation Plan

### Phase 1 — Foundation (Complete)
- [x] `layout-jdw.ts` — visual shell
- [x] `schema_jdw.sql` — `jdw_subscribers` + `jdw_email_log` tables
- [x] `/api/concierge/lead` — updated with `confirmLead()`
- [x] `/api/jdw/subscribe` — new subscribe endpoint
- [x] `proxy.ts` — `/api/jdw/(.*)` added to public routes

### Phase 2 — Sequences
- [ ] BD-02: "You're on my radar" (Day 1 follow-up cron)
- [ ] EC-02: "Choose your path" (Day 3 ecosystem onboarding)
- [ ] FD-01: Founder dispatch send interface
- [ ] NL-01: "Build what comes next" newsletter template
- [ ] Add newsletter signup widget to `landing_page/index.html`

### Phase 3 — Scale
- [ ] Webhook: Resend → Supabase for open/bounce tracking
- [ ] Venture-specific subscriber paths (route ecosystem signups to sub-venture lists)
- [ ] Admin interface for viewing subscribers + lead pipeline

---

## 11. QA Checklist

### Per email type before going live:
- [ ] Send test to `jdevinwhite2@gmail.com` via `/api/internal/email/test-jdp` or direct curl
- [ ] Check subject line renders correctly
- [ ] Check preheader text (visible in Gmail inbox preview)
- [ ] Check mobile rendering (test on iPhone Mail)
- [ ] Check all links are live and correct
- [ ] Check unsubscribe link works
- [ ] Verify Supabase row was written to `jdw_email_log`
- [ ] Verify FROM address shows as intended (not `notifications@` for personal emails)

### For the concierge confirmation (BD-01):
- [ ] Submit test form at `jdwhite.world/work-with-me/`
- [ ] Confirm Jerry gets notification email
- [ ] Confirm lead gets "Your inquiry is in." email
- [ ] Confirm `sales_leads` row created
- [ ] Confirm `jdw_email_log` row created with `email_type = 'concierge_confirmation'`

### For the subscribe endpoint (EC-01):
- [ ] POST to `/api/jdw/subscribe` with test email
- [ ] Confirm "Signal received." email arrives
- [ ] Confirm `jdw_subscribers` row created with `subscriber_status = 'confirmed'`
- [ ] Confirm `jdw_email_log` row created with `email_type = 'welcome_ecosystem'`

---

## Reuse Pattern for Other Ventures

This same two-track architecture applies to every venture:

```
VENTURE EMAIL SYSTEM
├── Track 1: Business (leads, clients) → use sales_leads or venture-specific table
├── Track 2: Audience (subscribers) → use venture_subscribers table
├── Layout: layout-jdp.ts (cream editorial) for venture brands
├── Log: venture_email_log
└── API: /api/{venture}/subscribe
```

When building the next venture email system, clone this pattern.
Change: layout (jdp vs jdw), FROM address, copy voice, trigger conditions.
Keep: two-track separation, log table, same send queue infrastructure.
