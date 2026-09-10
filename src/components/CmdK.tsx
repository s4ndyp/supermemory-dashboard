import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, FileText, Network, Plus, Search as SearchIcon, Settings } from 'lucide-react'
import { api, docFromSearchResult, type SearchResult } from '../api'
import { chipBlue } from '../ui'

type SearchResp =
  | { results?: SearchResult[]; matches?: SearchResult[] }
  | SearchResult[]

const shortcuts = [
  { key: 'G', label: 'Go to graph', to: '/graph', icon: Network },
  { key: 'A', label: 'Add memory', to: '/add', icon: Plus },
  { key: 'S', label: 'Open settings', to: '/settings', icon: Settings },
  { key: 'H', label: 'Back to memories', to: '/', icon: FileText },
] as const

/** Global Cmd+K / Ctrl+K palette. Uses native <dialog> for focus trap + ESC. */
export default function CmdK() {
  const nav = useNavigate()
  const ref = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)

  const open = useCallback(() => {
    if (!ref.current?.open) {
      ref.current?.showModal()
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [])

  const close = useCallback(() => {
    ref.current?.close()
    setQ(''); setResults([]); setSelected(0)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (ref.current?.open) close()
        else open()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await api<SearchResp>('/v4/search', {
          method: 'POST',
          body: JSON.stringify({ q, searchMode: 'hybrid', limit: 8 }),
        })
        const list = Array.isArray(r) ? r : (r.results ?? r.matches ?? [])
        setResults(list); setSelected(0)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  const items: Array<{
    key: string
    label: string
    hint?: string
    icon?: typeof FileText
    kind: 'doc' | 'nav'
    onSelect: () => void
  }> = []

  results.forEach((r, i) => {
    const { id, title } = docFromSearchResult(r)
    if (!id) return
    items.push({
      key: `doc:${id}:${i}`,
      label: title,
      hint: (r.memory ?? r.chunk ?? r.content ?? '').slice(0, 90),
      icon: FileText,
      kind: 'doc',
      onSelect: () => { close(); nav(`/doc/${encodeURIComponent(id)}`) },
    })
  })

  if (!q.trim()) {
    shortcuts.forEach((s) =>
      items.push({
        key: `nav:${s.to}`,
        label: s.label,
        hint: s.key,
        icon: s.icon,
        kind: 'nav',
        onSelect: () => { close(); nav(s.to) },
      }),
    )
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); items[selected]?.onSelect() }
    else if (e.key === 'Escape') { close() }
  }

  return (
    <dialog
      ref={ref}
      onClose={close}
      className="fixed left-1/2 top-[15%] w-[min(640px,92vw)] -translate-x-1/2 overflow-hidden rounded-[22px] border border-[--border] bg-[--surface] p-0 text-[--fg] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop:bg-black/50 backdrop:backdrop-blur-[4px] open:animate-in open:fade-in-0 open:zoom-in-95 open:duration-200"
    >
      <div className="flex items-center gap-3 border-b border-[--border] p-3">
        <SearchIcon className="size-4 shrink-0 text-[--fg-4]" />
        <input
          ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onInputKey}
          placeholder="Search memories, or type a command…"
          className="w-full bg-transparent py-1 text-[15px] font-medium text-[--fg] placeholder:text-[--fg-4] focus:outline-none"
        />
        {loading && (
          <span className="text-[11px] text-[--fg-4]">searching…</span>
        )}
      </div>
      <div className="custom-scrollbar max-h-[60vh] overflow-y-auto p-1">
        {!loading && items.length === 0 && (
          <div className="px-3 py-8 text-center text-[12px] text-[--fg-3]">
            {q.trim() ? 'No matches.' : 'Start typing, or pick a shortcut.'}
          </div>
        )}
        {items.map((it, i) => {
          const Icon = it.icon ?? FileText
          const active = i === selected
          return (
            <button
              key={it.key}
              onMouseEnter={() => setSelected(i)}
              onClick={it.onSelect}
              className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
              }`}
            >
              <div className={`flex size-7 shrink-0 items-center justify-center rounded-md border border-[--border] ${
                it.kind === 'doc' ? 'bg-[--accent-blue]/10 text-[--accent-blue]' : 'bg-white/[0.03] text-[--fg-2]'
              }`}>
                <Icon className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-[13px] font-medium text-[--fg]">{it.label}</div>
                {it.hint && it.kind === 'doc' && (
                  <div className="line-clamp-1 text-[11px] text-[--fg-3]">{it.hint}</div>
                )}
              </div>
              {it.kind === 'doc' ? (
                <>
                  <span className={`${chipBlue} shrink-0`}>doc</span>
                  <ArrowRight className={`size-3.5 shrink-0 text-[--fg-4] transition-transform ${active ? 'translate-x-0.5 text-[--accent-blue]' : ''}`} />
                </>
              ) : (
                <span className="mono rounded border border-[--border] px-1.5 py-0.5 text-[10px] text-[--fg-3]">
                  {it.hint}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex items-center justify-between border-t border-[--border] px-3 py-2 text-[11px] text-[--fg-3]">
        <span>↑↓ navigate · ↵ open · esc close</span>
        <span className="mono">⌘K</span>
      </div>
    </dialog>
  )
}
