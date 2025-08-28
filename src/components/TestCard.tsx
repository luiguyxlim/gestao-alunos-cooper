'use client'

import Link from 'next/link'
import { deleteTest } from '@/lib/actions/tests'
import { useState, memo } from 'react'
import TouchInteractions, { useHapticFeedback } from './TouchInteractions'

import ConfirmModal from './ConfirmModal'

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
    cooper_test_distance?: number | null
    evaluatees: {
      id: string
      name: string
    }
  }
}

function TestCard({ test }: TestCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const triggerHaptic = useHapticFeedback()
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getTestTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'cooper_vo2': 'Cooper VO2 (Teste de 12 minutos)',
      'physical': 'Físico',
      'technical': 'Técnico',
      'tactical': 'Tático',
      'psychological': 'Psicológico',
      'medical': 'Médico',
      'other': 'Outro'
    }
    return types[type] || type
  }

  const getTestResult = () => {
    // Para testes Cooper, usar VO2 máximo para classificação
    if (test.test_type === 'cooper_vo2' && test.vo2_max) {
      // Classificação baseada em valores gerais de VO2 máximo
      if (test.vo2_max >= 50) return 'Excelente'
      if (test.vo2_max >= 40) return 'Bom'
      if (test.vo2_max >= 30) return 'Regular'
      return 'Necessita Melhoria'
    }
    
    // Para outros tipos de teste, usar métricas de performance
    const metrics = [test.speed, test.agility, test.strength, test.endurance, test.flexibility, test.coordination, test.balance, test.power]
    const validMetrics = metrics.filter(metric => metric !== null && metric !== undefined) as number[]
    
    if (validMetrics.length === 0) {
      return 'Pendente'
    }
    
    const average = validMetrics.reduce((sum, metric) => sum + metric, 0) / validMetrics.length
    
    if (average >= 8) return 'Excelente'
    if (average >= 6) return 'Bom'
    if (average >= 4) return 'Regular'
    return 'Necessita Melhoria'
  }

  const testResult = getTestResult()

  // Calcular média geral e contagem de métricas
  const getAverageScore = () => {
    // Para testes Cooper, usar VO2 máximo
    if (test.test_type === 'cooper_vo2' && test.vo2_max) {
      return test.vo2_max
    }
    
    // Para outros tipos de teste, usar métricas de performance
    const metrics = [test.speed, test.agility, test.strength, test.endurance, test.flexibility, test.coordination, test.balance, test.power]
    const validMetrics = metrics.filter(metric => metric !== null && metric !== undefined) as number[]
    
    if (validMetrics.length === 0) {
      return null
    }
    
    return validMetrics.reduce((sum, metric) => sum + metric, 0) / validMetrics.length
  }

  const getMetricsCount = () => {
    const allMetrics = [test.speed, test.agility, test.strength, test.endurance, test.flexibility, test.coordination, test.balance, test.power, test.reaction_time, test.vo2_max]
    const validMetrics = allMetrics.filter(metric => metric !== null && metric !== undefined)
    return `${validMetrics.length}/${allMetrics.length}`
  }

  const averageScore = getAverageScore()
  const metricsCount = getMetricsCount()

  const handleDeleteClick = () => {
    triggerHaptic('medium')
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      const formData = new FormData()
      formData.append('id', test.id)
      
      await deleteTest(formData)
      triggerHaptic('light')
      setShowDeleteModal(false)
      // A Server Action já faz redirect, não precisamos recarregar
    } catch (error) {
      console.error('🔴 [TestCard] Erro ao excluir teste:', error)
      alert('Erro ao excluir teste')
      triggerHaptic('heavy')
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    triggerHaptic('light')
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
        {/* Header with name and status */}
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl leading-6 font-semibold text-gray-900 truncate">
                {test.evaluatees?.name || 'Avaliando não encontrado'}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                test.test_type === 'cooper_vo2' ? 'bg-teal-100 text-teal-700 border border-teal-200' :
                test.test_type === 'physical' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                test.test_type === 'technical' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                test.test_type === 'tactical' ? 'bg-green-100 text-green-700 border border-green-200' :
                test.test_type === 'psychological' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                test.test_type === 'medical' ? 'bg-red-100 text-red-700 border border-red-200' :
                'bg-gray-100 text-gray-700 border border-gray-200'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  test.test_type === 'cooper_vo2' ? 'bg-teal-500' :
                  test.test_type === 'physical' ? 'bg-blue-500' :
                  test.test_type === 'technical' ? 'bg-purple-500' :
                  test.test_type === 'tactical' ? 'bg-green-500' :
                  test.test_type === 'psychological' ? 'bg-yellow-500' :
                  test.test_type === 'medical' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}></div>
                {getTestTypeLabel(test.test_type)}
              </span>
            </div>
          </div>
          
          {/* Action buttons - Below name */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/tests/${test.id}`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-105 w-full lg:w-auto lg:min-w-[120px]"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a4 4 0 11-8 0 4 4 0 018 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Ver
            </Link>
            <Link
              href={`/tests/${test.id}/edit`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 hover:scale-105 w-full lg:w-auto lg:min-w-[120px]"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </Link>
          </div>
        </div>

        {/* Test information */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600 py-1 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Tipo de Teste:</span>
              </div>
              <span className="font-semibold">{getTestTypeLabel(test.test_type)}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600 py-1 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Data do Teste:</span>
              </div>
              <span>{formatDate(test.test_date)}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600 py-1">
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="font-medium">Resultado:</span>
              </div>
              <span className={`font-semibold ${
                testResult === 'Excelente' ? 'text-green-600' :
                testResult === 'Bom' ? 'text-blue-600' :
                testResult === 'Regular' ? 'text-yellow-600' :
                testResult === 'Necessita Melhoria' ? 'text-red-600' :
                'text-gray-600'
              }`}>{testResult}</span>
            </div>
          </div>
        </div>

        {/* Média Geral e Métricas */}
        {averageScore !== null && (
          <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-700">Média Geral</p>
                  <p className={`text-2xl font-bold ${
                    averageScore >= 8 ? 'text-green-600' :
                    averageScore >= 6 ? 'text-blue-600' :
                    averageScore >= 4 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {averageScore.toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-indigo-700">Métricas</p>
                <p className="text-xl font-bold text-indigo-900">{metricsCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Resultados específicos do Teste Cooper removidos da listagem - devem aparecer apenas na página de detalhes */}

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
            onClick={handleDeleteClick}
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

      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Excluir Teste"
        message={`Tem certeza que deseja excluir o teste de ${test.evaluatees?.name || 'avaliando não encontrado'} realizado em ${formatDate(test.test_date)}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={isDeleting}
      />
    </TouchInteractions>
  )
}

export default memo(TestCard)