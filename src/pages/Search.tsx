import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, Search as SearchIcon } from 'lucide-react'
import { api, docFromSearchResult, type SearchResult } from '../api'
import { btnPrimary, chipBlue, input, sectionLabel, typeAccent } from '../ui'

type SearchResp =
  | { results?: SearchResult[]; matches?: SearchResult[]; documents?: SearchResult[]; total?: number; timing?: number }
  | SearchResult[]

function extract(r: SearchResp): SearchResult[] {
  if (Array.isArray(r)) return r
  return r.results ?? r.matches ?? r.documents ?? []
}

export default function Search() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [meta, setMeta] = useState<{ total?: number; timing?: number } | null>(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setResults(null); setMeta(null); setLoading(true)
    try {
      const r = await api<SearchResp>('/v3/search', {
        method: 'POST',
        body: JSON.stringify({ q, limit: 20 }),
      })
      setResults(extract(r))
      if (!Array.isArray(r)) setMeta({ total: r.total, timing: r.timing })
    } catch (e) { setErr((e as Error).message) }
    finally { setLoading(false) }
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 space-y-6 duration-500">
      <div>
        <div className={sectionLabel}>Recall</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight md:text-[28px]">Search</h1>
      </div>

      <form onSubmit={onSubmit} className="neu-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[--fg-4]" />
          <input
            type="text" required autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="What are you looking for?"
            className={`${input} pl-9`}
          />
        </div>
        <button type="submit" className={btnPrimary} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <><SearchIcon className="size-4" />Search</>}
        </button>
      </form>

      {meta && (
        <p className="text-[11px] text-[--fg-3]">
          <span className="mono text-[--fg]">{meta.total ?? results?.length ?? 0}</span> results
          {typeof meta.timing === 'number' && <> · <span className="mono">{meta.timing}ms</span></>}
        </p>
      )}

      {err && <div className="neu-card p-4 text-[13px] text-[--accent-orange]">{err}</div>}
      {results && results.length === 0 && !err && (
        <div className="neu-card p-8 text-center text-[13px] text-[--fg-3]">No results.</div>
      )}

      <div className="flex flex-col gap-3">
        {results && results.map((r, i) => {
          const { id, title, type } = docFromSearchResult(r)
          const snippet = r.memory ?? r.chunk ?? r.content ?? r.summary ?? r.chunks?.[0]?.content ?? ''
          const score = r.similarity ?? r.score
          const accent = typeAccent(type)
          return (
            <Link
              key={(id || 'x') + ':' + i}
              to={id ? `/doc/${encodeURIComponent(id)}` : '#'}
              className="neu-card group relative flex items-start gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[--accent-blue]/40"
              style={{
                animationDelay: `${Math.min(i * 40, 400)}ms`,
                animationFillMode: 'both',
              }}
            >
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${accent.bg} ${accent.text} text-[11px] font-semibold uppercase mono`}>
                {(type ?? 'mem').slice(0, 3)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <div className="line-clamp-1 text-[14px] font-semibold text-[--fg] group-hover:text-[--accent-blue]">
                    {title}
                  </div>
                  {typeof score === 'number' && (
                    <span className={`${chipBlue} mono ml-auto`}>{score.toFixed(3)}</span>
                  )}
                </div>
                {snippet && (
                  <p className="line-clamp-4 whitespace-pre-wrap text-[12.5px] leading-[1.65] text-[--fg-2]">
                    {snippet.replace(/\s+/g, ' ').trim().slice(0, 600)}
                  </p>
                )}
              </div>
              <ArrowRight className="size-4 shrink-0 self-center text-[--fg-4] transition-transform group-hover:translate-x-0.5 group-hover:text-[--accent-blue]" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
