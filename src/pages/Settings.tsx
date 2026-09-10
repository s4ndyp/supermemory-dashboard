import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getConfig, saveConfig } from '../api'
import { btnPrimary, helper, input, label, sectionLabel } from '../ui'

export default function Settings() {
  const nav = useNavigate()
  const initial = getConfig()
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? '/api')
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? '')
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus({ msg: 'testing…', ok: true })
    saveConfig({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim() })
    try {
      await api('/v3/documents/list', { method: 'POST', body: JSON.stringify({ limit: 1 }) })
      setStatus({ msg: 'ok', ok: true })
      setTimeout(() => nav('/'), 400)
    } catch (err) {
      setStatus({ msg: (err as Error).message, ok: false })
    }
  }

  return (
    <div className="mx-auto max-w-xl animate-in fade-in-0 slide-in-from-bottom-2 space-y-6 duration-500">
      <div>
        <div className={sectionLabel}>Configuration</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight md:text-[28px]">
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-[--fg-3]">
          Point this dashboard at your self-hosted supermemory instance.
        </p>
      </div>

      <form onSubmit={onSubmit} className="neu-card space-y-5 p-6">
        <label className="block">
          <span className={label}>Backend URL</span>
          <input
            type="text" required value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="/api  (or  http://localhost:6767)"
            className={`${input} mt-2`}
          />
          <span className={helper}>
            Leave as <code className="mono text-[--fg]">/api</code> to route through the Vite dev proxy.
          </span>
        </label>
        <label className="block">
          <span className={label}>API key</span>
          <input
            type="password" required value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder="sm_..."
            className={`${input} mono mt-2`}
          />
          <span className={helper}>
            Printed on first <code className="mono text-[--fg]">npx supermemory local</code> boot.
          </span>
        </label>
        <div className="rounded-md border border-[--border] bg-white/[0.02] p-3 text-[11px] leading-[1.55] text-[--fg-3]">
          If the backend blocks CORS, keep the URL as <code className="mono text-[--fg]">/api</code> and set
          <code className="mono text-[--fg]"> VITE_BACKEND_URL </code>
          in <code className="mono text-[--fg]">.env.local</code>, then restart <code className="mono text-[--fg]">bun run dev</code>.
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className={btnPrimary}>Save & test</button>
          {status && (
            <span className={`text-[12px] ${status.ok ? 'text-[--accent-green]' : 'text-[--accent-orange]'}`}>
              {status.msg}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
