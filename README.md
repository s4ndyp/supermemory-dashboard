# supermemory-dashboard

> A local, open-source web UI for the [supermemory](https://github.com/supermemoryai/supermemory) self-hosted binary.
> Restores the dashboard that upstream removed in [PR #1651](https://github.com/supermemoryai/supermemory/pull/1651), scoped to what a single-user local install actually needs.

Upstream folded `apps/web` into a redirect shell that forwards users to their
closed-source hosted console. If you run `npx supermemory local` against a local
LLM (Ollama, vLLM, llama.cpp, or an OpenAI-compatible endpoint), you now have
an API on `localhost:6767` and no UI to explore it. This project is that UI.

## Features

- **Memories** — grid view with type-icons, container-tag filter chips, "Load more" pagination, per-card status.
- **Memory graph** — 2D force-directed graph via [`@supermemory/memory-graph`](https://www.npmjs.com/package/@supermemory/memory-graph); click a node to jump to its detail page.
- **Semantic search** — hits `/v4/search` with hybrid / memories / documents modes; result cards link to their parent document (not the chunk id).
- **⌘K palette** — global command bar; type to search memories, or pick a navigation shortcut. Native `<dialog>` for focus trap + ESC.
- **Add memory** — text, URL, or file upload (`multipart/form-data`), with optional `containerTag`.
- **Detail view** — inline title edit (`PATCH /v3/documents/:id`), copy-id, open-source-link and open-file-link buttons, raw-JSON expander, styled delete confirmation.
- **Settings** — backend URL + API key, stored in `localStorage`.
- **Design system** — mirrors upstream's DM Sans + neumorphic card language (see [`design.md`](./design.md)).
- **Zero framework backend** — pure client-side SPA, static-hostable, talks straight to the supermemory API.

## Quickstart

Prerequisites: [`bun`](https://bun.sh) (or `npm`) and a running supermemory instance
(`npx supermemory local` for a local server on `:6767`).

```bash
git clone https://github.com/Ansh-Sonkusare/supermemory-dashboard.git
cd supermemory-dashboard
bun install
cp .env.example .env.local        # edit if backend isn't localhost:6767
bun run dev
```

Open the URL Vite prints (default `http://localhost:5173`). First screen is
Settings: leave URL as `/api`, paste the API key that `supermemory local`
printed on first boot.

## Why the `/api` proxy?

The self-hosted binary does not send `Access-Control-Allow-Origin` headers, so
a browser at `localhost:5173` cannot make cross-origin fetches directly to
`localhost:6767`. The Vite dev server proxies `/api/*` to
`$VITE_BACKEND_URL`, making every call same-origin. Same trick works for
running the binary on a different machine — just point `VITE_BACKEND_URL`
there.

## Production build

```bash
bun run build      # → dist/
bun run preview    # local static preview
```

Ships as a plain static SPA. Put it behind a reverse proxy that forwards
`/api/*` to your supermemory instance. Example Caddy:

```caddy
dashboard.example.com {
    root * /path/to/dist
    file_server
    handle /api/* {
        uri strip_prefix /api
        reverse_proxy http://localhost:6767
    }
}
```

Cloudflare Pages, GitHub Pages, an nginx container, or `docker run -p 80:80 nginx` all work — the SPA is 400 kB / 120 kB gz.

## Stack

- **Vite 7** + **React 19** + **TypeScript 5.7** (strict).
- **Tailwind CSS 4** via `@tailwindcss/vite` — design tokens in `src/index.css`.
- **react-router-dom 7** with `HashRouter` (so it works without server rewrites).
- **`@supermemory/memory-graph`** for the graph canvas (pixi.js under the hood).
- **`lucide-react`** for icons. **`tw-animate-css`** for `animate-in` utilities.
- No shadcn, no tanstack-query, no zustand, no form library, no state manager.
  Every fetch is `fetch()` in `src/api.ts`; every route is `useState` + `useEffect`.

## Endpoints used

| Route | Method | Purpose |
|---|---|---|
| `/v3/documents/list` | POST | Paginated list on the main grid |
| `/v3/documents/documents` | POST | Docs + nested memories for the graph |
| `/v3/documents/:id` | GET / PATCH / DELETE | Detail view + inline edit + delete |
| `/v3/documents/:id/file-url` | GET | Presigned URL for uploaded files |
| `/v3/documents` | POST | Add text or URL |
| `/v3/documents/file` | POST | Add file (multipart) |
| `/v4/search` | POST | Hybrid / memories / documents search |

## Project layout

```
src/
├── App.tsx           Shell: sticky header, nav, ⌘K, dot-grid backdrop
├── main.tsx          HashRouter, route table
├── api.ts            fetch wrapper, config helpers, shared types
├── index.css         Design tokens, .neu-card, .dot-grid, DM Sans
├── ui.ts             Class strings for buttons, chips, section-labels
├── components/
│   └── CmdK.tsx      Global ⌘K palette (native <dialog>)
└── pages/
    ├── List.tsx      /            memory grid
    ├── Graph.tsx     /graph       memory graph
    ├── Search.tsx    /search      /v4/search
    ├── Add.tsx       /add         ingest text / URL / file
    ├── Detail.tsx    /doc/:id     detail + edit + delete
    └── Settings.tsx  /settings    backend URL + API key
```

## Design system

Full spec — palette, typography scale, neumorphic shadow, dot-grid backdrop,
component tokens — is in [`design.md`](./design.md). It documents exactly which
values were lifted from upstream `apps/web` at commit `4d8a4ebf` (the parent of
the removal commit `5258cb74`) so the visual language stays coherent as the
dashboard grows.

## What's deliberately out of scope

The upstream `apps/web` shipped ~85 000 lines. Most of it doesn't belong in a
single-user local dashboard, so it's not here:

- OAuth consent, org invites, referrals, Slack link, upgrade-MCP flow.
- Stripe billing, Turnstile CAPTCHA, Loops email, Cloudflare Workers deploy.
- Browser extension (ChatGPT / Claude / Gemini / Grok / Twitter capture).
- Chat panel with LLM — depends on which chat endpoint the self-hosted binary
  exposes; add when that's stable.
- Bulk delete, sort dropdowns, version history / chunks viewer, toast library.

See [`decisions.md`](./decisions.md) and [`context.md`](./context.md) for the
full "restore vs fork" reasoning.

## Contributing

Issues and PRs welcome. Keep the surface small — this project deliberately
avoids the SaaS-only pieces of upstream. If you're adding a feature, prefer:

1. Something the local `supermemory` binary already exposes.
2. The shortest working diff.
3. A change that lives inside one page file, not a new framework layer.

## License

MIT — see [`LICENSE`](./LICENSE).

## Credits

- [supermemory](https://github.com/supermemoryai/supermemory) — the API + binary this UI targets.
- [`@supermemory/memory-graph`](https://www.npmjs.com/package/@supermemory/memory-graph) — graph visualization.
- Design language lifted from upstream `apps/web` at commit
  [`4d8a4ebf`](https://github.com/supermemoryai/supermemory/commit/4d8a4ebf).
