# supermemory-dashboard — design system

The look and feel we're targeting is what upstream `apps/web` shipped at commit
`4d8a4ebf` (parent of the removal commit `5258cb74`). This doc captures the
concrete decisions taken from that tree so this repo can copy them exactly
rather than reinvent them.

Source paths cited below are inside the upstream monorepo; we don't import
anything from them, we mirror the values.

---

## 1. Foundations

### 1.1 Font

Primary UI face: **DM Sans** (400 / 500 / 600 / 700).
Monospace: **DM Mono** (400 / 500).

Upstream `apps/web/app/layout.tsx` imports `Space_Grotesk` and sets `--font-sans`
to Space Grotesk in `packages/ui/globals.css`, but every actual widget on
brain-home uses two helpers `dmSansClassName()` / `dmSans125ClassName()` that
apply DM Sans with `tracking-[-0.01em]` and `leading-[135%]` (or `125%` for the
tighter variant). The commit message for `5258cb74` also confirms the brand
uses DM Sans ("DM Sans and the dot-grid backdrop from the brand").

Font application:

- Body default: DM Sans, 400/500, `tracking-[-0.01em]`, `leading-[135%]`.
- Tight variant: same face, `leading-[125%]` for stats/hero.
- All numeric readouts add `tabular-nums`.

Load via Google Fonts in `index.html`, not npm.

### 1.2 Color

Upstream defines oklch design tokens in `packages/ui/globals.css`, but nearly
every real widget uses a hardcoded hex palette. We do the same — the tokens
are theoretical; **the hexes are the product**.

Dark surfaces (background layers, darkest → lightest):

| Var | Hex | Use |
|---|---|---|
| `--bg` | `#05080D` | Page background |
| `--bg-elevated` | `#0A0E14` | Sticky header |
| `--surface` | `#1B1F24` | Card / modal / widget background |
| `--surface-2` | `#0F1217` | Nested icon wells, inline chips |
| `--input` | `#14161A` | Inputs, textareas |

Foreground / text:

| Var | Hex | Use |
|---|---|---|
| `--fg` | `#FAFAFA` | Primary text |
| `--fg-2` | `#A1A1AA` | Secondary text |
| `--fg-3` | `#737373` | Tertiary / labels |
| `--fg-4` | `#525D6E` | Very dim / captions |

Borders (translucent white, additive over dark surfaces):

| Var | Value | Use |
|---|---|---|
| `--border` | `rgba(255,255,255,0.08)` | Card outlines |
| `--border-subtle` | `rgba(255,255,255,0.04)` | Dividers |

Accents (used sparingly, mostly for state / status):

| Var | Hex | Use |
|---|---|---|
| `--accent-blue` | `#4BA0FA` | Primary CTAs, active tab, links, status dots |
| `--accent-orange` | `#FF8A47` | Warning, "down" deltas, syncing |
| `--accent-green` | `#10A37F` | Healthy status |
| `--accent-purple` | `#B19CFF` | Tertiary chart series |
| `--accent-blue-glow` | `rgba(75,160,250,0.35)` | Soft glow on FABs / primary orb |

### 1.3 Radius

Larger than shadcn defaults on purpose. Cards read as pillow-soft.

- Inputs, buttons, small chips: `rounded-md` (10 px).
- Cards, widgets: `rounded-[14px]` to `rounded-[16px]`.
- Modals / drawers: `rounded-[20px]` to `rounded-[22px]`.

### 1.4 Shadow — the neumorphic card

The signature Supermemory look. Applied inline via `style` in upstream
`components/brain-home/widgets.tsx` (`modalCardStyle` constant, referenced on
almost every card).

```
box-shadow:
  0 2.842px 14.211px 0 rgba(0, 0, 0, 0.25),
  0.711px 0.711px 0.711px 0 rgba(255, 255, 255, 0.10) inset;
```

The inset white line on the top-left edge is what makes the card look
carved-in on a dark surface. Exposed in this repo as the `.neu-card` utility
(see `src/index.css`).

### 1.5 Backdrop — the dot grid

The brand backdrop shown behind brain-home and the "moved" notice. Composed
of two layers:

- A radial-gradient dot pattern: `radial-gradient(circle at center, rgba(105,167,240,0.18) 1px, transparent 1px)` at `32px × 32px`.
- An elliptical mask fading edges: `mask-image: radial-gradient(ellipse at center, black 55%, transparent 100%)`.

Optionally paired with a large soft blue-glow ellipse on top:
`radial-gradient(ellipse 80% 60% at 50% 0%, rgba(75,160,250,0.08), rgba(34,97,202,0.04) 35%, transparent 70%)`.

Exposed as `.dot-grid` utility.

### 1.6 Backdrop blur

The sticky header uses `backdrop-blur-xl` over `bg-[--bg-elevated]/70`. Modal
overlays use `bg-black/50 backdrop-blur-[4px]`.

---

## 2. Layout

### 2.1 Global shell

From `apps/web/components/app-experience.tsx`:

- **Sticky top header** across all pages: logo + org name (left), nav / user
  menu (right). Height `h-14`, `p-2.5 md:p-3`. Backdrop-blurred.
- **Main content** below header: `mx-auto max-w-[1280px] px-4 md:px-6 py-6`,
  vertical stack `space-y-6`.
- **Bottom nav** appears only on `md:hidden`, fixed to `bottom-0`,
  `pb-[calc(4rem+env(safe-area-inset-bottom))]` reserved on `<main>` to avoid
  overlap.
- **Chat** is docked right (`lg:w-[340px]`) on desktop, full-screen route on
  mobile. Not scoped to this dashboard yet.

### 2.2 Brain-home layout

From `apps/web/components/brain-home/brain-home-view.tsx`:

- Container: `max-w-[1280px] mx-auto space-y-6`.
- **Stats strip**: 4 tiles in a `grid grid-cols-2 md:grid-cols-4` with
  `divide-y md:divide-y-0 md:divide-x divide-white/[0.04]`. Each tile shows a
  small caps label + a `text-[22px] font-semibold tabular-nums` value + a
  tiny delta indicator.
- **Two-column body** on `lg`:
  `grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6`.
  Left column stacks `space-y-8`, right column
  `lg:sticky lg:top-6 lg:self-start h-fit space-y-4`.

### 2.3 Container widths

- Global content: `max-w-[1280px]`.
- Reading columns (settings, single-form pages): `max-w-2xl` for text.
- Modal: `max-w-[1000px] h-[80%] max-h-[800px]`.

### 2.4 Spacing rules

- Section gap: `space-y-6`.
- Grid/flex gap: `gap-6` for cards, `gap-3` for inline chips/actions.
- Card interior padding: `p-4` (compact), `p-5` (default), `p-6` (roomy).
- Header interior: `p-2.5 md:p-3`.
- Mobile bottom padding for content: `pb-[calc(4rem+env(safe-area-inset-bottom))]`.

---

## 3. Typography scale

Observed exact classes across `apps/web/components/brain-home/*` and
`app-experience.tsx`:

| Role | Class |
|---|---|
| Page title (hero) | `text-[22px] md:text-[28px] font-semibold tracking-tight` |
| Section title | `text-[16px] font-semibold` |
| Card title | `text-[14px] font-semibold` |
| Body | `text-[13px] font-medium` |
| Small / meta | `text-[12px] font-medium text-[--fg-3]` |
| Caps label | `text-[10px] font-semibold uppercase tracking-[0.12em] text-[--fg-3]` |
| Stat number | `text-[22px] font-semibold text-[--fg] tabular-nums` |

Never rely on color alone for hierarchy — size + weight carry it.

---

## 4. Components

Component values from `packages/ui/components/*.tsx`. Where the base is minimal
we lift the on-page usage instead.

### 4.1 Buttons

CVA variants: `default`, `newDefault`, `destructive`, `outline`, `secondary`,
`ghost`, `link`, `headers`, `onboarding`, `linkPreview`, `insideOut`,
`settingsNav`. Sizes: `sm` (h-8), `default` (h-9), `lg` (h-10), `icon` (size-9).

For this dashboard we ship four:

- **Primary**: dark surface with inset light bevel + subtle blue glow on hover.
- **Secondary**: transparent, border, hover surface.
- **Ghost**: no border, hover accent bg.
- **Destructive**: red text, red-tint border, red-tint hover bg.

Base: `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50`.

### 4.2 Inputs / textareas

Border `border-[--border]`, bg `bg-[--input]`, focus ring
`focus-visible:border-[--accent-blue] focus-visible:ring-2 focus-visible:ring-[--accent-blue]/40`, disabled `opacity-50 cursor-not-allowed`.

### 4.3 Cards

`.neu-card` = base card. `bg-[--surface]`, `border border-[--border]`,
`rounded-[16px]`, `p-5`, and the neumorphic shadow above. Hover state:
`hover:border-[--accent-blue]/40` for interactive cards.

### 4.4 Tabs

Segmented pill: `bg-[--input] border border-[--border] rounded-md p-0.5`.
Trigger active: `bg-[--surface] shadow-sm` (no underline / no moving indicator).

### 4.5 Badges

Base: `inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium`.
Variants tied to accents: neutral (`bg-white/5 text-[--fg-2]`), blue
(`bg-[--accent-blue]/10 text-[--accent-blue]`), green
(`bg-[--accent-green]/10 text-[--accent-green]`).

### 4.6 Dialogs & drawers

Dialog overlay: `bg-black/50 backdrop-blur-[4px]`. Content:
`rounded-[22px] bg-[--surface] border border-[--border] max-w-[calc(100%-2rem)] w-[min(1000px,90vw)]`.
Close top-right, lucide `X` icon.

Drawer (mobile): drag-handle rectangle
`mx-auto mt-2.5 h-1.5 w-16 rounded-full bg-white/10`, content
`rounded-t-[22px] bg-[--surface] max-h-[85svh]`.

### 4.7 Toaster (Sonner)

`bg-[#0B1017] border border-[#1B1F24] rounded-[10px]`, title
`text-[12px] leading-[1.35] tracking-[-0.12px] font-medium text-[--fg]`,
close hover `hover:bg-white/10`.

Not shipped in v1 of this dashboard — add when we need feedback for
long-running actions.

### 4.8 Motion

Upstream uses the `motion` package (formerly framer-motion). Patterns:

- Page enter: `initial={{ opacity: 0, y: 10 }}` →
  `animate={{ opacity: 1, y: 0 }}`, duration `0.22s`, ease
  `[0.4, 0, 0.2, 1]`.
- Card list stagger: `AnimatePresence` around per-item `motion.div` with
  small delay index.

This dashboard uses CSS `animate-in fade-in-0 slide-in-from-bottom-2` via
`tw-animate-css` for now. Add the `motion` package if we start needing shared
enter/exit choreography.

---

## 5. Iconography

- Library: `lucide-react`. Stroke width 2. Sizes: `size-3` (status dot),
  `size-3.5` (feed item), `size-4` (button icon).
- Custom SVGs (Google Drive, Notion, Gmail, GitHub) live in
  `packages/ui/assets/icons.tsx` upstream. We inline them only if needed for
  connector chips — currently not.

---

## 6. Page-by-page apply plan

Order matches build order in `src/`:

1. **Shell** (`src/App.tsx`)
   - Sticky header: dot-glow logo, "supermemory" wordmark, nav (memories /
     graph / search / add / settings), user placeholder on right.
   - Backdrop-blur, `bg-[--bg-elevated]/70`, `border-b border-[--border]`.
   - `<main>` container `max-w-[1280px] px-4 md:px-6 py-6`.
   - Page background `bg-[--bg]` with `.dot-grid` overlay on the root.
2. **List** (`src/pages/List.tsx`)
   - Hero row: page title left, add button right.
   - Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`.
   - Each card: `.neu-card`, tight typography scale, container-tag chips at
     bottom.
3. **Search** — sticky search bar row (input + mode pill segmented) inside a
   `.neu-card` header. Result cards below same style as list cards.
4. **Add** — one `.neu-card` with tab strip (segmented), matches list card
   density.
5. **Detail** — back link (ghost), title, meta chip row, summary card,
   content card, JSON expander card, destructive delete button.
6. **Graph** — full-height `.neu-card` container hosting `<MemoryGraph>`.
7. **Settings** — one `.neu-card`, form with helper text under each field.

---

## 7. Open items (deliberately deferred)

- Chat panel — needs a chat/completion endpoint from the self-hosted binary.
  Docked-right on `lg`+, full-screen route on mobile.
- Bottom nav for mobile — `md:hidden fixed bottom-0` with the 5 primary
  actions + overflow. Ship after the desktop version is stable.
- Motion package — install only when a specific interaction demands it.
- Toaster — install only when we have long-running actions worth toasting.
