# Future JYSON Companion UI (document only)

P9 ships a **read-only companion shell**. Not implemented in P9:

- Chat or message history
- Prompt input
- Voice
- AI generation / LLM
- Dispatch execution
- Claude / Cursor routing
- External agents
- OpenJarvis-style open-ended interaction

Future: JYSON remains inside ACCESS as the intelligence layer that reads canonical context first, then routes when policy allows.

## P9 dev preview (local only)

`http://localhost:3000/companion?preview=fixture` loads `jdwhite.access` via `loadJysonContextFromAccessHandle()` without Clerk. Not available in production builds.

## P10 command layer (shipped)

Single intent input on `/companion` runs P7 `dispatch()` and shows `DispatchDecision` (intent, destination, confidence, allowed, reason). No chat history, LLM, or execution.
