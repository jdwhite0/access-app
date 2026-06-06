# Supabase apply order (required for M4)

Run each file in **Supabase Dashboard → SQL Editor** in this order:

1. `schema.sql`
2. `schema_v2.sql`
3. `schema_v3_vault.sql`
4. `schema_v4_platform_hardening.sql`
5. `schema_v4_m2_tenant_jwt.sql`
6. `schema_v5_vaults_extended.sql`
7. `schema_v5_vault_files.sql`
8. `schema_v6_email_preferences.sql`
9. `schema_v7_email_agents.sql`
10. `schema_v8_vault_chunks_cloud.sql`
11. `schema_v9_revenue_agents.sql`  ← Revenue Agent System: pipeline CRM, quotas, ICP seeds, activity logs

Then verify from the **ACCESS app root** (not monorepo root):

```bash
cd /Users/jdproductions/Documents/JD_Ai_System/access-app
npm run preflight
npm run platform:verify-m0
```

All entries must show `OK` with zero `missing`.

See [ACCESS_STRUCTURE.md](../ACCESS_STRUCTURE.md) for canonical paths.
