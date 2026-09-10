import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MemoryGraph,
  type GraphApiDocument,
  type GraphApiMemory,
  type MemoryRelation,
} from '@supermemory/memory-graph'
import { api } from '../api'
import { btnSecondary, input, sectionLabel } from '../ui'

type ApiMemory = {
  id: string
  memory?: string | null
  content?: string | null
  isStatic?: boolean
  spaceId?: string | null
  isLatest?: boolean
  isForgotten?: boolean
  forgetAfter?: string | null
  forgetReason?: string | null
  version?: number
  parentMemoryId?: string | null
  rootMemoryId?: string | null
  createdAt: string
  updatedAt: string
  relation?: MemoryRelation | null
  updatesMemoryId?: string | null
  nextVersionId?: string | null
  memoryRelations?: Record<string, MemoryRelation> | null
  spaceContainerTag?: string | null
}

type ApiDoc = {
  id: string
  title: string | null
  summary?: string | null
  documentType?: string
  type?: string
  containerTags?: string[]
  createdAt: string
  updatedAt: string
  memories?: ApiMemory[]
  memoryEntries?: ApiMemory[]
}

type DocsResp = {
  documents: ApiDoc[]
  pagination: { currentPage: number; limit: number; totalItems: number; totalPages: number }
}

const PAGE_SIZE = 200

function toGraphDocuments(docs: ApiDoc[]): GraphApiDocument[] {
  return docs.map((doc) => {
    const memories = doc.memories ?? doc.memoryEntries ?? []
    return {
      id: doc.id,
      title: doc.title,
      summary: doc.summary ?? null,
      documentType: doc.documentType ?? doc.type ?? 'unknown',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      memories: memories.map(
        (m): GraphApiMemory => ({
          id: m.id,
          memory: m.memory ?? m.content ?? '',
          isStatic: m.isStatic ?? false,
          spaceId: m.spaceId ?? '',
          isLatest: m.isLatest ?? true,
          isForgotten: m.isForgotten ?? false,
          forgetAfter: m.forgetAfter ?? null,
          forgetReason: m.forgetReason ?? null,
          version: m.version ?? 1,
          parentMemoryId: m.parentMemoryId ?? null,
          rootMemoryId: m.rootMemoryId ?? null,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          relation: m.relation ?? null,
          updatesMemoryId: m.updatesMemoryId ?? null,
          nextVersionId: m.nextVersionId ?? null,
          memoryRelations: m.memoryRelations ?? null,
          spaceContainerTag: m.spaceContainerTag ?? null,
        }),
      ),
    }
  })
}

export default function Graph() {
  const nav = useNavigate()
  const [documents, setDocuments] = useState<ApiDoc[]>([])
  const [pagination, setPagination] = useState<DocsResp['pagination'] | null>(null)
  const [containerTag, setContainerTag] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const selectedContainerTags = useMemo(() => {
    const t = containerTag.trim()
    return t ? [t] : undefined
  }, [containerTag])

  const fetchPage = useCallback(
    async (page: number, append = false) => {
      if (append) setIsLoadingMore(true)
      else setIsLoading(true)
      setError(null)
      try {
        const data = await api<DocsResp>('/v3/documents/documents', {
          method: 'POST',
          body: JSON.stringify({
            page,
            limit: PAGE_SIZE,
            sort: 'createdAt',
            order: 'desc',
            ...(selectedContainerTags ? { containerTags: selectedContainerTags } : {}),
          }),
        })
        setPagination(data.pagination)
        setDocuments((prev) => (append ? [...prev, ...data.documents] : data.documents))
      } catch (e) {
        setError(e as Error)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [selectedContainerTags],
  )

  useEffect(() => { void fetchPage(1) }, [fetchPage])

  const hasMore = pagination != null && pagination.currentPage < pagination.totalPages
  const handleLoadMore = useCallback(() => {
    if (!pagination || !hasMore) return
    void fetchPage(pagination.currentPage + 1, true)
  }, [fetchPage, hasMore, pagination])

  const graphDocuments = useMemo(() => toGraphDocuments(documents), [documents])
  const totalCount = pagination?.totalItems ?? documents.length

  return (
    <div className="flex h-[calc(100vh-7.5rem)] animate-in fade-in-0 slide-in-from-bottom-2 flex-col gap-4 duration-500">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className={sectionLabel}>Visualization</div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight md:text-[28px]">
            Memory graph
          </h1>
          <p className="mt-1 text-[12px] text-[--fg-3]">
            <span className="mono text-[--fg]">{documents.length}</span> / <span className="mono text-[--fg]">{totalCount}</span> documents
            {pagination && <> · page <span className="mono">{pagination.currentPage}</span>/<span className="mono">{pagination.totalPages}</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text" value={containerTag}
            onChange={(e) => setContainerTag(e.target.value)}
            onBlur={() => void fetchPage(1)}
            placeholder="filter by containerTag"
            className={`${input} w-56`}
          />
          <button
            type="button" className={btnSecondary}
            onClick={() => void fetchPage(1)}
            disabled={isLoading}
          >
            {isLoading ? 'Loading…' : 'Reload'}
          </button>
        </div>
      </div>

      <div className="neu-card relative flex-1 overflow-hidden">
        <MemoryGraph
          documents={graphDocuments}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={hasMore ? handleLoadMore : undefined}
          error={error}
          variant="consumer"
          totalCount={totalCount}
          onOpenDocument={(id) => nav(`/doc/${encodeURIComponent(id)}`)}
        >
          <div className="flex h-full items-center justify-center text-[13px] text-[--fg-3]">
            No memories to graph. Add some content first.
          </div>
        </MemoryGraph>
      </div>
    </div>
  )
}
