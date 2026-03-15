'use client'

import { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface GuiaToolbarProps {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onSearchSubmit: () => void
  onPreviousMatch: () => void
  onNextMatch: () => void
  currentMatchIndex: number
  totalMatches: number
  scale: number
  onZoomOut: () => void
  onZoomIn: () => void
  onZoomReset: () => void
  searching: boolean
  disabled: boolean
}

export default function GuiaToolbar({
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  onPreviousMatch,
  onNextMatch,
  currentMatchIndex,
  totalMatches,
  scale,
  onZoomOut,
  onZoomIn,
  onZoomReset,
  searching,
  disabled,
}: GuiaToolbarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearchSubmit()
  }

  const percentage = Math.round(scale * 100)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onZoomOut} disabled={disabled || scale <= 0.6}>
          -
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onZoomIn} disabled={disabled || scale >= 2.4}>
          +
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onZoomReset} disabled={disabled}>
          Resetar
        </Button>
        <span className="text-sm font-medium text-gray-600">{percentage}%</span>
      </div>

      <form className="flex w-full flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Buscar texto no PDF"
          aria-label="Buscar texto no PDF"
          disabled={disabled}
        />
        <div className="flex items-center gap-2">
          <Button type="submit" variant="secondary" size="sm" disabled={disabled || searching}>
            {searching ? 'Buscando...' : 'Buscar'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onPreviousMatch} disabled={disabled || totalMatches === 0}>
            Anterior
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onNextMatch} disabled={disabled || totalMatches === 0}>
            Próximo
          </Button>
        </div>
      </form>

      <div className="text-sm text-gray-500" aria-live="polite">
        {totalMatches > 0 ? `${currentMatchIndex + 1} de ${totalMatches} resultados` : 'Sem resultados de busca'}
      </div>
    </div>
  )
}
