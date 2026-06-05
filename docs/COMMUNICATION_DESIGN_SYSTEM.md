# JDWhite.world — Communication Design System

**Version:** 1.0  
**Classification:** Master System Spec  
**Scope:** JDWhite.world primary · Extends to all ecosystem ventures  
**Status:** Active — implement before writing any new templates

---

## 0. What This Document Is

This is the master communication specification for the JDWhite.world ecosystem.

Every email, notification, and system message sent from any venture in this ecosystem must be built from this document.

It defines:
- The philosophy behind every communication
- Two distinct communication modes and when to use each
- The visual design language and token system
- A reusable component library
- Subject line and CTA frameworks
- Rules for mobile and scalability

This is not a collection of templates.
This is the language the ecosystem speaks.

---

## 1. Communication Philosophy

### The Ecosystem Principle

JDWhite.world is not a website. It is the entry point to a living ecosystem of ventures, systems, products, and worlds.

Every communication reinforces one of two things:

1. **Something happened in the system.** (Operational signal — for Jerry)
2. **You are part of the ecosystem.** (Connection signal — for users)

No email is neutral. Every send either builds ecosystem identity or dilutes it.

### The Signal Principle

All communications are signals.

A signal has:
- A **source** (which system, venture, or world sent it)
- A **type** (what kind of event triggered it)
- A **recipient** (who needs to act or be informed)
- A **next step** (what happens next)

If a communication cannot answer all four, it should not be sent.

### The 60-Second Rule

Every external email must be fully understood in under 60 seconds.

Most internal emails must be actionable in under 30 seconds.

No wall of text. No long-form essays unless explicitly a Founder Dispatch.

### The Identity Standard

When someone receives an email from this ecosystem, they should immediately know:

- This came from the JDWhite.world ecosystem
- It is serious, modern, and founder-led
- There is always a clear next step

They should never feel like they received a generic SaaS notification or marketing blast.

---

## 2. Two Communication Modes

The entire system operates in two modes. Every email belongs to exactly one.

---

### MODE 1 — INTERNAL SIGNAL

**Recipient:** Jerry (operational awareness)

**Purpose:** Tell Jerry what happened, why it matters, and what to do next.

**Tone:** Mission Control. Operations center. Clear, fast, actionable.

**Format principle:** Every internal signal answers three questions in order:

```
1. WHAT HAPPENED?     → The event. One sentence. No ambiguity.
2. WHY IT MATTERS?    → Business context. One sentence.
3. WHAT IS THE MOVE?  → Specific, named next action.
```

**What internal signals are NOT:**
- Not marketing emails sent to Jerry
- Not newsletter content
- Not long explanations
- Not emotional language

**Examples of internal signal types:**

```
NEW LEAD DETECTED
NEW SUBSCRIBER
BOOKING CONFIRMED
PAYMENT RECEIVED
APPLICATION RECEIVED
PROJECT STATUS UPDATED
SYSTEM ALERT
```

**Urgency levels:**

| Level | Color | When to use |
|---|---|---|
| HIGH | #FF5F5F (red) | Revenue opportunity, time-sensitive decision |
| MEDIUM | #FFB547 (amber) | Needs response within 24h |
| LOW | #7B9CFF (blue) | Informational, no immediate action |

---

### MODE 2 — EXTERNAL SIGNAL

**Recipient:** Users, subscribers, leads, clients, community

**Purpose:** Connect the recipient to the ecosystem and guide their next step.

**Tone:** Intelligent, human, founder-led. Never corporate. Never robotic.

**Format principle:** Every external signal communicates:

```
1. ACKNOWLEDGMENT  → You are recognized. What you did matters.
2. ORIENTATION     → Here is where you are in the ecosystem.
3. NEXT STEP       → Here is what happens next.
```

**What external signals are NOT:**
- Not sales copy
- Not long newsletters (unless explicitly a Founder Dispatch)
- Not generic SaaS onboarding
- Not template filler text

**Sub-modes within external signals:**

| Sub-mode | Use for | Tone |
|---|---|---|
| Transactional | Confirmations, receipts, scheduling | Clear, warm, brief |
| Relational | Welcome, dispatch, community | Personal, founder voice |
| Informational | Updates, announcements | Clear, confident |

---

## 3. Visual Design Language

### Core Principle

The visual language comes from JDWhite.world: void dark, portal signal, ecosystem depth.

No spaceship aesthetics. No sci-fi gimmicks. Sophisticated and modern.

Reference: Apple (precision) + Notion (clarity) + Finimize (scannability) + Mission Control (hierarchy)

---

### Color Tokens

#### Internal Signal Mode
```
SIG_BG       #030407                    — deeper void (operational gravity)
SIG_CARD     #0A0C14                    — card surface
SIG_BORDER   rgba(255,255,255,0.08)     — subtle structure
SIG_TEXT     rgba(255,255,255,0.90)     — primary text
SIG_MUTED    rgba(255,255,255,0.50)     — secondary text
SIG_FAINT    rgba(255,255,255,0.22)     — labels, metadata
SIG_HIGH     #FF5F5F                    — urgent/critical
SIG_MED      #FFB547                    — needs attention
SIG_LOW      #7B9CFF                    — informational
```

#### External Signal Mode (JDWhite.world)
```
JDW_BG       #06070D                    — void
JDW_CARD     #0B0D1A                    — card surface
JDW_BORDER   rgba(255,255,255,0.07)     — subtle structure
JDW_TEXT     rgba(255,255,255,0.88)     — primary text
JDW_MUTED    rgba(255,255,255,0.42)     — secondary text
JDW_FAINT    rgba(255,255,255,0.18)     — labels, metadata
JDW_SIGNAL   #7B9CFF                    — portal signal (primary accent)
JDW_SURFACE  rgba(255,255,255,0.04)     — subtle raised surface
```

#### Venture Accent Colors
Each venture overrides the signal color for portal badges and CTAs:

```
jdwhite.world     #7B9CFF    — portal signal (indigo-blue)
jd-productions    #0A2540    — navy
access            #40C0D0    — teal
white-lane        #C9A46A    — gold
bridge-video      #D4D4D4    — near-white
lil-dev           #7C3AED    — purple
linc              #C9A46A    — warm gold
the-collection    #169B48    — emerald
regal             #169B48    — emerald
jerry-devin       #169B48    — emerald
```

---

### Typography

```
HEADLINES     Georgia, 'Times New Roman', serif
              Size: 22–28px  |  Weight: 700  |  Line-height: 1.2
              Color: rgba(255,255,255,0.92)

BODY          system-ui, -apple-system, 'Segoe UI', sans-serif
              Size: 15px  |  Weight: 400  |  Line-height: 1.68
              Color: primary text token

LABELS        'SFMono-Regular', ui-monospace, Menlo, monospace
              Size: 10–11px  |  Weight: 700  |  Letter-spacing: 0.14em
              Text-transform: uppercase
              Color: faint token or accent color
```

---

### Spacing System

```
Container max-width:    560px
Outer padding:          28px horizontal, 28px vertical
Card padding:           16–20px
Component gap:          20–24px
Mobile outer padding:   16px horizontal
Section divider height: 1px
Signal line height:     2px
```

---

### Signal Line

The 2px top gradient line is the ecosystem identifier. Every email has one.

```css
background: linear-gradient(
  90deg,
  [venture-accent] 0%,
  rgba([venture-accent], 0.3) 60%,
  transparent 100%
)
```

For internal signals: use urgency color (red/amber/blue).
For external signals: use venture accent.

---

## 4. Component Library

Every email is assembled from these components. No email should contain layout code outside this library.

---

### C-01 — SIGNAL HEADER

Used in: All emails (internal and external)

Contains:
- Signal line (2px gradient)
- Ecosystem identifier (JDWHITE.WORLD in monospace)
- Track label (e.g. SALES CONCIERGE · DEPT 01 or ECOSYSTEM · FOUNDER)
- Date / issue number (right-aligned)

```
JDWHITE.WORLD
TRACK LABEL                                      DATE
```

---

### C-02 — HEADLINE BLOCK

Used in: All emails

Contains:
- Optional: Portal badge (venture name pill)
- Main headline (Georgia serif, 24–28px)

Rules:
- One headline per email
- Under 10 words preferred
- Should stand alone — if you read only the headline, you know what happened

```
[VENTURE BADGE]

The headline goes here.
```

---

### C-03 — SIGNAL STATUS (Internal only)

Used in: Internal signals

Contains:
- Signal type label (NEW LEAD, BOOKING CONFIRMED, etc.)
- Urgency indicator (HIGH / MEDIUM / LOW with color dot)
- Source system (jdwhite.world · sales concierge)

```
● HIGH    NEW LEAD DETECTED
          Source: jdwhite.world · Sales Concierge
```

---

### C-04 — INFO CARD

Used in: Internal signals, transactional external

Contains: Key-value pairs for structured data

Rules:
- Max 6 rows
- Label in monospace uppercase (10px)
- Value in regular text (14–15px)
- Dark card background with subtle border

```
┌─────────────────────────────────────┐
│ NAME        John Smith              │
│ EMAIL       john@example.com        │
│ COMPANY     Acme Corp               │
│ PACKAGE     SCALE ($5,000+)         │
└─────────────────────────────────────┘
```

---

### C-05 — LEDE BLOCK

Used in: External signals (relational, founder)

A large serif statement — the opening line of the email.
Left-bordered with venture accent.

```
│ This is the opening statement of
│ the email. Bold. Direct. Sets tone.
```

---

### C-06 — BODY PARAGRAPH

Plain text paragraph. 15px, line-height 1.68.
Max 3 paragraphs per email unless explicitly a Founder Dispatch.

---

### C-07 — STEP BLOCK

Used in: Onboarding, process emails, confirmations

Numbered steps with monospace number and text.

```
01   First thing that happens.
02   Second thing that happens.
03   Third thing that happens.
```

---

### C-08 — NEXT ACTION BLOCK (Internal only)

Used in: All internal signals

The most important component. Answers: what should Jerry do right now?

Contains:
- Action label in monospace: RECOMMENDED ACTION
- Action statement: plain sentence
- Optional urgency note

```
RECOMMENDED ACTION
Reply to John within 24 hours.
This is a SCALE tier lead — highest priority.
```

---

### C-09 — SURFACE BLOCK

Used in: Supplementary context in any email

A subtle raised surface card for secondary information.
Slightly lighter than the card background, with border.

Used for: caveats, context, quoted answers, supporting details.

---

### C-10 — CTA BLOCK

Used in: All external emails (one per email)

Primary CTA: Full-width button with venture accent background.
Secondary CTA: Text link, no button styling.

Rules:
- One primary CTA per email
- Label is an action statement, not a noun
- Include an arrow → when it's a navigation action

```
[  Visit the ecosystem →  ]

Or text link: View your path →
```

---

### C-11 — FOUNDER SIGNATURE

Used in: Relational external emails

Personal sign-off. Italic name in Georgia serif, title in monospace.

```
— JD White
FOUNDER, JD PRODUCTIONS
```

---

### C-12 — DIVIDER

A 1px horizontal rule in border token color.
Use to separate major sections within an email body.
Max 2 dividers per email.

---

### C-13 — SHARED FOOTER

Used in: All emails

Contains:
- Unsubscribe link (if marketing)
- Privacy + Terms links
- Mailing address (CAN-SPAM)
- Ecosystem credit: TRANSMISSION FROM THE ECOSYSTEM

Rules:
- Font: monospace 10px
- Color: faint token
- Always present
- Never customized per email (consistency)

---

## 5. Email Categories and Flows

### WORK WITH ME

| ID | Name | Mode | Trigger | Key Components |
|---|---|---|---|---|
| WM-INT-01 | New Lead Signal | Internal | Form submitted | C-01, C-02, C-03(HIGH/MED/LOW), C-04, C-08 |
| WM-EXT-01 | Inquiry Confirmed | External/Transactional | Form submitted | C-01, C-02, C-05, C-07, C-10, C-11 |
| WM-EXT-02 | You're On My Radar | External/Relational | 24h no response | C-01, C-02, C-06, C-10, C-11 |
| WM-EXT-03 | Discovery Scheduled | External/Transactional | Meeting booked | C-01, C-02, C-07, C-09, C-11 |
| WM-EXT-04 | Proposal Sent | External/Transactional | Proposal delivered | C-01, C-02, C-06, C-10, C-11 |
| WM-EXT-05 | Strategic Follow-Up | External/Relational | 5d after proposal | C-01, C-02, C-06, C-10, C-11 |
| WM-EXT-06 | Project Accepted | External/Relational | Conversion confirmed | C-01, C-02, C-05, C-07, C-11 |

### NEWSLETTER / ECOSYSTEM

| ID | Name | Mode | Trigger | Key Components |
|---|---|---|---|---|
| NS-EXT-01 | Signal Received | External/Transactional | Subscriber signup | C-01, C-02, C-05, C-07, C-10, C-11 |
| NS-EXT-02 | Choose Your Path | External/Relational | 3d after NS-EXT-01 | C-01, C-02, C-06, C-10, C-11 |
| NS-EXT-03 | Founder Dispatch | External/Relational | Manual send | C-01, C-02, C-05, C-06, C-12, C-11 |
| NS-EXT-04 | Ecosystem Update | External/Informational | Monthly | C-01, C-02, C-06, C-10, C-11 |
| NS-EXT-05 | Launch Announcement | External/Informational | New venture/product | C-01, C-02, C-05, C-06, C-10 |

### COMMUNITY

| ID | Name | Mode | Trigger | Key Components |
|---|---|---|---|---|
| CM-EXT-01 | Invitation | External/Relational | Manual | C-01, C-02, C-05, C-10, C-11 |
| CM-EXT-02 | Early Access | External/Relational | Waitlist opened | C-01, C-02, C-05, C-07, C-10, C-11 |
| CM-EXT-03 | Event Announcement | External/Informational | Event created | C-01, C-02, C-06, C-09, C-10 |
| CM-EXT-04 | Project Reveal | External/Informational | Manual | C-01, C-02, C-05, C-06, C-10 |

### SYSTEM

| ID | Name | Mode | Trigger | Key Components |
|---|---|---|---|---|
| SY-EXT-01 | Email Preferences Confirmed | External/Transactional | Settings changed | C-01, C-02, C-06 |
| SY-EXT-02 | Unsubscribe Confirmed | External/Transactional | Unsubscribe event | C-01, C-02, C-06 |
| SY-EXT-03 | Account Update | External/Transactional | Profile changed | C-01, C-02, C-06, C-07 |

---

## 6. Subject Line Framework

### Internal Signals
Pattern: `[TYPE] — Name · Source · Context`

Rules:
- All caps signal type
- Em dash separator
- Name of person or system
- Venture or source system
- Never more than 60 characters

Examples:
```
NEW LEAD — Alex Chen · Sales Concierge · Scale
BOOKING — Sarah M. · White Lane · June 8 3PM
PAYMENT — $997 received · JD Productions
SUBSCRIBER — Marcus T. · Founder Dispatch
```

### External Transactional
Rules:
- Lowercase, conversational
- Specific to what happened
- No emoji
- Under 50 characters

Examples:
```
Your inquiry is in.
You're confirmed for June 8.
Your proposal is ready.
Signal received.
```

### External Relational / Newsletter
Rules:
- Short, curious, founder voice
- Should feel like a text message from someone you respect
- Never clickbait
- Never fake urgency

Examples:
```
I built something this week.
The system moved.
What I'm watching right now.
This is what we're building.
Here's the path.
Something is launching.
```

### Never Use
```
❌ "RE: Your inquiry"
❌ "You have a new message"
❌ "Don't miss this"
❌ "Open immediately"
❌ "Hi [First Name]," as subject line
❌ Emojis in subject lines
❌ ALL CAPS subject lines for external emails
```

---

## 7. CTA Framework

### Hierarchy
Every email has at most:
- 1 Primary CTA (button)
- 1 Secondary CTA (text link)

Never two buttons. Never three links. One direction per email.

### Primary CTA Rules
- Button with venture accent background
- Dark text on light accent / white text on dark accent
- Rounded: 7px
- Padding: 13px 24px
- Font: 14px, weight 600, system-ui
- Label ends with → when navigating to a destination
- Label ends with nothing when it's an action (e.g. "Confirm your spot")

### CTA Label Patterns

| Context | Pattern | Example |
|---|---|---|
| Navigation | Destination → | `Explore the ecosystem →` |
| Confirmation | Action statement | `Confirm your seat` |
| Discovery | Open invitation → | `See what we're building →` |
| Reply prompt | No button — plain text | "Just reply to this email." |
| Schedule | Action → | `Book your discovery call →` |

### Relational CTA Alternative
For Founder Dispatch and relational emails, a button can feel too transactional.

Instead: use a plain text reply prompt.

```
If any of this lands for you — reply. I read every one.

— JD White
```

---

## 8. Mobile-First Rules

### Layout
- Single column. Always.
- Max-width: 560px
- All padding via inline styles (not CSS classes — email clients strip them)
- No floats. No flexbox. Table-based layout only for email compatibility.

### Typography
- Body text minimum: 15px (smaller is illegible on mobile)
- Headline minimum: 22px
- Label text minimum: 10px
- Line-height body: 1.68 (breathing room)

### Touch Targets
- CTA button minimum height: 44px (Apple HIG standard)
- Tap area on links: padding 8px minimum vertically

### Images
- Never use images to convey critical information
- All signal lines, badges, and indicators built in HTML/CSS
- No background images (unreliable in email clients)
- If an image is used: include alt text, set fixed dimensions

### Test Matrix (before every new template goes live)
```
□ Gmail — iOS (iPhone 14+)
□ Gmail — Android
□ Apple Mail — iPhone
□ Gmail — Desktop web (Chrome)
□ Outlook — Desktop (if business clients expected)
□ Dark mode check (iOS Mail auto-invert)
```

---

## 9. Information Architecture Per Email

Before writing any email, define:

```
PURPOSE:          What is this email for? (one sentence)
TRIGGER:          What event caused this to send?
AUDIENCE:         Who receives this? (Jerry / subscribers / leads / clients)
MODE:             Internal Signal or External Signal?
REQUIRED INFO:    What data must be present?
PRIMARY CTA:      What is the single action the recipient should take?
EXPECTED OUTCOME: What should be true after they read this?
```

This must be answered before any design or copy is written.

---

## 10. Scalability Strategy

### Venture Inheritance Model

Every new venture inherits this system. To activate a venture's email identity:

1. Add venture to the `JDPVenture` or `JDWTrack` type registry
2. Register name, accent color, tagline in the venture constants
3. Add `VENTURE_EMAIL_FROM` to `.env.local` and Vercel
4. Verify sending domain in Resend
5. Build venture-specific templates using the shared component library

The layout files (`layout-jdw.ts`, `layout-jdp.ts`) are the shells.
The component functions are the vocabulary.
The design tokens are the voice.

A new venture should never need new layout architecture — only new copy and accent color.

### Template File Naming Convention

```
layout-{system}.ts            — Shell (layout only, no content)
{venture}-{email-id}.ts       — Content file (uses layout + components)
```

Examples:
```
layout-jdw.ts                 — JDWhite.world shell
layout-jdp.ts                 — JD Productions shell
jdw-wm-ext-01.ts              — Work With Me: inquiry confirmed
jdw-wm-int-01.ts              — Work With Me: new lead (internal)
jdw-ns-ext-01.ts              — Newsletter: signal received
```

### Adding a New Email Type

Checklist for any new email:
```
□ Defined in email categories table (this document)
□ Information architecture filled out
□ Components selected from library
□ Subject line written per framework
□ CTA defined
□ Mobile rules verified in design
□ Test email sent to jdevinwhite2@gmail.com
□ Logged in jdw_email_log with correct email_type
□ Added to proxy.ts public routes if public endpoint
```

### Future-Proofing

When the ecosystem expands to include:
- White Lane → same architecture, gold accent, booking/luxury tone
- Lil Dev → same architecture, purple accent, fan/community tone
- LINC → same architecture, gold accent, movement/dispatch tone
- Bridge Video → same architecture, near-white accent, client/production tone

None of these require rebuilding the system.
They require: new accent color, new voice guidelines, new FROM address.
Everything else inherits.

---

## 11. What Needs to Be Rebuilt

The current `layout-jdw.ts` captures the visual direction correctly.

Before Phase 2 email builds begin, the following should be updated to match this spec exactly:

### Internal Signal Template
Current `notifyFounder()` in `concierge/lead/route.ts` needs:
- [ ] C-03 Signal Status block (type label + urgency indicator)
- [ ] C-08 Next Action block ("Recommended action: Reply within X hours")
- [ ] Urgency color logic based on tier (SCALE = HIGH, GROW = MEDIUM, LAUNCH = LOW)

### External Confirmation Template
Current `confirmLead()` is close. Minor updates:
- [ ] Add C-03 equivalent: path indicator showing which tier they're on
- [ ] Tighten copy to 60 seconds

### Welcome Email (NS-EXT-01)
Current "Signal received." is close but needs:
- [ ] Path indicator (which source they came from)
- [ ] Cleaner step block using C-07

These are refinements, not rebuilds. The architecture is correct.
The copy and component precision needs to match this spec.

---

## Appendix: Quick Reference

### Which layout to use

| Venture | Layout file | Visual mode |
|---|---|---|
| jdwhite.world | layout-jdw.ts | Dark void, portal signal blue |
| JD Productions | layout-jdp.ts | Cream, editorial, navy accent |
| ACCESS platform | layout-finimize.ts | White, data-driven, teal accent |
| White Lane | layout-jdp.ts (variant) | Cream, gold accent |
| Bridge Video | layout-jdp.ts (variant) | Cream, near-white accent |
| Lil Dev | layout-jdp.ts (variant) | Cream, purple accent |
| LINC | layout-jdp.ts (variant) | Cream, gold accent |

### Internal vs External — Quick Decision

```
Is the recipient Jerry?              → MODE 1 (Internal Signal)
Is this triggered by a user action?  → MODE 2 (External Signal / Transactional)
Is this sent on a schedule?          → MODE 2 (External Signal / Relational)
Is this a one-off from Jerry?        → MODE 2 (External Signal / Founder)
```

### The One Rule

If someone reads this email and doesn't know what to do next, the email failed.
Every signal has a next step. Always.
