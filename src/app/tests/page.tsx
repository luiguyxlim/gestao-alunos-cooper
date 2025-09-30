import { getTests } from '@/lib/actions/tests'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ResponsiveNavigation from '@/components/ResponsiveNavigation'
import TestListItem from '@/components/TestListItem'
import TestsStats from '@/components/TestsStats'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Testes de Performance - Cooper Pro',
  description: 'Visualize e gerencie todos os testes de performance física no Cooper Pro. Acompanhe resultados, estatísticas e evolução dos avaliandos.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Testes de Performance - Cooper Pro',
    description: 'Gestão completa de testes de performance física',
    type: 'website',
    locale: 'pt_BR'
  }
}


interface TestsPageProps {
  searchParams: Promise<{
  evaluatee_id?: string
  }>
}

export default async function TestsPage({ searchParams }: TestsPageProps) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const tests = await getTests(resolvedSearchParams.evaluatee_id)

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
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {resolvedSearchParams.evaluatee_id ? 'Testes do Avaliando' : 'Testes de Performance'}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {resolvedSearchParams.evaluatee_id
                    ? 'Histórico completo de avaliações do avaliando selecionado'
                    : 'Gerencie e visualize todos os testes de performance física'
                  }
                </p>
                <div className="mt-2 text-sm text-gray-500">
                  {tests.length} teste{tests.length !== 1 ? 's' : ''} realizado{tests.length !== 1 ? 's' : ''}
                </div>
              </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {resolvedSearchParams.evaluatee_id && (
                    <Link
                      href="/tests"
                      className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl text-sm sm:text-base font-medium hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      Ver Todos os Testes
                    </Link>
                  )}
                  <Link
                    href={resolvedSearchParams.evaluatee_id ? `/tests/new?evaluatee_id=${resolvedSearchParams.evaluatee_id}` : '/tests/new'}
                    className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm sm:text-base font-medium hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Novo Teste
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {!resolvedSearchParams.evaluatee_id && (
            <div className="mb-6 sm:mb-8">
              <TestsStats />
            </div>
          )}

          {tests.length === 0 ? (
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-12 sm:px-6 text-center">
                <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  Nenhum teste encontrado
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                  {resolvedSearchParams.evaluatee_id 
                    ? 'Este avaliando ainda não possui testes de performance registrados.'
                    : 'Comece criando seu primeiro teste de performance para acompanhar o progresso.'
                  }
                </p>
                <Link
                  href={resolvedSearchParams.evaluatee_id ? `/tests/new?evaluatee_id=${resolvedSearchParams.evaluatee_id}` : '/tests/new'}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm sm:text-base font-medium hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Criar Primeiro Teste
                </Link>
              </div>
            </div>
          ) : (
          <div className="space-y-3">
            {tests.map((test) => (
              <TestListItem key={test.id} test={test} />
            ))}
          </div>
          )}
        </div>
      </main>
    </div>
  )
}