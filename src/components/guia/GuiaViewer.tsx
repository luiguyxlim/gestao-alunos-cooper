'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import GuiaToolbar from './GuiaToolbar'
import GuiaDownloadButton from './GuiaDownloadButton'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

type SearchMatch = {
  page: number
  preview: string
}

type ViewerStatus = 'loading' | 'ready' | 'error'
type LoadedDocument = Parameters<NonNullable<ComponentProps<typeof Document>['onLoadSuccess']>>[0]

const MIN_SCALE = 0.6
const MAX_SCALE = 2.4
const SCALE_STEP = 0.2
const PAGE_BATCH_SIZE = 4

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default function GuiaViewer() {
  const [status, setStatus] = useState<ViewerStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [numPages, setNumPages] = useState(0)
  const [renderedPages, setRenderedPages] = useState(PAGE_BATCH_SIZE)
  const [scale, setScale] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [matches, setMatches] = useState<SearchMatch[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [textByPage, setTextByPage] = useState<string[]>([])
  const [containerWidth, setContainerWidth] = useState(900)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setContainerWidth(entry.contentRect.width)
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const pageWidth = useMemo(() => {
    const width = Math.floor(containerWidth - 28)
    return Math.max(width, 280)
  }, [containerWidth])
  const normalizedQuery = useMemo(() => searchQuery.trim(), [searchQuery])
  const visiblePagesCount = useMemo(() => Math.min(renderedPages, numPages), [numPages, renderedPages])
  const documentOptions = useMemo(() => ({ withCredentials: true }), [])

  const runSearch = useCallback(
    (query: string) => {
      const normalized = query.trim().toLowerCase()
      if (!normalized) {
        setMatches([])
        setCurrentMatchIndex(0)
        return
      }

      const results: SearchMatch[] = []
      textByPage.forEach((content, index) => {
        const normalizedContent = content.toLowerCase()
        if (normalizedContent.includes(normalized)) {
          const start = Math.max(normalizedContent.indexOf(normalized) - 55, 0)
          const preview = content.slice(start, start + 160).trim()
          results.push({ page: index + 1, preview })
        }
      })

      setMatches(results)
      setCurrentMatchIndex(0)
    },
    [textByPage],
  )

  useEffect(() => {
    if (!searchQuery.trim() || textByPage.length === 0) return
    runSearch(searchQuery)
  }, [searchQuery, textByPage, runSearch])

  useEffect(() => {
    if (matches.length === 0) return
    const selectedMatch = matches[currentMatchIndex]
    if (!selectedMatch) return
    if (selectedMatch.page > renderedPages) {
      setRenderedPages(selectedMatch.page)
    }
    const pageElement = pageRefs.current[selectedMatch.page - 1]
    if (!pageElement) return
    pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentMatchIndex, matches, renderedPages])

  const handleViewerScroll = useCallback(() => {
    const element = containerRef.current
    if (!element) return
    const threshold = 320
    const nearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - threshold
    if (nearBottom) {
      setRenderedPages((current) => {
        if (current >= numPages) return current
        return Math.min(current + PAGE_BATCH_SIZE, numPages)
      })
    }
  }, [numPages])

  const highlightTextContent = useCallback(
    (value: string) => {
      const trimmed = normalizedQuery.trim()
      if (!trimmed) return escapeHtml(value)
      const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'gi')
      return escapeHtml(value).replace(regex, '<mark class="rounded bg-yellow-200 px-0.5">$1</mark>')
    },
    [normalizedQuery],
  )

  const handleDocumentLoadSuccess = async (loadedPdf: LoadedDocument) => {
    setStatus('ready')
    setErrorMessage('')
    setNumPages(loadedPdf.numPages)
    setRenderedPages(Math.min(PAGE_BATCH_SIZE, loadedPdf.numPages))
    setSearching(true)

    const collectedText: string[] = []
    for (let pageNumber = 1; pageNumber <= loadedPdf.numPages; pageNumber += 1) {
      try {
        const page = await loadedPdf.getPage(pageNumber)
        const textContent = await page.getTextContent()
        const text = textContent.items.map((item) => ('str' in item ? item.str || '' : '')).join(' ')
        collectedText.push(text)
      } catch {
        collectedText.push('')
      }
    }

    setTextByPage(collectedText)
    setSearching(false)
  }

  const handleDocumentLoadError = (error: Error) => {
    const lower = error.message.toLowerCase()
    if (lower.includes('401') || lower.includes('403')) {
      setErrorMessage('Sua sessão expirou. Recarregue a página e faça login novamente.')
    } else if (lower.includes('404')) {
      setErrorMessage('Não foi possível localizar o PDF do guia neste ambiente.')
    } else if (lower.includes('422')) {
      setErrorMessage('O PDF do guia está corrompido e não pode ser exibido.')
    } else {
      setErrorMessage('Não foi possível abrir o PDF. O arquivo pode estar indisponível ou corrompido.')
    }
    setStatus('error')
  }

  const handleSearchSubmit = () => {
    setSearching(true)
    runSearch(searchQuery)
    setSearching(false)
  }

  const handleNextMatch = () => {
    if (matches.length === 0) return
    setCurrentMatchIndex((current) => (current + 1) % matches.length)
  }

  const handlePreviousMatch = () => {
    if (matches.length === 0) return
    setCurrentMatchIndex((current) => (current - 1 + matches.length) % matches.length)
  }

  const handleRetry = () => {
    setStatus('loading')
    setErrorMessage('')
    setNumPages(0)
    setRenderedPages(PAGE_BATCH_SIZE)
    setTextByPage([])
    setMatches([])
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold sm:text-3xl">GUIA</h1>
        <p className="mt-1 text-sm text-indigo-100 sm:text-base">Visualize o documento completo, pesquise trechos e faça download seguro.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-9">
          <GuiaToolbar
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            onPreviousMatch={handlePreviousMatch}
            onNextMatch={handleNextMatch}
            currentMatchIndex={currentMatchIndex}
            totalMatches={matches.length}
            scale={scale}
            onZoomOut={() => setScale((value) => Math.max(value - SCALE_STEP, MIN_SCALE))}
            onZoomIn={() => setScale((value) => Math.min(value + SCALE_STEP, MAX_SCALE))}
            onZoomReset={() => setScale(1)}
            searching={searching}
            disabled={status !== 'ready'}
          />

          <div
            ref={containerRef}
            onScroll={handleViewerScroll}
            className="h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-slate-100 p-3 sm:p-4"
          >
            {status === 'error' ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg bg-white p-6 text-center">
                <p className="max-w-md text-sm text-red-600 sm:text-base">{errorMessage}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <Document
                file="/api/guia/download?inline=1"
                options={documentOptions}
                loading={<div className="rounded-lg bg-white p-6 text-sm text-gray-600">Carregando documento...</div>}
                onLoadSuccess={handleDocumentLoadSuccess}
                onLoadError={handleDocumentLoadError}
              >
                <div className="mb-3 rounded-md bg-white px-3 py-2 text-xs font-medium text-gray-600 sm:text-sm">
                  Exibindo {visiblePagesCount} de {numPages || 0} páginas
                </div>
                <div className="space-y-4">
                  {Array.from({ length: numPages }, (_, index) => index + 1).map((pageNumber) => (
                    <div
                      key={pageNumber}
                      ref={(element) => {
                        pageRefs.current[pageNumber - 1] = element
                      }}
                      className="rounded-md border border-gray-200 bg-white p-2 shadow-sm"
                    >
                      {pageNumber <= renderedPages ? (
                        <Page
                          pageNumber={pageNumber}
                          width={Math.floor(pageWidth * scale)}
                          renderAnnotationLayer
                          renderTextLayer
                          customTextRenderer={({ str }) => highlightTextContent(str)}
                          loading={<div className="p-4 text-sm text-gray-500">Renderizando página {pageNumber}...</div>}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRenderedPages((current) => Math.max(current, pageNumber))}
                          className="flex w-full items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-sm font-medium text-gray-600 hover:bg-gray-100"
                        >
                          Carregar página {pageNumber}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Document>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Download</h2>
            <p className="mt-1 text-sm text-gray-600">Baixe o arquivo original em PDF para consulta offline.</p>
            <div className="mt-3">
              <GuiaDownloadButton />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Resultados da busca</h2>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {matches.length === 0 ? (
                <p className="text-sm text-gray-500">Sem resultados para a busca atual.</p>
              ) : (
                matches.map((match, index) => (
                  <button
                    key={`${match.page}-${index}`}
                    type="button"
                    onClick={() => setCurrentMatchIndex(index)}
                    className={`w-full rounded-md border px-3 py-2 text-left text-xs sm:text-sm ${
                      index === currentMatchIndex
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-semibold">Página {match.page}</span>
                    <span className="mt-1 block truncate">{match.preview || 'Trecho encontrado.'}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
