# ACCESS Agent Boot

> **AI agents working in ACCESS OS (`access-app/`) start here.**  
> Full operating doctrine: [`docs/legacy-doctrine/ACCESS_AGENT.md`](docs/legacy-doctrine/ACCESS_AGENT.md)

---

## First reads (required)

1. **[`../JD_AI_SYSTEMS_CANONICAL_REGISTRY.md`](../JD_AI_SYSTEMS_CANONICAL_REGISTRY.md)** — canonical `product_id`, `provider_id`, and `service_id` values (source of truth; only five products)
2. **[`../../docs/JD_AI_SYSTEMS_OPERATOR_MANUAL.md`](../../docs/JD_AI_SYSTEMS_OPERATOR_MANUAL.md)** — operator runbooks, Command Center workflow, recovery procedures
3. **`docs/legacy-doctrine/ACCESS_AGENT.md`** — ACCESS doctrine and build rules
4. **`../ACCESS_WORKSPACE.md`** — monorepo layout; canonical app root is **`access-app/`** only
5. **`supabase/APPLY_ORDER.md`** — migration order before cloud changes

---

## Verify before you ship (ACCESS app root)

```bash
cd /Users/jdproductions/Documents/JD_Ai_System/access-app
npm run preflight
npm run registry:verify
npm run status-page:verify
npm run platform-health:verify
```

| Script | Purpose |
|--------|---------|
| `npm run preflight` | Correct working directory |
| `npm run registry:verify` | No forbidden IDs / unregistered `product:` literals |
| `npm run platform-health:verify` | Health classifier regression |
| `npm run platform:verify-m0` | Supabase platform schema (needs env) |

---

## Platform architecture references

| Doc | Topic |
|-----|--------|
| [`docs/M6_PLATFORM_DEPLOYMENT_ARCHITECTURE.md`](docs/M6_PLATFORM_DEPLOYMENT_ARCHITECTURE.md) | Multi-product deploy, Vercel, Supabase, packages |
| [`../JD_AI_SYSTEMS_COMMAND_CENTER_ARCHITECTURE.md`](../JD_AI_SYSTEMS_COMMAND_CENTER_ARCHITECTURE.md) | Command Center — recommendations & operator workflow (canonical) |
| [`../STATUS_PAGE_ARCHITECTURE.md`](../STATUS_PAGE_ARCHITECTURE.md) | Status pages — Operator / Developer / Consumer inherit from Command Center |
| [`docs/M5_COMMAND_CENTER_ARCHITECTURE.md`](docs/M5_COMMAND_CENTER_ARCHITECTURE.md) | M5 probes, persistence, alerts (implementation blueprint) |
| [`docs/JD_AI_SYSTEMS_HEALTH_ARCHITECTURE.md`](docs/JD_AI_SYSTEMS_HEALTH_ARCHITECTURE.md) | Platform health (M4) |

---

## Product IDs you may use in code

Only these (from canonical registry):

- `access_os`
- `jyson`
- `build`
- `vault`
- `jd_ai_systems_core`

**Never** use unregistered `product_id` values or paths named `access app/` — CI will fail `registry:verify`.
