import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, FileText, Globe, Image as ImageIcon, Loader2, Plus, Type as TypeIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { api, type DocSummary } from '../api'
import { btnPrimary, btnSecondary, chipBlue, chipGreen, chipNeutral, sectionLabel, typeAccent } from '../ui'

type ListResp = {
  memories?: DocSummary[]
  documents?: DocSummary[]
  items?: DocSummary[]
  data?: DocSummary[]
  pagination?: { currentPage: number; limit: number; totalItems: number; totalPages: number }
}

function extractDocs(r: ListResp | DocSummary[]): DocSummary[] {
  if (Array.isArray(r)) return r
  return r.memories ?? r.documents ?? r.items ?? r.data ?? []
}

const fmt = (v?: string) =>
  v
    ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

function iconForType(type?: string | null): LucideIcon {
  const t = (type ?? '').toLowerCase()
  if (['url', 'link', 'webpage', 'web'].includes(t)) return Globe
  if (['image', 'photo'].includes(t)) return ImageIcon
  if (['file', 'pdf', 'audio', 'video'].includes(t)) return FileText
  return TypeIcon
}

const PAGE = 24

export default function List() {
  const [docs, setDocs] = useState<DocSummary[]>([])
  const [pagination, setPagination] = useState<ListResp['pagination'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [err, setErr] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const fetchPage = useCallback(
    async (page: number, append = false) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setErr('')
      try {
        const r = await api<ListResp>('/v3/documents/list', {
          method: 'POST',
          body: JSON.stringify({
            limit: PAGE,
            page,
            ...(tagFilter ? { containerTags: [tagFilter] } : {}),
          }),
        })
        const list = extractDocs(r)
        setPagination((r as ListResp).pagination ?? null)
        setDocs((prev) => (append ? [...prev, ...list] : list))
      } catch (e) { setErr((e as Error).message) }
      finally { setLoading(false); setLoadingMore(false) }
    },
    [tagFilter],
  )

  useEffect(() => { void fetchPage(1) }, [fetchPage])

  const knownTags = useMemo(() => {
    const set = new Set<string>()
    for (const d of docs) for (const t of d.containerTags ?? []) set.add(t)
    return [...set].sort()
  }, [docs])

  const hasMore = pagination != null && pagination.currentPage < pagination.totalPages
  const total = pagination?.totalItems ?? docs.length

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 space-y-6 duration-500">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className={sectionLabel}>Your memories</div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight md:text-[28px]">Recent</h1>
          <p className="mt-1 text-[12px] text-[--fg-3]">
            <span className="mono text-[--fg]">{docs.length}</span> of <span className="mono text-[--fg]">{total}</span> shown
            {tagFilter && <> · filtered by <span className={chipBlue}>{tagFilter}</span></>}
          </p>
        </div>
        <Link to="/add" className={btnPrimary}>
          <Plus className="size-4" /> Add memory
        </Link>
      </div>

      {knownTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={sectionLabel}>Tags</span>
          <button
            type="button" onClick={() => setTagFilter(null)}
            className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all duration-150 active:scale-[0.97] ${
              !tagFilter
                ? 'border-[--accent-blue]/50 bg-[--accent-blue]/10 text-[--accent-blue]'
                : 'border-[--border] text-[--fg-3] hover:text-[--fg] hover:border-white/[0.14]'
            }`}
          >all</button>
          {knownTags.map((t) => (
            <button
              key={t} type="button" onClick={() => setTagFilter(t)}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all duration-150 active:scale-[0.97] ${
                tagFilter === t
                  ? 'border-[--accent-blue]/50 bg-[--accent-blue]/10 text-[--accent-blue]'
                  : 'border-[--border] text-[--fg-3] hover:text-[--fg] hover:border-white/[0.14]'
              }`}
            >{t}</button>
          ))}
        </div>
      )}

      {err && <div className="neu-card p-4 text-[13px] text-[--accent-orange]">{err}</div>}

      {loading && docs.length === 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="neu-card h-40 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && docs.length === 0 && !err && (
        <div className="neu-card flex flex-col items-center gap-3 p-10 text-center">
          <div className={sectionLabel}>Empty</div>
          <p className="text-[13px] text-[--fg-2]">
            {tagFilter
              ? `No memories tagged "${tagFilter}".`
              : "You haven't ingested any memories yet."}
          </p>
          {!tagFilter && (
            <Link to="/add" className={btnPrimary}>
              <Plus className="size-4" /> Add your first
            </Link>
          )}
        </div>
      )}

      {docs.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((d, i) => {
              const id = d.id ?? d.customId ?? ''
              const title = d.title || d.customId || d.id || '(untitled)'
              const preview = (d.summary ?? d.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 420)
              const statusChip = d.status === 'done' ? chipGreen : d.status ? chipNeutral : ''
              const accent = typeAccent(d.type)
              const Icon = iconForType(d.type)
              return (
                <Link
                  key={id || i}
                  to={`/doc/${encodeURIComponent(id)}`}
                  className="neu-card group relative flex flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[--accent-blue]/40 animate-in fade-in-0 slide-in-from-bottom-1"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-md border border-[--border] ${accent.bg} ${accent.text}`}>
                      <Icon className="size-4" />
                    </div>
                    {d.status && <span className={statusChip}>{d.status}</span>}
                  </div>
                  <div>
                    <div className="line-clamp-2 text-[14px] font-semibold leading-[1.3] transition-colors group-hover:text-[--accent-blue]">
                      {title}
                    </div>
                    {preview ? (
                      <p className="mt-2 line-clamp-5 text-[12.5px] leading-[1.6] text-[--fg-2]">
                        {preview}
                      </p>
                    ) : (
                      <p className="mt-2 text-[12px] italic leading-[1.5] text-[--fg-4]">
                        No summary yet — click to view.
                      </p>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-[--border-subtle] pt-2.5 text-[11px] text-[--fg-3]">
                    <span className="mono uppercase tracking-[0.1em]">{d.type ?? 'text'}</span>
                    <div className="flex items-center gap-2">
                      <span>{fmt(d.createdAt)}</span>
                      <ArrowRight className="size-3.5 text-[--fg-4] transition-transform group-hover:translate-x-0.5 group-hover:text-[--accent-blue]" />
                    </div>
                  </div>
                  {d.containerTags && d.containerTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {d.containerTags.slice(0, 3).map((t) => (
                        <span key={t} className={chipBlue}>{t}</span>
                      ))}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => pagination && fetchPage(pagination.currentPage + 1, true)}
                disabled={loadingMore}
                className={btnSecondary}
              >
                {loadingMore ? <><Loader2 className="size-4 animate-spin" /> Loading…</> : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
