# Vault — your brain folder on this Mac

Your **vault** is the **brain folder** where you keep notes, priorities, and system context (for example JD Command Vault on your Mac). ACCESS treats it like a repo for GitHub — the source of truth JYSON reads. You choose the folder; ACCESS only reads what you connect.

## Multi-device model

ACCESS is built for every device, not only Mac. **Mac and PC** can pair a local bridge, pick a vault folder, and run **Sync now** from disk. **iPhone, iPad, and Android** use **cloud vault context** after a desktop sync — the Vaults page shows three layers (Device ↔ ACCESS, Vault, JYSON) with honest status per device. Mobile never promises local folder sync; production Vercel still requires a desktop bridge for indexing from disk.

## What runs automatically on your Mac

When you use ACCESS locally as a founder or builder:

1. **One command** — `npm run dev:founder` (alias `npm run dev:seamless`) starts:
   - the ACCESS web app (`next dev`),
   - OpenJarvis for live file tools,
   - a **local bridge** heartbeat loop so the connector stays “online” while that terminal is open.

2. **Sync now** — On the Vaults page, tap **Sync now**. In local development, if your vault path exists on this machine, sync can run even when the bridge is resting. Production (Vercel) still requires an active bridge for security.

3. **JYSON** — After sync, chat uses indexed excerpts from your vault (stored per your sync settings).

## What you do once (pairing)

The first time on a Mac, pair the local bridge so ACCESS knows this device:

```bash
cd access-app
npm run pairing:code          # creates a code in Supabase
npm run connector:register -- <CODE>
```

After pairing, starting `npm run dev:founder` is usually enough — no manual heartbeat loop in a second terminal.

## Regular user experience (target)

1. Open ACCESS on your Mac (desktop app or browser to localhost).
2. Vaults → connect your vault folder if needed.
3. Tap **Sync now** when you want fresh context.
4. Ask JYSON in Companion.

Terminal is for **first-time pairing** and **developers**; day-to-day sync should not require copying heartbeat commands.

## Disable local dev bypass

Set `ACCESS_DISABLE_LOCAL_DEV_VAULT_SYNC=true` in `.env.local` to force connector online even during `npm run dev`.

## See also

- [OPENJARVIS_FOUNDER_SETUP.md](./OPENJARVIS_FOUNDER_SETUP.md) — full local tool stack
- [INTELLIGENCE_LAYER_STATE.md](./INTELLIGENCE_LAYER_STATE.md) — vault cloud index and JYSON
