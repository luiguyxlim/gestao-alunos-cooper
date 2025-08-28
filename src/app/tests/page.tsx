import { getTests } from '@/lib/actions/tests'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ResponsiveNavigation from '@/components/ResponsiveNavigation'
import TestCard from '@/components/TestCard'
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {resolvedSearchParams.evaluatee_id ? 'Testes do Avaliando' : 'Testes de Performance'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {resolvedSearchParams.evaluatee_id 
                  ? 'Histórico de avaliações do avaliando selecionado'
                  : 'Gerencie e visualize todos os testes de performance'
                }
              </p>
            </div>
            <div className="flex space-x-3">
              {resolvedSearchParams.evaluatee_id && (
                <Link
                  href="/tests"
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Ver Todos os Testes
                </Link>
              )}
              <Link
                href={resolvedSearchParams.evaluatee_id ? `/tests/new?evaluatee_id=${resolvedSearchParams.evaluatee_id}` : '/tests/new'}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Novo Teste
              </Link>
            </div>
          </div>

          {!resolvedSearchParams.evaluatee_id && (
            <div className="mb-8">
              <TestsStats />
            </div>
          )}

          {tests.length === 0 ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Nenhum teste encontrado
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {resolvedSearchParams.evaluatee_id 
                    ? 'Este avaliando ainda não possui testes de performance registrados.'
                    : 'Comece criando seu primeiro teste de performance.'
                  }
                </p>
                <div className="mt-6">
                  <Link
                    href={resolvedSearchParams.evaluatee_id ? `/tests/new?evaluatee_id=${resolvedSearchParams.evaluatee_id}` : '/tests/new'}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Criar Primeiro Teste
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map((test) => (
                  <TestCard key={test.id} test={test} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}