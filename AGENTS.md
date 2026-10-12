# AGENTS
- vite.config.ts injects publishable backend URL/key fallbacks via `define`, because published builds may not receive .env and the app crashes on load without them.
