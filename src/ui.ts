/**
 * Class strings modelled after upstream `packages/ui/components/button.tsx`
 * variants (`newDefault`, `secondary`, `ghost`, `destructive`) + neumorphic
 * surface language.
 */

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[13px] font-medium transition-all duration-150 ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'

// Primary: dark neumorphic surface with subtle white bevel + blue accent text
// Matches upstream's `newDefault` — the actual primary button on brain-home.
export const btnPrimary = `${base} px-4 py-2 bg-[--surface] text-[--accent-blue] border border-[--border]
  shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.35)]
  hover:border-[--accent-blue]/50 hover:bg-[#1F252C]
  hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(75,160,250,0.18),0_8px_28px_-10px_rgba(75,160,250,0.55)]`

export const btnSecondary = `${base} px-3.5 py-2 bg-transparent text-[--fg-2] border border-[--border]
  hover:bg-white/[0.04] hover:text-[--fg] hover:border-white/[0.14]`

export const btnGhost = `${base} px-2 py-1 text-[--fg-3]
  hover:bg-white/[0.04] hover:text-[--fg]`

export const btnDestructive = `${base} px-3.5 py-1.5 bg-transparent text-[--accent-orange] border border-[--accent-orange]/40
  hover:bg-[--accent-orange]/10 hover:border-[--accent-orange]/70`

export const input =
  'w-full rounded-md border border-[--border] bg-[--input] px-3 py-2 text-[13px] text-[--fg] placeholder:text-[--fg-4] transition-colors duration-150 focus:border-[--accent-blue] focus:outline-none focus:ring-2 focus:ring-[--accent-blue]/30 disabled:opacity-50'

export const label = 'text-[13px] font-medium text-[--fg]'
export const helper = 'mt-1 block text-[11px] text-[--fg-3]'

export const sectionLabel =
  'text-[10px] font-semibold uppercase tracking-[0.12em] text-[--fg-3]'

export const badge =
  'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium'

export const chipNeutral = `${badge} bg-white/[0.05] text-[--fg-2]`
export const chipBlue = `${badge} bg-[--accent-blue]/10 text-[--accent-blue]`
export const chipGreen = `${badge} bg-[--accent-green]/12 text-[--accent-green]`
export const chipOrange = `${badge} bg-[--accent-orange]/12 text-[--accent-orange]`
export const chipPurple = `${badge} bg-[--accent-purple]/12 text-[--accent-purple]`

/** Map a document `type` string to its accent color group. */
export function typeAccent(type?: string | null): { chip: string; ring: string; text: string; bg: string } {
  const t = (type ?? '').toLowerCase()
  if (['url', 'link', 'webpage', 'web'].includes(t)) return { chip: chipOrange, ring: 'ring-[--accent-orange]/40', text: 'text-[--accent-orange]', bg: 'bg-[--accent-orange]/10' }
  if (['file', 'pdf', 'image', 'audio', 'video'].includes(t)) return { chip: chipPurple, ring: 'ring-[--accent-purple]/40', text: 'text-[--accent-purple]', bg: 'bg-[--accent-purple]/10' }
  return { chip: chipBlue, ring: 'ring-[--accent-blue]/40', text: 'text-[--accent-blue]', bg: 'bg-[--accent-blue]/10' }
}
