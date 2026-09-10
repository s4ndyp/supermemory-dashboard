# Supermemory Web UI — Investigation Context

Working clone: `/Users/anshsonkusare/code/tmp/supermemory-investigation/supermemory`
Target commit (the removal): `5258cb74c895c5297fbfff594935741aeb14a915` (2026-09-07, PR #1651)
Parent (last commit with full web UI): `4d8a4ebf`
Branch: `main` (fork of upstream `supermemoryai/supermemory`)

## Timeline

- **Before 5258cb74:** `apps/web` was a full Next.js 16 App Router dashboard (~85k lines). Alongside it, `apps/browser-extension` (~7k lines) captured memories from ChatGPT/Claude/Gemini/Grok/Twitter/T3.
- **5258cb74 "chore(web): reduce the app to a redirect shell, drop the browser extension":** `apps/web` collapsed into a redirect page. 308 forwards for `plugin/*`, `oauth/*`, `org/invite/*` to `console.supermemory.ai`. Browser extension deleted entirely.
- **After:** Only the hosted `console.supermemory.ai` (closed-source) is a real UI. The self-hosted binary ships with no bundled dashboard.

## Why it was removed — from the commit message

> app.supermemory.ai now forwards everything to the console… Docs and both READMEs now link to console.supermemory.ai for API keys. Removed the company-brain docs tab.

Not a security or licensing cleanup — a **product decision** to consolidate the SaaS UX in one hosted console. Removed code is still in git history.

## What was removed (pre-removal `apps/web` — findings from Agent 1)

**Stack:** Next.js 16 App Router, React 19, better-auth, Radix UI, Tailwind, Tiptap. TanStack Query + native `fetch` (no tRPC). Deployed to Cloudflare Workers via OpenNext. Sentry + PostHog.

**Routes:**
- `/` (brain-home) — memory grid + chat sidebar
- `/brain` — Slack + org selection entry
- `/onboarding` — multi-step setup (personal vs "company brain")
- `/connect` — OAuth grants management
- `/settings` — modal-based tabs (integrations / billing / account / API keys)
- `/integrations`, `/upgrade-mcp` — MCP setup UI
- `/oauth/consent` — third-party auth consent
- `/slack/link`, `/ref[/code]` — Slack + referrals
- `/login`, `/login/new` — auth entry

**Hosted-only couplings** (would need stripping for local self-host):
- Cloudflare Workers deploy target
- Turnstile CAPTCHA on login
- Stripe billing + auto-topups
- Loops (marketing email)
- Middleware rewrites `/auth/connect` → `console.supermemory.ai`
- Hardcoded `metadataBase: "https://app.supermemory.ai"`

**Env-driven, so overrideable:** `NEXT_PUBLIC_BACKEND_URL` (defaults `https://api.supermemory.ai`).

**Backend APIs the web app consumed** (REST, JSON):
- `/v3/documents` CRUD + `/v3/documents/batch` + `/v3/documents/file`
- `/v4/search`, `/v3/oauth/grants`, `/v3/projects`
- `/v3/auth/{keys,billing/*,account/*}`
- `/brain/slack/*`, `/brain/research/start`

**Browser extension:** WXT-based. Targeted twitter, chatgpt, claude, gemini, grok, t3. Injected save buttons + auto-search context; also bulk-imported Twitter bookmarks. Used the same bearer-token API with `/v3/documents`, `/v3/documents/batch`, `/v4/search`, `/v3/projects`.

## Current repo state (findings from Agent 2)

**Apps still in repo:** `apps/web` (redirect shell), `apps/docs`, `apps/mcp` (Cloudflare Worker), `apps/memory-graph-playground`, `apps/sdk-playground`, `apps/raycast-extension`.
**Not in repo:** No `apps/backend`, no `apps/console-web`. The console UI is hosted-only closed source. The self-hosted server is a **binary published separately** (source not in this repo).

**Self-hosted binary — real and usable:**
- Install: `curl -fsSL https://supermemory.ai/install | bash` or `npx supermemory local`
- Runs on `localhost:6767`, data in `./.supermemory`
- Default embeddings: `Xenova/bge-base-en-v1.5` (local, on-machine)
- LLM: user-provided — OpenAI, Anthropic, Gemini, Groq, **or any OpenAI-compatible endpoint including Ollama / vLLM / llama.cpp**
- API key printed at first boot, used as Bearer token
- Full `/v3` + `/v4` API available: documents CRUD, search, profile, file upload, settings, spaces, scoped keys

**Fork already has "local API key mode":**
- `packages/lib/dev-mode.ts` exports `isApiKeyMode` / `API_KEY` from `NEXT_PUBLIC_API_KEY`
- `apps/web/middleware.ts` skips all session auth when `NEXT_PUBLIC_API_KEY` is set
- Introduced in `62cabd6a`, preserved through the upstream merge in `d836a11c`
- **Meaning: the plumbing to point a UI at a local server with a static API key already exists in this fork.**

**Reusable UI packages still in monorepo:**
- `packages/ui` — Radix + Tailwind component library (~40 components)
- `packages/lib` — API client, auth context, hooks, queries
- `packages/tools` — published as `@supermemory/tools` on npm
- `packages/memory-graph` — graph viz component

## Gap analysis: self-hosted user's actual need

A self-hoster running `npx supermemory local` + Ollama today has:
- ✅ A working local API on `:6767`
- ✅ Bearer-token auth
- ✅ CLI + SDKs (`@supermemory/tools`, python SDK, etc.)
- ❌ **Any way to visually browse, search, or add memories**

Of the ~15 routes in the pre-removal `apps/web`, only a small subset actually matters to that user:
- Memory list/grid (from `brain-home`)
- Search UI (search + results)
- Add-document (file / link / note — the connections tab is hosted-only)
- Chat over memories (from `components/chat/*`)
- Simple settings: API key + backend URL

Everything else — Stripe billing, Turnstile, Loops, org invites, OAuth consent for third-party apps, referrals, Slack link, upgrade-mcp, integrations — is hosted-SaaS surface irrelevant to a local user.
