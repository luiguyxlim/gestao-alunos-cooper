'use client'

import Link from 'next/link'
import { deleteTest } from '@/lib/actions/tests'
import { PerformanceTestDetail } from '@/lib/types'
import { useState, memo } from 'react'
import TouchInteractions, { useHapticFeedback } from './TouchInteractions'
import ConfirmModal from './ConfirmModal'

interface TestListItemProps {
  test: PerformanceTestDetail
}

function TestListItem({ test }: TestListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const triggerHaptic = useHapticFeedback()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getTestTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'cooper_vo2': 'Cooper VO2',
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
    if (test.test_type === 'cooper_vo2' && test.vo2_max) {
      if (test.vo2_max >= 50) return 'Excelente'
      if (test.vo2_max >= 40) return 'Bom'
      if (test.vo2_max >= 30) return 'Regular'
      return 'Necessita Melhoria'
    }
    
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

  const getAverageScore = () => {
    if (test.test_type === 'cooper_vo2' && test.vo2_max) {
      return test.vo2_max
    }
    
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

  const testResult = getTestResult()
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
    } catch (error) {
      console.error('Erro ao excluir teste:', error)
      alert('Erro ao excluir teste')
      triggerHaptic('heavy')
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    triggerHaptic('light')
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Excelente': return 'text-green-600 bg-green-50'
      case 'Bom': return 'text-blue-600 bg-blue-50'
      case 'Regular': return 'text-yellow-600 bg-yellow-50'
      case 'Necessita Melhoria': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cooper_vo2': return 'bg-teal-100 text-teal-700'
      case 'physical': return 'bg-blue-100 text-blue-700'
      case 'technical': return 'bg-purple-100 text-purple-700'
      case 'tactical': return 'bg-green-100 text-green-700'
      case 'psychological': return 'bg-yellow-100 text-yellow-700'
      case 'medical': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <TouchInteractions 
      className="bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all duration-200 group"
      enableRipple={true}
    >
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Informações principais */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {/* Ícone do teste */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Dados principais */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {test.students?.name || 'Aluno não encontrado'}
                </h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(test.test_type)}`}>
                  {getTestTypeLabel(test.test_type)}
                </span>
              </div>
              
              {/* Informações secundárias */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(test.test_date)}</span>
                </div>
                
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getResultColor(testResult)}`}>
                  <span>{testResult}</span>
                </div>
                
                {averageScore !== null && (
                  <div className="flex items-center space-x-1">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">{averageScore.toFixed(1)}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{metricsCount} métricas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-4">
            <Link
              href={`/tests/${test.id}`}
              className="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
              title="Ver detalhes"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a4 4 0 11-8 0 4 4 0 018 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Link>
            
            <Link
              href={`/tests/${test.id}/edit`}
              className="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors duration-200"
              title="Editar"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            
            <Link
              href={`/evaluatees/${test.students?.id}`}
              className="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Ver avaliando"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Excluir"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Excluir Teste"
        message={`Tem certeza que deseja excluir o teste de ${test.students?.name || 'aluno não encontrado'} realizado em ${formatDate(test.test_date)}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={isDeleting}
      />
    </TouchInteractions>
  )
}

export default memo(TestListItem)
