/**
 * ─────────────────────────────────────────────────────────────────────────
 * JD ECOSYSTEM IDENTITY — GENERATED FILE. DO NOT EDIT.
 * ─────────────────────────────────────────────────────────────────────────
 * Source of truth:  ecosystem/identity/identity.json
 * Regenerate with:  npm run identity:sync   (from the JD_Ai_System root)
 *
 * THE STACK
 *   JD Productions                 ← parent company
 *   └── JD AI Systems              ← the AI division
 *       └── JDAI                   ← the INTELLIGENCE LAYER (foundation)
 *           ├── JYSON   (the product / interface)
 *           ├── ACCESS  (the platform)
 *           ├── VAULT
 *           └── BUILDER
 *
 * ANALOGY (mental model — never print competitor names on the site):
 *   JDAI : JYSON :: OpenAI : ChatGPT :: Anthropic : Claude (mental model only — never print competitor names on-site)
 *
 * POSITIONING (non-negotiable):
 *   A system that does the work and stays in the workflow — not a talking toy.
 *   JYSON is the same CLASS of product as Claude / ChatGPT with the same
 *   capability — positioned as a working system, not a novelty chatbot.
 *   Copy asserts outcomes and durability; never write defensive "not a toy"
 *   language — show the opposite.
 */

export const COMPANY = {
  "parent": "JD Productions",
  "division": "JD AI Systems",
  "intelligenceLayer": "JDAI"
} as const

export const PRODUCT = {
  "name": "JYSON",
  "class": "AI product / interface",
  "tagline": "Discover. Structure. Deploy. Compound.",
  "oneLiner": "Turn what you already possess into systems that grow.",
  "meetStatement": "JYSON turns what you know, own, and build into systems that keep running long after the conversation ends.",
  "principle": "A system that does the work and stays in the workflow — not a talking toy."
} as const

export const ANALOGY = "JDAI : JYSON :: OpenAI : ChatGPT :: Anthropic : Claude (mental model only — never print competitor names on-site)"

export interface SystemNode {
  /** Display label (uppercase brand). */
  label: string
  /** One-line role within JDAI. */
  role: string
  /** True for the layer the current site IS. */
  current?: boolean
}

/** The four pillars that sit on the JDAI intelligence layer. */
export const JDAI_PILLARS: SystemNode[] = [
  { label: "JYSON", role: "The interface", current: true },
  { label: "ACCESS", role: "The platform" },
  { label: "VAULT", role: "What you hold" },
  { label: "BUILDER", role: "What you make" },
]

/** Other JD Productions ventures (not part of JDAI). */
export const SIBLING_VENTURES = [
  "Bridge Video",
  "The Collection",
  "Walking Paintbrush",
  "Future Ventures"
] as const
