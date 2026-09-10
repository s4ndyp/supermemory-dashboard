import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, type DocSummary } from '../api'
import { btnDestructive, btnGhost, btnPrimary, btnSecondary, chipBlue, chipGreen, chipNeutral, sectionLabel } from '../ui'

type Doc = DocSummary & Record<string, unknown> & {
  url?: string | null
  filepath?: string | null
}

const fmt = (v?: string) => (v ? new Date(v).toLocaleString() : '')

export default function Detail() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const [doc, setDoc] = useState<Doc | null>(null)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const confirmRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    api<Doc>(`/v3/documents/${encodeURIComponent(id)}`)
      .then((d) => { setDoc(d); setTitleDraft(d.title ?? '') })
      .catch((e) => setErr((e as Error).message))
  }, [id])

  async function saveTitle() {
    if (!doc) return
    setSaving(true)
    try {
      await api(`/v3/documents/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: titleDraft.trim() || null }),
      })
      setDoc({ ...doc, title: titleDraft.trim() || undefined })
      setEditing(false)
    } catch (e) { alert((e as Error).message) }
    finally { setSaving(false) }
  }

  async function copyId() {
    if (!id) return
    await navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  async function openFile() {
    try {
      const r = await api<{ url?: string }>(`/v3/documents/${encodeURIComponent(id)}/file-url`)
      if (r.url) window.open(r.url, '_blank', 'noopener')
      else alert('No file attached.')
    } catch (e) { alert((e as Error).message) }
  }

  async function doDelete() {
    try {
      await api(`/v3/documents/${encodeURIComponent(id)}`, { method: 'DELETE' })
      nav('/', { replace: true })
    } catch (e) { alert((e as Error).message); confirmRef.current?.close() }
  }

  const statusChip = doc?.status === 'done' ? chipGreen : doc?.status ? chipNeutral : ''
  const hasFile = doc?.filepath || (doc?.type && ['file','image','pdf','audio','video'].includes(String(doc.type)))

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 space-y-6 duration-500">
      <div className="flex items-center justify-between">
        <Link to="/" className={btnGhost}>← back</Link>
        <div className="flex items-center gap-2">
          <button type="button" onClick={copyId} className={btnSecondary}>
            {copied ? 'copied' : 'copy id'}
          </button>
          {doc?.url && (
            <a href={doc.url as string} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
              open source ↗
            </a>
          )}
          {hasFile && (
            <button type="button" onClick={openFile} className={btnSecondary}>
              open file ↗
            </button>
          )}
        </div>
      </div>

      {err && <div className="neu-card p-4 text-[13px] text-[--accent-orange]">{err}</div>}
      {!err && !doc && <p className="text-[13px] text-[--fg-3]">loading…</p>}
      {doc && (
        <>
          <div className="space-y-3">
            <div className={sectionLabel}>Memory</div>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditing(false) }}
                  className="w-full rounded-md border border-[--border] bg-[--input] px-3 py-2 text-[22px] font-semibold tracking-tight focus:border-[--accent-blue] focus:outline-none focus:ring-2 focus:ring-[--accent-blue]/30 md:text-[28px]"
                />
                <button onClick={saveTitle} disabled={saving} className={btnPrimary}>
                  {saving ? '…' : 'save'}
                </button>
                <button onClick={() => { setEditing(false); setTitleDraft(doc.title ?? '') }} className={btnSecondary}>
                  cancel
                </button>
              </div>
            ) : (
              <button
                type="button" onClick={() => setEditing(true)}
                className="group flex items-center gap-2 rounded-md text-left transition-colors hover:bg-white/[0.03]"
                title="Click to edit"
              >
                <h1 className="text-[22px] font-semibold tracking-tight md:text-[28px]">
                  {doc.title ?? doc.customId ?? doc.id ?? '(untitled)'}
                </h1>
                <span className="text-[11px] text-[--fg-4] opacity-0 transition-opacity group-hover:opacity-100">
                  edit
                </span>
              </button>
            )}
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[--fg-3]">
              {doc.id && <span className="mono">{doc.id}</span>}
              {doc.status && <span className={statusChip}>{doc.status}</span>}
              {doc.type && <span className={chipBlue}>{doc.type as string}</span>}
              <span>· {fmt(doc.createdAt)}</span>
            </div>
          </div>

          {doc.summary && (
            <div className="neu-card p-5">
              <div className={sectionLabel}>Summary</div>
              <p className="mt-2 text-[13px] leading-[1.55] text-[--fg]">{doc.summary}</p>
            </div>
          )}

          {doc.content && (
            <div className="neu-card p-5">
              <div className={sectionLabel}>Content</div>
              <pre className="custom-scrollbar mt-2 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words font-sans text-[13px] leading-[1.6] text-[--fg]">
                {doc.content}
              </pre>
            </div>
          )}

          <details className="neu-card p-5">
            <summary className={`${sectionLabel} cursor-pointer`}>Raw JSON</summary>
            <pre className="custom-scrollbar mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words text-[11px] leading-[1.55] text-[--fg-2]">
              {JSON.stringify(doc, null, 2)}
            </pre>
          </details>

          <button onClick={() => confirmRef.current?.showModal()} className={btnDestructive}>
            Delete
          </button>

          <dialog
            ref={confirmRef}
            className="w-[min(420px,92vw)] rounded-[20px] border border-[--border] bg-[--surface] p-6 text-[--fg] shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-[4px]"
          >
            <h2 className="text-[16px] font-semibold">Delete this memory?</h2>
            <p className="mt-2 text-[13px] text-[--fg-2]">
              This removes the document, its memories, and its chunks. Cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => confirmRef.current?.close()} className={btnSecondary}>
                Cancel
              </button>
              <button onClick={doDelete} className={btnDestructive}>
                Delete
              </button>
            </div>
          </dialog>
        </>
      )}
    </div>
  )
}
