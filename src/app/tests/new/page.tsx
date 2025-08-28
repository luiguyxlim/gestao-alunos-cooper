import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ResponsiveNavigation from '@/components/ResponsiveNavigation'

interface NewTestPageProps {
  searchParams: Promise<{
    evaluatee_id?: string
    type?: string
  }>
}

export default async function NewTestPage({ searchParams }: NewTestPageProps) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const selectedStudentId = resolvedSearchParams.evaluatee_id
  const testType = resolvedSearchParams.type

  // Se não há tipo selecionado, mostrar página de seleção
  if (!testType) {
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Selecionar Tipo de Teste</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Escolha o tipo de teste que deseja realizar
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Teste de Cooper */}
                <Link
                  href={`/tests/new?type=cooper${selectedStudentId ? `&evaluatee_id=${selectedStudentId}` : ''}`}
                  className="group relative bg-white p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Teste de Cooper</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Avaliação de resistência cardiorrespiratória através de corrida de 12 minutos
                  </p>
                  <div className="text-xs text-gray-400">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      VO2 Máximo
                    </span>
                  </div>
                </Link>

                {/* Avaliação de Desempenho */}
                <Link
                  href={`/tests/new?type=performance${selectedStudentId ? `&evaluatee_id=${selectedStudentId}` : ''}`}
                  className="group relative bg-white p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Avaliação de Desempenho</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Cálculo de parâmetros de treinamento baseado em dados de VO2 máximo
                  </p>
                  <div className="text-xs text-gray-400">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 mr-2">
                      Gasto Calórico
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                      Intensidade
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Se tipo é Cooper, redirecionar para a página específica
  if (testType === 'cooper') {
    redirect(`/tests/cooper/new${selectedStudentId ? `?evaluatee_id=${selectedStudentId}` : ''}`)
  }

  // Se tipo é performance, redirecionar para a página específica
  if (testType === 'performance') {
    redirect(`/tests/performance-evaluation/new${selectedStudentId ? `?evaluatee_id=${selectedStudentId}` : ''}`)
  }

  // Tipo inválido, redirecionar para seleção
  redirect(`/tests/new${selectedStudentId ? `?evaluatee_id=${selectedStudentId}` : ''}`)
}