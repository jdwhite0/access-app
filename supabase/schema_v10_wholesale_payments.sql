-- ─────────────────────────────────────────────────────────────────
-- SCHEMA V10 — Add Wholesale Payments arm to venture_icps
-- Run this in Supabase SQL editor to enable SCOUT-WP and REACH-WP agents
-- ─────────────────────────────────────────────────────────────────

INSERT INTO public.venture_icps (arm, display_name, offer_summary, icp_definition, deal_min, deal_max, sales_cycle_days, outreach_quota_daily, scout_quota_daily)
VALUES (
  'wholesale-payments',
  'Wholesale Payments',
  'Dual pricing program that eliminates credit card processing fees entirely. Businesses doing $100K/month go from $2,500/month in fees to $45 flat. Legal in all 50 states. $500 guarantee.',
  '{
    "targets": ["restaurants", "retail stores", "salons and spas", "auto shops", "gyms", "medical offices", "independent merchants"],
    "revenue_range": "$500K–$10M/year",
    "size": "small to mid-size brick-and-mortar businesses",
    "pain_points": ["high credit card processing fees", "fee burden on margins", "complex fee structures from current processor"],
    "geography": "Florida priority (Tampa Bay, Gulf Coast, Central FL), nationwide US",
    "positive_signals": ["brick-and-mortar storefront", "high transaction volume", "currently paying 2-3% processing fees", "not locked into long-term contract"],
    "disqualifiers": ["online-only businesses with no in-person transactions", "businesses already on dual pricing", "enterprise with dedicated payment operations team"],
    "scoring": {
      "brick_and_mortar_storefront": 2,
      "high_transaction_volume": 2,
      "contactable_email_visible": 2,
      "florida_location": 2,
      "independent_owner_operated": 2
    },
    "min_score": 7,
    "cta": "5-minute call to compare rates",
    "voice": "direct, numbers-focused — lead with the savings math"
  }'::jsonb,
  0, 500, 7, 75, 75
)
ON CONFLICT (arm) DO NOTHING;
