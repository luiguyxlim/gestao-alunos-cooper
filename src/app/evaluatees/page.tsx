import { getStudents } from '@/lib/actions/students'
import { getAuthenticatedUser } from '@/lib/supabase-server'
import Link from 'next/link'
import ResponsiveNavigation from '@/components/ResponsiveNavigation'
import StudentListItem from '@/components/StudentListItem'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Avaliandos - Cooper Pro',
  description: 'Gerencie seus avaliandos no Cooper Pro. Visualize, edite e acompanhe o progresso de todos os estudantes cadastrados no sistema.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Avaliandos - Cooper Pro',
    description: 'Gestão completa de avaliandos e estudantes',
    type: 'website',
    locale: 'pt_BR'
  }
}

export default async function EvaluateesPage() {
  const { user } = await getAuthenticatedUser()

  const students = await getStudents()

  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveNavigation user={user} />

      <main className="max-w-7xl mx-auto py-4 px-3 sm:py-6 sm:px-6 lg:px-8">
        <div className="px-0 py-4 sm:py-6 sm:px-0">
        {/* Header melhorado */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-4 py-5 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Avaliandos</h1>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Gerencie e acompanhe o progresso de todos os seus avaliandos
                </p>
                <div className="mt-2 text-sm text-gray-500">
                  {students.length} avaliando{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href="/evaluatees/new"
                  className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm sm:text-base font-medium hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Novo Avaliando
                </Link>
              </div>
            </div>
          </div>
        </div>

          {students.length === 0 ? (
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-12 sm:px-6 text-center">
                <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  Nenhum avaliando cadastrado
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                  Comece adicionando seu primeiro avaliando para começar a realizar testes de performance.
                </p>
                <Link
                  href="/evaluatees/new"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm sm:text-base font-medium hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Novo Avaliando
                </Link>
              </div>
            </div>
          ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <StudentListItem key={student.id} student={student} />
            ))}
          </div>
          )}
        </div>
      </main>
    </div>
  )
}