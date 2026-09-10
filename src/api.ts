const CFG_KEY = 'supermemory-dashboard-cfg'

export type Config = { baseUrl: string; apiKey: string }

export function getConfig(): Config | null {
  try {
    const raw = localStorage.getItem(CFG_KEY)
    if (!raw) return null
    const c = JSON.parse(raw)
    if (c?.baseUrl && c?.apiKey) return c
    return null
  } catch { return null }
}

export function saveConfig(c: Config) {
  localStorage.setItem(CFG_KEY, JSON.stringify(c))
}

export async function api<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const c = getConfig()
  if (!c) throw new Error('Not configured. Open Settings and add backend URL + API key.')
  const url = c.baseUrl.replace(/\/$/, '') + path
  const headers: Record<string, string> = {
    Authorization: `Bearer ${c.apiKey}`,
    ...(opts.headers as Record<string, string> | undefined),
  }
  if (opts.body && !(opts.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(url, { ...opts, headers })
  const text = await res.text()
  let data: unknown = null
  if (text) { try { data = JSON.parse(text) } catch { data = text } }
  if (!res.ok) {
    const msg = typeof data === 'string'
      ? data
      : (data as { error?: string; message?: string } | null)?.error
        ?? (data as { message?: string } | null)?.message
        ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data as T
}

export type DocSummary = {
  id?: string
  customId?: string
  title?: string
  summary?: string
  content?: string
  status?: string
  type?: string
  createdAt?: string
  updatedAt?: string
  containerTags?: string[]
}

/** v3/v4 search response item. v3 puts matched text in chunks[]; v4 in chunk/memory/content. */
export type SearchResult = {
  id?: string           // chunk / memory id (v4)
  documentId?: string   // document id (v3)
  customId?: string
  title?: string
  type?: string         // v3: top-level; v4: inside documents[]
  content?: string
  chunk?: string        // v4 hybrid/documents mode
  summary?: string
  memory?: string       // v4 memories mode
  score?: number
  similarity?: number
  chunks?: Array<{      // v3: matched text segments
    content: string
    position?: number
    isRelevant?: boolean
    score?: number
  }>
  documents?: Array<{   // v4: parent docs
    id: string
    title?: string | null
    type?: string
    createdAt?: string
    updatedAt?: string
  }>
}

/** Resolve document id, display title, and type from a v3 or v4 search result. */
export function docFromSearchResult(r: SearchResult): { id: string; title: string; type?: string } {
  const parent = r.documents?.[0]
  const id = parent?.id ?? r.documentId ?? r.id ?? r.customId ?? ''
  const title = parent?.title ?? r.title ?? r.customId ?? id ?? '(untitled)'
  const type = parent?.type ?? r.type
  return { id, title, type }
}
