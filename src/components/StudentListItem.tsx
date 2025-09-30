'use client'

import { Student, deactivateStudent, reactivateStudent } from '@/lib/actions/students'
import Link from 'next/link'
import { useState, memo } from 'react'
import TouchInteractions, { useHapticFeedback } from './TouchInteractions'

interface StudentListItemProps {
  student: Student
}

function StudentListItem({ student }: StudentListItemProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const triggerHaptic = useHapticFeedback()

  const handleDeactivate = async () => {
    triggerHaptic('medium')
    if (confirm(`Tem certeza que deseja desativar o avaliando ${student.name}?`)) {
      setIsUpdating(true)
      try {
        await deactivateStudent(student.id)
        triggerHaptic('light')
      } catch (error) {
        console.error('Erro ao desativar avaliando:', error)
        alert('Erro ao desativar avaliando')
        triggerHaptic('heavy')
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const handleReactivate = async () => {
    triggerHaptic('medium')
    if (confirm(`Tem certeza que deseja reativar o avaliando ${student.name}?`)) {
      setIsUpdating(true)
      try {
        await reactivateStudent(student.id)
        triggerHaptic('light')
      } catch (error) {
        console.error('Erro ao reativar avaliando:', error)
        alert('Erro ao reativar avaliando')
        triggerHaptic('heavy')
      } finally {
        setIsUpdating(false)
      }
    }
  }


  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null
    if (typeof window === 'undefined') return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
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
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Dados principais */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {student.name}
                </h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  student.active 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    student.active ? 'bg-emerald-500' : 'bg-red-500'
                  }`}></div>
                  {student.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              
              {/* Informações secundárias */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {student.email && (
                  <div className="flex items-center space-x-1">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <span className="truncate max-w-[200px]">{student.email}</span>
                  </div>
                )}
                
                {student.birth_date && (
                  <div className="flex items-center space-x-1">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {calculateAge(student.birth_date)} anos
                    </span>
                  </div>
                )}
                
                {student.gender && (
                  <div className="flex items-center space-x-1">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}</span>
                  </div>
                )}
                
                {student.weight && (
                  <div className="flex items-center space-x-1">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    <span>{student.weight} kg</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-4">
            <Link
              href={`/evaluatees/${student.id}`}
              className="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
              title="Ver detalhes"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a4 4 0 11-8 0 4 4 0 018 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Link>
            
            <Link
              href={`/evaluatees/${student.id}/edit`}
              className="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors duration-200"
              title="Editar"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            
            <Link
              href={`/tests/new?evaluatee_id=${student.id}`}
              className="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
              title="Novo teste"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </Link>
            
            {student.active ? (
              <button
                onClick={handleDeactivate}
                disabled={isUpdating}
                className="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Desativar"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleReactivate}
                disabled={isUpdating}
                className="inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reativar"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </TouchInteractions>
  )
}

export default memo(StudentListItem)
