# Decisions Log

## D1 — Why the UI was removed

**Decision (upstream's, already made):** Consolidate all user-facing surface into hosted `console.supermemory.ai` (closed source). Reduce `apps/web` to a redirect. Remove the browser extension.

**Rationale (from commit message + code):** Product simplification, not a code-quality or security issue. The removed dashboard was already deeply wired to hosted-only services (Turnstile, Stripe, Loops, Cloudflare Workers, redirects to `console.supermemory.ai`), so it was practically a SaaS-only UI even before removal. The removal makes that intent explicit.

**Implication for us:** There is no upstream path back. Any restored/replacement UI is downstream-only work.

---

## D2 — Restore in place vs. build a separate open-source dashboard

**Options considered:**

- **A. Direct restore in the fork.** `git revert 5258cb74` (or cherry-pick pre-removal `apps/web` back), then keep pulling upstream.
- **B. Separate open-source dashboard project.** A new small Next.js app targeting the self-hosted binary's API on `localhost:6767`, ships as its own repo (or its own app in this monorepo), optional Docker image.

**Recommendation: B (separate project).**

**Why:**
1. **Upstream churn.** `apps/web` is on a path of active removal — every upstream release will delete more shared code the old UI referenced. Reverting sets up permanent merge conflicts. A separate app decouples us from that.
2. **~70% of the removed code is dead weight for self-hosters.** Stripe billing, Turnstile CAPTCHA, Loops email, org invites, OAuth consent (for granting third parties access to *your* memories via the hosted OAuth server), referrals, Slack link, upgrade-mcp, `/api/og`, `/api/emails/welcome` — none of these apply to a local user. Restoring them and gating them behind flags is more work than reimplementing the ~30% that matters.
3. **The needed API surface is small and stable.** `/v3/documents` CRUD, `/v3/documents/file`, `/v4/search`, `/v4/profile`, `/v3/settings`. That's it. A dashboard for those endpoints is a few hundred lines, not tens of thousands.
4. **The plumbing already exists in this fork.** `NEXT_PUBLIC_API_KEY` middleware mode (packages/lib/dev-mode.ts + apps/web/middleware.ts) was explicitly added and preserved for this exact scenario. Point a UI at `http://localhost:6767` with the binary's boot-time API key and you're done.
5. **Community wants this.** A permissively-licensed local dashboard for a self-hosted memory server + Ollama is genuinely missing in the ecosystem. Restoring the internal SaaS UI does not fill that gap; a purpose-built one does.

**What would flip this decision:**
- If the user's goal is *"I want the old UI back for my own use, not to open-source anything"* — then restore-in-fork is faster (one revert + strip Turnstile/Stripe branches + swap auth to API-key mode; maybe two days).
- If the supermemory team open-sources the console — then no third-party UI is needed and both options are moot.

---

## D3 — Scope of the separate dashboard (proposed MVP)

Minimum lovable version, in order of build effort:

1. **Config screen** — set backend URL (default `http://localhost:6767`) and API key. Store in localStorage. Ping `/v3/documents?limit=1` to verify.
2. **Memory list** — grid/list of documents from `GET /v3/documents`, with filters by space/project.
3. **Search** — form → `POST /v4/search`, display ranked results with snippets.
4. **Add memory** — 3 tabs: file upload (`POST /v3/documents/file`), URL, freeform note. All hit `POST /v3/documents`.
5. **Detail view** — `GET /v3/documents/{id}`, edit metadata, delete.

Explicitly out of MVP: chat, connectors, OAuth grants, billing, org/team, referrals, integrations page, MCP config, telemetry. Add later only if users ask.

**Tech choice:** Vite + React + Tailwind + shadcn/ui. Ships as a static SPA — dead simple to host (GitHub Pages, Cloudflare Pages, or a `docker run -p 3000:3000` static server) and CORS-only against the local API, so no server component to maintain. This avoids inheriting the Next.js + Cloudflare Workers + OpenNext build complexity of the deleted `apps/web`.

**Alternative tech considered:** Next.js SSR — rejected. Adds a server for no benefit when talking to a purely local API; harder to distribute; harder to embed inside the supermemory binary later if that becomes desired.

**Reuse from monorepo:** Copy (not depend-on) `packages/ui` components you need — cleaner separation, no monorepo entanglement. `@supermemory/tools` npm package for typed API calls if it covers the endpoints; otherwise a ~50-line typed `fetch` client.

**Repo layout:** Standalone repo (`supermemory-dashboard` or similar), MIT licensed, single-command dev (`bun dev`), single-command build (`bun run build`), publish a Docker image and a static build to GH releases.

---

## D4 — What NOT to do

- Don't try to keep the pre-removal `apps/web` in the fork *and* pull upstream — the fork already has an "API key mode" middleware patch that's a merge-conflict hotspot even in the current tiny redirect app; a full restored UI would be worse.
- Don't reimplement the browser extension yet. It's a separate ~7k-line project targeting six different LLM sites' DOMs, all of which change frequently. Ship the dashboard first; treat the extension as a v2 conversation.
- Don't port the OAuth consent flow, `/upgrade-mcp`, or `/slack/link`. These are hosted-service pieces (they authorize third parties against the hosted OAuth server), not local features.

---

## Answering the user's three asks directly

1. **Why is it missing?** Upstream PR #1651 (commit `5258cb74`, 2026-09-07) explicitly folded `apps/web` into a redirect to hosted `console.supermemory.ai`. Product consolidation into a hosted-only console. Details in `context.md`.

2. **Summary of the change:** ~89,685 lines deleted across 447 files. The removed UI was a full SaaS dashboard wired to hosted-only Turnstile/Stripe/Loops/Cloudflare and a separate hosted auth server, plus a browser extension for LLM sites. It was replaced with a 60-line `page.tsx` that shows a 5-second "moved" notice and 308-redirects specific paths.

3. **Decision:** Build a **separate open-source dashboard** (Option B in D2), scoped to the ~5-screen MVP in D3, targeting the self-hosted binary's `/v3` + `/v4` API on `localhost:6767`, using bearer-token auth. Do NOT revert 5258cb74 in place — the maintenance cost against ongoing upstream churn outweighs the benefit, and most of the removed code isn't useful to a local user anyway.
