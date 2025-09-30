import ResponsiveNavigation from '@/components/ResponsiveNavigation'
import { getStudents } from '@/lib/actions/students'
import { getAuthenticatedUser } from '@/lib/supabase-server'
import Link from 'next/link'
import PerformanceEvaluationForm from '@/components/PerformanceEvaluationForm'

interface NewPerformanceEvaluationPageProps {
  searchParams: Promise<{
    evaluatee_id?: string
  }>
}

export default async function NewPerformanceEvaluationPage({ searchParams }: NewPerformanceEvaluationPageProps) {
  const { user } = await getAuthenticatedUser()

  const resolvedSearchParams = await searchParams
  const students = await getStudents()
  const selectedStudentId = resolvedSearchParams.evaluatee_id

  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveNavigation user={user} />

      <main className="max-w-4xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={selectedStudentId ? `/tests?evaluatee_id=${selectedStudentId}` : '/tests'}
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Testes
          </Link>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Nova Avaliação de Desempenho</h1>
              <p className="text-sm text-gray-500 mt-1">
                Crie uma nova avaliação de desempenho baseada nos dados de VO2 do avaliando
              </p>
            </div>

            <PerformanceEvaluationForm 
              students={students} 
              selectedStudentId={selectedStudentId}
            />
          </div>
        </div>
      </main>
    </div>
  )
}