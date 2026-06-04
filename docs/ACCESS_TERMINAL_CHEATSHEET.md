# ACCESS app — Terminal cheat sheet

**Repo root (always `cd` here first):**
`/Users/jdproductions/Documents/JD_Ai_System/access-app`

---

## Every session

```bash
cd /Users/jdproductions/Documents/JD_Ai_System/access-app
```

```bash
npm run preflight
```

```bash
npm run dev
```

→ http://localhost:3000

---

## Daily dev

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

```bash
npm run build
```

```bash
npm run start
```

---

## OpenJarvis (local tools — founder)

Requires `.env.local`: `PRIVATE_JYSON_ENABLED=true`

```bash
npm run openjarvis:serve
```

```bash
curl -s http://localhost:8000/health
```

```bash
npm run connector:heartbeat
```

Full steps: `docs/DEVELOPER_GUIDE.md#openjarvis-local-setup`

---

## Environment check (no secrets printed)

```bash
npx tsx scripts/verify-local-env-once.ts
```

---

## Git (from repo root)

```bash
git status
```

```bash
git pull
```

```bash
git add -A && git commit -m "your message"
```

```bash
git push
```

---

## Vercel

```bash
vercel link --yes --project app --scope jd-white-s-projects
```

```bash
vercel env run -e production -- npm run dev
```

```bash
vercel deploy
```

---

## Connector (local vault / sync)

```bash
npm run connector:build
```

```bash
npm run connector:register
```

```bash
npm run connector:heartbeat
```

```bash
npm run connector:scan
```

```bash
npm run connector:sync-plan
```

```bash
npm run connector:sync-apply
```

```bash
npm run pairing:code
```

```bash
npm run sync:worker
```

---

## Verification / health

```bash
npm run platform:verify-m0
```

```bash
npm run platform-health:verify
```

```bash
npm run registry:verify
```

```bash
npm run status-page:verify
```

```bash
npm run m4:dry-run
```

```bash
npm run m4:validate
```

```bash
npm run e2e:m4
```

---

## JYSON / OpenJarvis

```bash
npm run jyson:verify-p10
```

```bash
npm run jyson:verify-m11
```

```bash
npm run openjarvis:verify-phase8
```

```bash
npm run openjarvis:verify-m9
```

```bash
npm run export-handle-context
```

---

## Founder / blueprint

```bash
npm run blueprint:test
```

```bash
npm run e2e:founder
```

---

## Supabase

Apply SQL in Supabase Dashboard → SQL Editor, in order:

`supabase/schema.sql` → v2 → v3 → v4 → v5 → v6 → v7

See `supabase/APPLY_ORDER.md`

---

## Key local URLs

| URL | What |
|-----|------|
| http://localhost:3000 | Home |
| http://localhost:3000/dashboard | Dashboard |
| http://localhost:3000/founder | Founder blueprint |
| http://localhost:3000/companion | JYSON |
| http://localhost:3000/settings | Settings |
| http://localhost:3000/terminal | Terminal |
| http://localhost:3000/status | Public status |

---

## Docs

- `DEVELOPER_GUIDE.md` — full dev setup
- `ACCESS_STRUCTURE.md` — folder map
- `supabase/APPLY_ORDER.md` — database migrations
