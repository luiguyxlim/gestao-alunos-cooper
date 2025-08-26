'use client'

import { Student, deactivateStudent, reactivateStudent } from '@/lib/actions/students'
import Link from 'next/link'
import { useState } from 'react'
import TouchInteractions, { useHapticFeedback } from './TouchInteractions'

interface StudentCardProps {
  student: Student
}

export default function StudentCard({ student }: StudentCardProps) {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informado'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null
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
      className="bg-white overflow-hidden shadow-sm rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-indigo-200"
      enableRipple={true}
      onSwipeLeft={() => {
        triggerHaptic('light')
        // Could implement quick actions on swipe
      }}
    >
      <div className="p-5 sm:p-7">
        {/* Header with name and status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center space-x-3 mb-3 sm:mb-0">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-xl leading-6 font-semibold text-gray-900 truncate">
                {student.name}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                student.active 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  student.active ? 'bg-emerald-500' : 'bg-red-500'
                }`}></div>
                {student.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
          
          {/* Mobile-friendly action buttons */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/evaluatees/${student.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-105"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a4 4 0 11-8 0 4 4 0 018 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Ver
            </Link>
            <Link
              href={`/evaluatees/${student.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 hover:scale-105"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </Link>
            {student.active ? (
              <button
                onClick={handleDeactivate}
                disabled={isUpdating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
                {isUpdating ? 'Desativando...' : 'Desativar'}
              </button>
            ) : (
              <button
                onClick={handleReactivate}
                disabled={isUpdating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isUpdating ? 'Reativando...' : 'Reativar'}
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-6 bg-gray-50 rounded-lg p-4 space-y-3">
          {student.email && (
            <div className="flex items-center text-sm text-gray-700">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <span className="font-medium">{student.email}</span>
            </div>
          )}
          
          {student.phone && (
            <div className="flex items-center text-sm text-gray-700">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className="font-medium">{student.phone}</span>
            </div>
          )}
          
          {student.birth_date && (
            <div className="flex items-center text-sm text-gray-700">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-medium">
                {formatDate(student.birth_date)}
                {calculateAge(student.birth_date) && (
                  <span className="ml-2 text-gray-500">({calculateAge(student.birth_date)} anos)</span>
                )}
              </span>
            </div>
          )}
          
          {student.gender && (
            <div className="flex items-center text-sm text-gray-700">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="font-medium">{student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}</span>
            </div>
          )}
        </div>
        
        {/* Footer with creation date and CTA */}
        <div className="mt-6 pt-5 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex items-center text-xs text-gray-500">
              <svg className="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Cadastrado em {formatDate(student.created_at)}
            </div>
            <Link
              href={`/tests/new?student_id=${student.id}`}
              className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg touch-manipulation"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Teste
            </Link>
          </div>
        </div>
      </div>
    </TouchInteractions>
  )
}