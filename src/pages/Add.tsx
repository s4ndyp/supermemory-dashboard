import { useState, useRef } from 'react'
import { api } from '../api'
import { btnPrimary, input, sectionLabel } from '../ui'

type Status = { msg: string; ok: boolean } | null

export default function Add() {
  const [tab, setTab] = useState<'text' | 'file'>('text')
  const [content, setContent] = useState('')
  const [containerTag, setContainerTag] = useState('')
  const [status, setStatus] = useState<Status>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function submitText(e: React.FormEvent) {
    e.preventDefault()
    setStatus({ msg: 'adding…', ok: true })
    try {
      const payload: Record<string, string> = { content }
      if (containerTag.trim()) payload.containerTag = containerTag.trim()
      const r = await api<{ id?: string; customId?: string }>('/v3/documents', {
        method: 'POST', body: JSON.stringify(payload),
      })
      setStatus({ msg: `queued · ${r.id ?? r.customId ?? 'ok'}`, ok: true })
      setContent('')
    } catch (e) { setStatus({ msg: (e as Error).message, ok: false }) }
  }

  async function submitFile(e: React.FormEvent) {
    e.preventDefault()
    const f = fileInput.current?.files?.[0]
    if (!f) return
    setStatus({ msg: 'uploading…', ok: true })
    try {
      const fd = new FormData()
      fd.append('file', f)
      if (containerTag.trim()) fd.append('containerTag', containerTag.trim())
      const r = await api<{ id?: string; customId?: string }>('/v3/documents/file', {
        method: 'POST', body: fd,
      })
      setStatus({ msg: `uploaded · ${r.id ?? r.customId ?? 'ok'}`, ok: true })
      if (fileInput.current) fileInput.current.value = ''
    } catch (e) { setStatus({ msg: (e as Error).message, ok: false }) }
  }

  const tabBtn = (t: 'text' | 'file', label: string) => (
    <button
      type="button" onClick={() => { setTab(t); setStatus(null) }}
      className={`rounded-sm px-3 py-1.5 text-[12px] font-medium transition-colors ${
        tab === t
          ? 'bg-[--surface] text-[--fg] shadow-sm'
          : 'text-[--fg-3] hover:text-[--fg]'
      }`}
    >{label}</button>
  )

  return (
    <div className="mx-auto max-w-2xl animate-in fade-in-0 slide-in-from-bottom-2 space-y-6 duration-500">
      <div>
        <div className={sectionLabel}>Ingest</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight md:text-[28px]">
          Add memory
        </h1>
        <p className="mt-1 text-[13px] text-[--fg-3]">
          Returns immediately with <code className="mono text-[--fg]">status: queued</code>.
        </p>
      </div>

      <div className="neu-card p-6">
        <div className="mb-5 inline-flex gap-0.5 rounded-md border border-[--border] bg-[--input] p-0.5">
          {tabBtn('text', 'Text / URL')}
          {tabBtn('file', 'File')}
        </div>

        {tab === 'text' ? (
          <form onSubmit={submitText} className="space-y-4">
            <textarea
              required rows={10} value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Paste text or a URL"
              className={`${input} resize-y`}
            />
            <input
              type="text" value={containerTag} onChange={(e) => setContainerTag(e.target.value)}
              placeholder="containerTag (optional, e.g. hermes)"
              className={input}
            />
            <div className="flex items-center gap-3">
              <button type="submit" className={btnPrimary}>Add</button>
              {status && (
                <span className={`text-[12px] ${status.ok ? 'text-[--accent-green]' : 'text-[--accent-orange]'}`}>
                  {status.msg}
                </span>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={submitFile} className="space-y-4">
            <input
              ref={fileInput} type="file" required
              className="block w-full rounded-md border border-[--border] bg-[--input] p-3 text-[13px] text-[--fg-2] file:mr-3 file:rounded-md file:border-0 file:bg-[--accent-blue] file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-[#04121F] hover:file:brightness-110"
            />
            <input
              type="text" value={containerTag} onChange={(e) => setContainerTag(e.target.value)}
              placeholder="containerTag (optional)"
              className={input}
            />
            <div className="flex items-center gap-3">
              <button type="submit" className={btnPrimary}>Upload</button>
              {status && (
                <span className={`text-[12px] ${status.ok ? 'text-[--accent-green]' : 'text-[--accent-orange]'}`}>
                  {status.msg}
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
