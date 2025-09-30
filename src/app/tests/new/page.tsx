import { getAuthenticatedUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ResponsiveNavigation from '@/components/ResponsiveNavigation'

interface NewTestPageProps {
  searchParams: Promise<{
    student_id?: string
    type?: string
  }>
}

export default async function NewTestPage({ searchParams }: NewTestPageProps) {
  const { user } = await getAuthenticatedUser()

  const resolvedSearchParams = await searchParams
  const selectedStudentId = resolvedSearchParams.student_id
  const testType = resolvedSearchParams.type

  // Se não há tipo selecionado, mostrar página de seleção
  if (!testType) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ResponsiveNavigation user={user} />

        <main className="max-w-6xl mx-auto py-4 px-3 sm:py-6 sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-6">
            <Link
              href={selectedStudentId ? `/tests?student_id=${selectedStudentId}` : '/tests'}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para Testes
            </Link>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-5 sm:p-6 lg:p-8">
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Selecionar Tipo de Teste</h1>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Escolha o tipo de teste que deseja realizar para o avaliando
                </p>
              </div>

              {/* Grid responsivo melhorado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Teste de Cooper - Card Principal */}
                <Link
                  href={`/tests/new?type=cooper${selectedStudentId ? `&student_id=${selectedStudentId}` : ''}`}
                  className="group relative bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:shadow-lg hover:scale-105 transition-all duration-300 lg:col-span-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-blue-500 rounded-xl shadow-lg group-hover:bg-blue-600 transition-colors">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-medium">
                        Teste Principal
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Teste de Cooper</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Avaliação completa de resistência cardiorrespiratória através de corrida de 12 minutos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-blue-200 text-blue-800 text-xs font-medium">
                      VO2 Máximo
                    </span>
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-blue-200 text-blue-800 text-xs font-medium">
                      Resistência
                    </span>
                  </div>
                </Link>

                {/* Prescrição de Treinamento */}
                <Link
                  href={`/tests/training-prescription${selectedStudentId ? `?student_id=${selectedStudentId}` : ''}`}
                  className="group relative bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-purple-500 rounded-xl shadow-lg mb-4 group-hover:bg-purple-600 transition-colors">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Prescrição de Treinamento</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Prescrição completa e personalizada de treinamento baseada em teste de Cooper
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-purple-200 text-purple-800 text-xs font-medium">
                      Velocidade
                    </span>
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-purple-200 text-purple-800 text-xs font-medium">
                      Distância
                    </span>
                  </div>
                </Link>
              </div>

              {/* Seção de informações adicionais */}
              <div className="mt-6 sm:mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg mr-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Informações Importantes</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 text-sm text-gray-600">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Teste de Cooper:</strong> Realize primeiro para obter dados de VO2 máximo
                    </div>
                  </div>
                  <div className="flex items-start sm:col-span-2 lg:col-span-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <strong>Prescrição:</strong> Crie um plano de treinamento personalizado
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Se tipo é Cooper, redirecionar para a página específica
  if (testType === 'cooper') {
    redirect(`/tests/cooper/new${selectedStudentId ? `?student_id=${selectedStudentId}` : ''}`)
  }

  // Tipo "performance" não está mais disponível

  // Tipo inválido, redirecionar para seleção
  redirect(`/tests/new${selectedStudentId ? `?student_id=${selectedStudentId}` : ''}`)
}