'use client'

import { useMemo, useState } from 'react'
import TestListItem from '@/components/TestListItem'
import type { PerformanceTestDetail } from '@/lib/types'

interface TestsListProps {
  tests: PerformanceTestDetail[]
}

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export default function TestsList({ tests }: TestsListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTests = useMemo(() => {
    if (!searchTerm) return tests

    const normalizedSearch = normalizeText(searchTerm)

    return tests.filter((test) => {
      const studentName = test.students?.name ?? ''
      return normalizeText(studentName).includes(normalizedSearch)
    })
  }, [tests, searchTerm])

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Buscar Avaliando</h2>
              <p className="text-sm text-gray-500">
                Filtre os testes digitando o nome do avaliando.
              </p>
            </div>
            <div className="w-full sm:max-w-md">
              <label htmlFor="tests-search" className="sr-only">
                Buscar por nome do avaliando
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35m0 0A6.5 6.5 0 1110.5 4a6.5 6.5 0 016.15 9.15z"
                    />
                  </svg>
                </div>
                <input
                  id="tests-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por nome do avaliando"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                />
              </div>
            </div>
          </div>
          {searchTerm && (
            <p className="mt-3 text-xs text-gray-400">
              {filteredTests.length} resultado{filteredTests.length === 1 ? '' : 's'} encontrado{filteredTests.length === 1 ? '' : 's'} para “{searchTerm}”.
            </p>
          )}
        </div>
      </div>

      {filteredTests.length === 0 ? (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500">
          Nenhum teste encontrado para o nome informado.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTests.map((test) => (
            <TestListItem key={test.id} test={test} />
          ))}
        </div>
      )}
    </div>
  )
}

