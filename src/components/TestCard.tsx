'use client'

import Link from 'next/link'
import { deleteTest } from '@/lib/actions/tests'
import { useState } from 'react'
import TouchInteractions, { useHapticFeedback } from './TouchInteractions'

interface TestCardProps {
  test: {
    id: string
    test_date: string
    test_type: string
    notes?: string | null
    speed?: number | null
    agility?: number | null
    strength?: number | null
    endurance?: number | null
    flexibility?: number | null
    coordination?: number | null
    balance?: number | null
    power?: number | null
    reaction_time?: number | null
    vo2_max?: number | null
    evaluatees: {
      id: string
      name: string
    }
  }
}

export default function TestCard({ test }: TestCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const triggerHaptic = useHapticFeedback()
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getTestTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'physical': 'Físico',
      'technical': 'Técnico',
      'tactical': 'Tático',
      'psychological': 'Psicológico',
      'medical': 'Médico',
      'other': 'Outro'
    }
    return types[type] || type
  }

  const getMetricsCount = () => {
    const metrics = [test.speed, test.agility, test.strength, test.endurance, test.flexibility, test.coordination, test.balance, test.power, test.reaction_time, test.vo2_max]
    return metrics.filter(metric => metric !== null && metric !== undefined).length
  }

  const getAverageScore = () => {
    const metrics = [test.speed, test.agility, test.strength, test.endurance, test.flexibility, test.coordination, test.balance, test.power]
    const validMetrics = metrics.filter(metric => metric !== null && metric !== undefined) as number[]
    
    if (validMetrics.length === 0) return null
    
    const average = validMetrics.reduce((sum, metric) => sum + metric, 0) / validMetrics.length
    return Math.round(average * 100) / 100
  }

  const averageScore = getAverageScore()
  const metricsCount = getMetricsCount()

  const handleDelete = async () => {
    triggerHaptic('medium')
    if (confirm('Tem certeza que deseja excluir este teste?')) {
      setIsDeleting(true)
      try {
        await deleteTest(test.id)
        triggerHaptic('light')
      } catch (error) {
        console.error('Erro ao excluir teste:', error)
        alert('Erro ao excluir teste')
        triggerHaptic('heavy')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <TouchInteractions 
      className="bg-white shadow-sm rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-indigo-200"
      enableRipple={true}
      onSwipeLeft={() => {
        triggerHaptic('light')
        // Could implement quick delete on swipe
      }}
    >
      <div className="p-5 sm:p-7">
        {/* Header with test info and actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
          <div className="mb-3 sm:mb-0 flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {test.evaluatees?.name || 'Avaliando não encontrado'}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    test.test_type === 'physical' ? 'bg-blue-100 text-blue-800' :
                    test.test_type === 'technical' ? 'bg-purple-100 text-purple-800' :
                    test.test_type === 'tactical' ? 'bg-green-100 text-green-800' :
                    test.test_type === 'psychological' ? 'bg-yellow-100 text-yellow-800' :
                    test.test_type === 'medical' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getTestTypeLabel(test.test_type)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(test.test_date)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile-friendly action buttons */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/tests/${test.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-105"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a4 4 0 11-8 0 4 4 0 018 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Ver
            </Link>
            <Link
              href={`/tests/${test.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 hover:scale-105"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </Link>
          </div>
        </div>

        {/* Test metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Média Geral</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {averageScore !== null ? `${averageScore.toFixed(1)}` : 'N/A'}
                </p>
              </div>
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Métricas</p>
                <p className="text-2xl font-bold text-green-600">
                  {metricsCount}/10
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Observations */}
        {test.notes && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <p className="text-sm font-semibold text-gray-900">Observações</p>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 border border-gray-200">
              {test.notes}
            </p>
          </div>
        )}

        {/* Footer with additional actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-6 border-t border-gray-100 space-y-3 sm:space-y-0">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/evaluatees/${test.evaluatees.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-105"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Ver Avaliando
            </Link>
          </div>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </TouchInteractions>
  )
}