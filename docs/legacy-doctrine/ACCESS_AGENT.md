# ACCESS Agent Operating Doctrine

> **If you are an AI agent working in this repository, read this file first.**  
> This document defines how to think, build, propose, and document inside ACCESS.  
> Do not implement product changes until you understand the doctrine below.

**Canonical boot (paths + registry):** [`../../ACCESS_AGENT.md`](../../ACCESS_AGENT.md) at the `access-app/` root — read that before this file for M6+ platform IDs and verify commands.

**Repository:** `access-app/` (ACCESS OS — Identity & Gateway Layer, JD AI Systems)  
**Version:** 1.0  
**Status:** Source of truth for AI-assisted development doctrine (registry IDs: repo-root `JD_AI_SYSTEMS_CANONICAL_REGISTRY.md`)

---

## Agent Boot — First Actions

Before writing code or editing documentation:

1. Read [`../../ACCESS_AGENT.md`](../../ACCESS_AGENT.md) and [`../../../JD_AI_SYSTEMS_CANONICAL_REGISTRY.md`](../../../JD_AI_SYSTEMS_CANONICAL_REGISTRY.md).
2. Read this file (`ACCESS_AGENT.md`) in full.
3. Read `README.md` for product summary (if present).
4. Read `docs/doctrine/ACCESS_DOCTRINE_v1_0.md` — non-negotiable principles.
5. Identify your task type (vision / architecture / implementation / docs) and open the matching doc in `docs/`.
6. State your intent: what you will change, what you will not touch, and which doctrine principles apply.

If your task conflicts with doctrine, **stop and propose** — do not silently override.

---

## 1. What ACCESS Is

**ACCESS** is the **identity and gateway layer** of **JD AI Systems**.

Tagline: **Access to Your Digital World.**

ACCESS is:

- The **entry point** into a connected ecosystem of intelligence, systems, assets, workflows, and value
- The **ownership and orientation layer** — who the user is, what belongs to them, what connects, where things live
- The **registry** for identity, objects, and relationships
- A **place**, not a feature bundle — users establish presence and navigate a digital world

ACCESS is **not**:

- A social network
- A productivity app or task manager
- An AI chatbot or generic assistant UI
- Another SaaS dashboard
- A file manager disguised as innovation

**Canonical artifact:** an **ACCESS Identity** — e.g. `jdwhite.access` — representing persistent digital position, network presence, and root ownership in the ecosystem.

**Relationship to the cinematic portal:** The JD System landing page (`landing_page/index.html`) is a separate cinematic experience. The Access portal routes to the ACCESS application. Do not merge portal UX paradigms into ACCESS product architecture without explicit approval.

---

## 2. The Mission of ACCESS

**Mission (from doctrine):**  
To provide every person with a trusted place to establish **identity**, **ownership**, **connection**, and **orientation** within the digital world.

**Vision:**  
A future where every person has a persistent digital presence; where projects, systems, workflows, agents, assets, businesses, and knowledge connect through ownership; where value is not lost to fragmentation.

**User promise:**

- Know where you are.
- Know what is yours.
- Know what is connected.
- Build, own, and grow with confidence.

**Product principle:**  
There is something valuable behind the door. **ACCESS is the key.**

**Success metric (journey):**  
The user can say: *"I know where I am. I know what I own. I know what I am building. I know what comes next."*

---

## 3. The Problem ACCESS Solves

The modern internet is **fragmented**.

Users maintain dozens of applications, accounts, tools, subscriptions, databases, AI systems, and workflows. Typical consequences:

| Symptom | Impact |
|--------|--------|
| Scattered information | No single orientation |
| Disconnected knowledge | Context does not compound |
| Unclear ownership | Value does not persist across tools |
| Fragmented identity | No stable position in the digital world |

Most people do not have a **system**. They have a **collection of tools**.

ACCESS solves this by providing:

1. **Position** — a permanent ACCESS Identity (`*.access`)
2. **Ownership** — registry of what the user owns and who owns what
3. **Orientation** — Home, World, and Graph experiences that answer *where am I* and *what's next*
4. **Gateway** — unified entry into JYSON (intelligence), Vault (memory), and Builder (execution)

**Core insight:** Most people do not need more tools. They need **orientation**. ACCESS creates clarity before complexity.

---

## 4. Design Philosophy

All design and implementation decisions must reinforce these qualities.

### Product feel

ACCESS should always feel:

- **Simple** — reduce cognitive load
- **Clear** — every screen answers *you are here*
- **Useful** — orientation before features
- **Human** — trustworthy, not mechanical
- **Trustworthy** — ownership and privacy respected
- **Premium** — intentional, not template-driven

### Metaphors (use consistently)

| Metaphor | Meaning |
|----------|---------|
| **Gateway** | Entry into the ecosystem, not the whole product |
| **Place** | Users inhabit a world; they do not "use software" |
| **Map** | World Map organizes participation, not folders or chats |
| **Position** | Identity → position → navigation → opportunity |
| **Registry** | Ownership and relationships are first-class, not file paths |

### Navigation principle

Every screen should communicate:

1. You are here.
2. This belongs to you.
3. This is connected.
4. This is your next step.

Users are **not navigating software**. They are **navigating a digital world**.

### Emotional outcomes (priority order)

1. **Primary:** *"This belongs to me."*
2. **Secondary:** *"Everything I own is connected."*
3. **Tertiary:** *"I know where I am."*

### Anti-patterns (never introduce without approval)

- Generic SaaS dashboards, card grids, and sidebar app shells
- Chat-first UI as the primary ACCESS experience
- Feature sprawl before identity and registry exist
- Bright, saturated, template-driven visual systems
- Treating ACCESS as "another account" instead of a place
- Building JYSON, Vault, or Builder **inside** ACCESS as monolithic substitutes for layered architecture

### Core philosophy (value)

Everything begins with value. Humans discover, organize, and compound value. Technology assists — it does not replace ownership or orientation.

---

## 5. Architectural Principles

Architecture docs in `docs/architecture/` are binding for implementation. Summary:

### Layered ecosystem (do not collapse layers)

```
JD AI Systems
├── ACCESS    — Identity, ownership, registry, orientation
├── JYSON     — Intelligence, discovery, direction
├── Vault     — Preservation, memory, compounding
├── Builder   — Execution, deployment, creation
└── Network   — Connection, collaboration, reach
```

Each layer has a distinct responsibility. ACCESS does not absorb the others.

### Registry formula (foundational)

```
Identity
  ↓ owns
Objects
  ↓ connected through
Relationships
```

- **Identity** is the root ownership object (e.g. `jerry.access`).
- **Objects** include organizations, worlds, systems, projects, assets, workflows, agents, vault records, connections, offers, knowledge.
- **Relationships** link objects; the graph is generated from objects + relationships (no separate graph DB required for MVP).

### ACCESS responsibilities

ACCESS manages:

- Identity
- Ownership
- Registry
- Relationships
- Orientation UI (Home, World map concepts, Graph views)

ACCESS is the **source of truth** for what exists and who owns it.

### JYSON boundaries

JYSON may:

- Discover objects
- Suggest objects and relationships
- Recommend next actions
- Detect missing infrastructure

JYSON must **never** directly own registry objects. Ownership stays with ACCESS Identity.

### Database / object model (MVP)

Build on the object model first. Required MVP tables (see `ACCESS_DATABASE_SCHEMA_v1_0.md`):

- `identities`
- `organizations`
- `systems`
- `projects`
- `assets`
- `relationships`
- `knowledge_records`

**Rule:** Never build features that violate the object model, registry architecture, or doctrine.

### Graph (orientation, not decoration)

The ACCESS Graph exists so users see what exists, what belongs to them, what connects, what is missing, and what to build next — without mental tracking.

MVP graph support (see `ACCESS_GRAPH_ARCHITECTURE_v1_0.md`):

- Identity, project, system, asset nodes
- Ownership and relationship edges
- Simple graph view + list fallback
- Click-to-open detail; mobile-simplified view

### Platform areas (post-login)

When a user is inside ACCESS, canonical areas are:

| Area | Purpose |
|------|---------|
| **Home** | Orientation — where am I, what's active, what's next |
| **World** | Visibility — domains of participation (Business, Finance, Content, etc.) |
| **JYSON** | Intelligence — plan, discover, organize, guide |
| **Vault** | Memory — preserved knowledge and assets |
| **Builder** | Execution — projects, products, workflows, systems |
| **Network** | Connection — people, AI systems, opportunities |
| **Profile** | Identity settings, connected systems, preferences |

### Implementation order (recommended)

1. Identity gateway (auth + claim `*.access`)
2. Registry + MVP schema
3. Home orientation
4. Graph / registry views
5. Integrations (Vault, external tools) — incremental, read-only first where possible

### Authentication vs ownership

Authentication methods may change. **Ownership persists.** Design all persistence around identity and registry, not provider-specific IDs alone.

---

## 6. What Must Never Be Changed Without Approval

The following require **explicit human approval** before modification. Propose changes in writing; do not merge silently.

### Protected doctrine and vision

| Asset | Path | Why protected |
|-------|------|----------------|
| Doctrine | `docs/doctrine/ACCESS_DOCTRINE_v1_0.md` | Core beliefs: ownership, orientation, network |
| Product vision | `docs/vision/ACCESS_PRODUCT_VISION_V1_0.md` | Strategic north star |
| Ecosystem roles | `docs/ecosystem/JD_AI_Systems_Ecosystem_Architecture_v1 2.md` | Layer boundaries |

### Protected architecture contracts

| Asset | Path | Why protected |
|-------|------|----------------|
| Registry architecture | `docs/architecture/ACCESS_REGISTRY_ARCHITECTURE_v1_0.md` | Ownership model |
| Graph architecture | `docs/architecture/ACCESS_GRAPH_ARCHITECTURE_v1_0.md` | Orientation model |
| Database schema | `docs/architecture/ACCESS_DATABASE_SCHEMA_v1_0.md` | Object model |
| Information architecture | `docs/architecture/ACCESS_INFORMATION_ARCHITECTURE_V1_0.md` | Navigation contract |
| World map architecture | `docs/architecture/ACCESS_WORLD_MAP_ARCHITECTURE_v1_0.md` | Map metaphor |

### Protected concepts (even if implemented in code)

- **ACCESS is position, not tools** — repositioning as "another app suite" is a doctrine violation
- **Registry formula** — Identity → owns → Objects → Relationships
- **JYSON does not own objects** — intelligence layer ≠ ownership layer
- **ACCESS Identity format** — `username.access` as the user-facing identity pattern
- **Separation from cinematic portal** — `landing_page/index.html` and its portal system
- **MVP table set** — removing or renaming core tables without migration plan and approval

### Protected brand (coordinate with vision docs)

- `docs/vision/ACCESS_Brand_Identity_System_v1 2.md`
- `docs/vision/ACCESS_Brand_World_v1 2.md`

Do not drift brand voice or visual system without alignment to these documents.

### This file

`ACCESS_AGENT.md` — changes affect all future agents. Propose edits; do not rewrite casually.

### What agents MAY change without doctrine approval

- Implementation code (when it exists) that **implements** approved architecture
- New files under `docs/` with version suffixes (e.g. `_v1_1.md`) when documenting proposed changes
- ADRs, RFCs, or `docs/proposals/` drafts
- Tests, tooling, CI, and non-doctrine README clarifications
- Bug fixes that restore spec-compliant behavior

When in doubt: **propose, do not assume.**

---

## 7. How AI Agents Should Propose Features

Agents **implement** when the task is clear and within doctrine. Agents **propose** when the task changes product boundaries, doctrine, or architecture.

### Propose (required) when

- Adding a new platform area or removing one
- Changing ownership rules or registry object types
- Giving JYSON write access to own registry objects
- Replacing map/world metaphor with dashboard/file metaphors
- New third-party integrations that store user data outside ACCESS registry
- Breaking changes to identity format or MVP schema
- Major UI paradigm shifts (chat-first, social feed, etc.)

### Implement directly when

- Task is scoped to approved MVP (identity, registry tables, Home, graph list/view)
- Behavior is specified in existing architecture docs
- Change is a bug fix or spec compliance fix
- User explicitly approved the feature in the current session

### Proposal format

Create a file: `docs/proposals/YYYY-MM-DD_short-title.md`

```markdown
# Proposal: [Title]

## Status
Draft | Under review | Approved | Rejected

## Problem
[What user/orientation problem does this solve?]

## Doctrine alignment
[How does this reinforce ownership, orientation, or gateway role?]
[Any tension with doctrine? How resolved?]

## Architecture impact
- Layers affected: ACCESS | JYSON | Vault | Builder | Network
- Registry objects affected:
- Schema changes:
- Graph / IA changes:

## User outcome
[What should the user feel or be able to do?]

## MVP scope
[Minimum shippable slice]

## Out of scope
[Explicit deferrals]

## Alternatives considered
[至少 one alternative]

## Recommendation
[Agent recommendation: proceed / defer / reject]

## Approval
- [ ] Human approval required before implementation
```

After approval, update relevant architecture docs (new version file or approved amendment) **before** large implementation.

### Feature evaluation checklist

Before proposing or building, answer:

1. Does this make **position and ownership** clearer?
2. Does it belong in ACCESS, or in JYSON / Vault / Builder?
3. Does it add orientation or only add features?
4. Can it ship on the MVP object model?
5. Would a user say *"this belongs to me"* after using it?

If any answer fails, revise or defer.

---

## 8. How AI Agents Should Organize Files

This repository is the **documentation and application home** for ACCESS. Keep it navigable and version-disciplined.

### Directory structure (canonical)

```
access app/
├── ACCESS_AGENT.md          ← This file (agent entry point)
├── README.md                  ← Human-readable product overview
├── JYSON.md                   ← Intelligence layer reference (ecosystem)
├── prompts/
│   └── JYSON.md               ← Prompting context for JYSON (do not duplicate doctrine)
├── docs/
│   ├── doctrine/              ← Immutable beliefs (change rarely)
│   ├── vision/                ← Product vision, journey, platform map, brand
│   ├── architecture/          ← Registry, graph, schema, IA, world map
│   ├── ecosystem/             ← JD AI Systems-wide architecture
│   └── proposals/             ← Agent and human proposals (create as needed)
├── app/                       ← (Future) application source — framework TBD
├── packages/                  ← (Future) shared types, SDK, registry client
└── logs/                      ← (Future) session backups before major edits
```

### Naming conventions

| Type | Convention | Example |
|------|------------|---------|
| Doctrine / architecture | `ACCESS_<TOPIC>_v1_0.md` or existing version | `ACCESS_REGISTRY_ARCHITECTURE_v1_0.md` |
| Proposals | `YYYY-MM-DD_kebab-title.md` | `2026-06-01_identity-claim-flow.md` |
| Version bumps | New file with incremented version; retain old | `ACCESS_DOCTRINE_v1_1.md` |
| Implementation | Follow framework conventions once `app/` exists | — |

### File placement rules

| Content | Location |
|---------|----------|
| Non-negotiable beliefs | `docs/doctrine/` |
| What we're building and why | `docs/vision/` |
| How systems connect and persist | `docs/architecture/` |
| JD AI Systems-wide context | `docs/ecosystem/` |
| Pre-approval ideas | `docs/proposals/` |
| Runnable product | `app/` (or agreed monorepo path) |
| Agent instructions | Root `ACCESS_AGENT.md` only |

Do not scatter duplicate doctrine across `prompts/`, `README.md`, and architecture files. **Single source per concept** — link, do not copy.

### Code organization (when implementation begins)

- **Registry and identity** — core domain; no UI framework mixed into ownership logic
- **API / data layer** — implements `ACCESS_DATABASE_SCHEMA_v1_0.md`
- **UI** — reflects `ACCESS_INFORMATION_ARCHITECTURE_V1_0.md` and platform map
- **Integrations** — adapters; they read/write registry through ACCESS APIs, not bypass ownership

---

## 9. How AI Agents Should Update Documentation

Documentation in this repo **is** the product specification until code exists. Treat doc updates as seriously as code changes.

### Hierarchy of truth

1. `docs/doctrine/` — highest authority for *why*
2. `docs/architecture/` — highest authority for *how data and systems work*
3. `docs/vision/` — highest authority for *what users experience*
4. `README.md` — summary only; must stay aligned with doctrine
5. `ACCESS_AGENT.md` — how agents operate; update when process changes
6. Code — must implement architecture; if code diverges, fix code or approve doc change

### When to update docs

| Event | Action |
|-------|--------|
| Approved feature changes architecture | Add or bump version in `docs/architecture/` |
| Approved vision change | Add or bump version in `docs/vision/` |
| Process change for agents | Edit `ACCESS_AGENT.md` (with approval) |
| Implementation discovers spec gap | Open proposal; do not silently patch doctrine |
| Typo or clarity in README | Fix README; ensure no contradiction with doctrine |

### Versioning rules

- **Do not overwrite** `*_v1_0.md` files in place for material changes.
- Create `*_v1_1.md` (or next version) and note supersession at the top of the old file.
- Include at top of new doc: version, date, summary of changes, approval reference.

### Documentation style

- Complete sentences; professional tone
- Prefer tables and diagrams for structure
- State what ACCESS **is** and **is not** explicitly
- Link between docs instead of duplicating paragraphs
- Every new architecture section should tie back to **ownership** or **orientation**

### Backups

Before editing protected files (see Section 6), create a backup:

```
logs/backups/<filename>.backup-YYYY-MM-DD-HHMM
```

Create `logs/backups/` if it does not exist.

### Post-change agent report

After substantive work, leave a brief note in your session output (or `docs/proposals/` completion comment):

```
WHAT CHANGED:
FILES EDITED:
DOCTRINE / ARCHITECTURE ALIGNED: yes | no | proposal required
WHAT WAS VERIFIED:
NEXT BEST ACTION:
```

---

## 10. Ecosystem Relationships

Understanding how concepts connect prevents agents from building the wrong layer in the wrong place.

### Concept map

```
                    ┌─────────────────────────────────────┐
                    │         JD AI Systems               │
                    └─────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
    ┌──────────┐               ┌──────────┐               ┌──────────┐
    │  ACCESS  │◄── gateway ──►│  JYSON   │               │ Network  │
    │ Identity │               │Intellect │               │ Connect  │
    │ Registry │               └────┬─────┘               └──────────┘
    │ Ownership│                    │
    └────┬─────┘                    │ discovers / suggests
         │ owns                     │ (never owns)
         ▼                          ▼
    ┌─────────┐     preserves   ┌─────────┐     executes   ┌─────────┐
    │ Objects │◄───────────────►│  Vault  │◄────────────►│ Builder │
    │ + Rels  │                 │ Memory  │              │ Execute │
    └────┬────┘                 └─────────┘              └─────────┘
         │
         ▼
    ┌─────────┐
    │ Worlds  │  domains of participation (Finance, Creator, Business, …)
    └─────────┘
```

### ACCESS (Identity + Gateway + Registry)

- **Identity:** persistent `*.access` ID; root of ownership tree
- **Registry:** canonical record of objects and who owns them
- **Ownership:** if value is discovered, built, deployed, or compounded — ACCESS records and preserves ownership association
- **Gateway:** single entry; "GET ACCESS" / "OPEN ACCESS" — not the entire product surface

**ACCESS answers:** Who am I? What belongs to me? What is connected? Where does everything live?

### JYSON (Intelligence Layer)

- Orchestrates thinking, planning, discovery, organization, connection, execution guidance
- Activated **after** identity exists (user journey: claim identity → activate JYSON)
- Reduces complexity while increasing clarity
- **Does not replace ACCESS** — amplifies human intelligence within an owned position

**JYSON answers:** What should I discover? What should I build? How should I organize? What connects to what opportunity?

Reference: `JYSON.md`, `prompts/JYSON.md`

### Worlds (Domains of Participation)

- **Not** separate products — **domains** the user navigates inside the World experience
- Examples: Finance World, Creator World, Business World, Knowledge World, AI World
- Registered and visible through ACCESS; participation may span multiple worlds
- World Map architecture: user sees participation and gaps, not a folder tree

**Worlds answer:** What areas of life and work am I participating in? What should I explore next?

### Vault (Knowledge Layer)

- Permanent memory: documentation, notes, systems knowledge, preserved assets
- Compounds value over time; preserves what matters
- Integrates with registry via **knowledge_records** and relationships
- Graph shows how preserved knowledge connects to systems and future value

**Vault answers:** What should be remembered? What history and knowledge persist?

*Note:* JD Command Vault in the wider JD AI System is an operational instance of vault thinking — integrations must respect ACCESS ownership model, not bypass it.

### Builder (Execution Layer)

- Creates and deploys: projects, products, workflows, businesses, systems
- Converts ideas into assets; connects discovery to execution
- Writes through ACCESS registry (projects, systems, assets) — does not invent a parallel ownership store

**Builder answers:** What am I building? What ships? What executes?

### Identity

- One per user (with org extensions later): `username.access`
- Survives auth provider changes
- Appears on Home and Profile; anchors graph root node
- **Identity → position → navigation → opportunity**

### Registry

- Implementation of ownership + relationships at scale
- Everything important should be **registerable**
- Not a file store — an **ownership and context** system
- Source of truth for APIs, agents, and UI

### Ownership

- Primary function of ACCESS
- Persistent association between Identity and Objects
- Enables emotional outcome: *"This belongs to me."*
- Enables compounding: assets and systems remain connected to the owner over time

### Interaction summary table

| Concept | Layer | Owns data? | Primary question |
|---------|-------|------------|------------------|
| ACCESS Identity | ACCESS | Root owner | Who am I? |
| Registry | ACCESS | Yes (canonical) | What is mine and connected? |
| Ownership | ACCESS | Rules | Does this belong to me? |
| Worlds | ACCESS (view/domain) | Participates | Where am I participating? |
| JYSON | Intelligence | No | What next? How organize? |
| Vault | Memory | Preserves records | What must be remembered? |
| Builder | Execution | Creates via registry | What gets built? |
| Graph | ACCESS (view) | Displays registry | What connects? What's missing? |

### Chain of value (operating sequence)

```
Discover ACCESS → Claim Identity → Activate JYSON →
Register objects (projects, systems, assets) →
Connect tools → Preserve in Vault → Execute in Builder →
Compound ownership over time
```

---

## Quick Reference — Agent Do / Don't

### Do

- Read doctrine and relevant architecture before coding
- Preserve ownership and orientation in every feature
- Propose cross-layer or doctrine changes in `docs/proposals/`
- Version documentation; backup protected files
- Keep ACCESS thin: gateway + registry + orientation
- Ask: *Does this help the user know where they are and what is theirs?*

### Don't

- Turn ACCESS into a chatbot-first product
- Let JYSON own registry objects
- Add features before identity and registry MVP exist
- Edit doctrine/architecture v1_0 files without approval and versioning
- Merge cinematic portal patterns into ACCESS app UX
- Duplicate doctrine across many files
- Ship generic SaaS UI that contradicts map/place metaphor

---

## Related Documents (Read by Task)

| Task | Read first |
|------|------------|
| Any work | `ACCESS_AGENT.md` (this file), `README.md`, `ACCESS_DOCTRINE_v1_0.md` |
| UX / navigation | `ACCESS_INFORMATION_ARCHITECTURE_V1_0.md`, `ACCESS_PLATFORM_MAP_V1_0.md` |
| Data / API | `ACCESS_DATABASE_SCHEMA_v1_0.md`, `ACCESS_REGISTRY_ARCHITECTURE_v1_0.md` |
| Graph UI | `ACCESS_GRAPH_ARCHITECTURE_v1_0.md` |
| World experience | `ACCESS_WORLD_MAP_ARCHITECTURE_v1_0.md` |
| Onboarding | `ACCESS_USER_JOURNEY_V1_0.md`, `ACCESS_PRODUCT_VISION_V1_0.md` |
| JYSON behavior | `JYSON.md` |
| Ecosystem context | `JD_AI_Systems_Ecosystem_Architecture_v1 2.md` |

---

## Final Principle

People are not seeking another account.

People are seeking a place.

**ACCESS is that place.**  
Agents exist to help build it faithfully — with ownership clear, orientation first, and the gateway worthy of what lies behind it.

---

*End of ACCESS Agent Operating Doctrine v1.0*
