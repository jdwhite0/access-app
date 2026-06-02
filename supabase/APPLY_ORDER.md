# Supabase apply order (required for M4)

Run each file in **Supabase Dashboard → SQL Editor** in this order:

1. `schema.sql`
2. `schema_v2.sql`
3. `schema_v3_vault.sql`
4. `schema_v4_platform_hardening.sql`
5. `schema_v4_m2_tenant_jwt.sql`

Then verify from the **ACCESS app root** (not monorepo root):

```bash
cd /Users/jdproductions/Documents/JD_Ai_System/access-app
npm run preflight
npm run platform:verify-m0
```

All entries must show `OK` with zero `missing`.

See [ACCESS_STRUCTURE.md](../ACCESS_STRUCTURE.md) for canonical paths.
