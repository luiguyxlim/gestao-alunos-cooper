import { getPerformanceEvaluation } from '@/lib/actions/performance-evaluation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ResponsiveNavigation from '@/components/ResponsiveNavigation'

interface PerformanceEvaluationPageProps {
  params: {
    id: string
  }
}

export default async function PerformanceEvaluationPage({ params }: PerformanceEvaluationPageProps) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const evaluation = await getPerformanceEvaluation(params.id)

  if (!evaluation) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informado'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatNumber = (value: number | null, decimals: number = 2) => {
    if (value === null || value === undefined) return 'N/A'
    return value.toFixed(decimals)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveNavigation user={user} />

      <main className="max-w-4xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/tests"
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
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Avaliação de Desempenho - {evaluation.evaluatees.name}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(evaluation.test_date)}
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href={`/evaluatees/${evaluation.evaluatees.id}`}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Ver Avaliando
                </Link>
              </div>
            </div>

            {/* Seção de Dados Herdados do Teste de Cooper */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Dados Herdados do Teste de Cooper
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <dt className="text-sm font-medium text-blue-700">Distância Cooper</dt>
                    <dd className="mt-1 text-lg font-semibold text-blue-900">
                      {evaluation.cooper_distance} metros
                    </dd>
                  </div>
                  
                  <div className="text-center">
                    <dt className="text-sm font-medium text-blue-700">VO2 Máximo</dt>
                    <dd className="mt-1 text-lg font-semibold text-blue-900">
                      {formatNumber(evaluation.vo2_max)} ml/kg/min
                    </dd>
                  </div>
                  
                  <div className="text-center">
                    <dt className="text-sm font-medium text-blue-700">Peso Corporal</dt>
                    <dd className="mt-1 text-lg font-semibold text-blue-900">
                      {formatNumber(evaluation.body_weight, 1)} kg
                    </dd>
                  </div>
                  
                  <div className="text-center">
                    <dt className="text-sm font-medium text-blue-700">Data do Teste Cooper</dt>
                    <dd className="mt-1 text-lg font-semibold text-blue-900">
                      {formatDate(evaluation.test_date)}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção de Parâmetros de Entrada */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Parâmetros de Treinamento
              </h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <dt className="text-sm font-medium text-red-700">Percentual de Intensidade (%)</dt>
                    <dd className="mt-1 text-2xl font-bold text-red-900">
                      {formatNumber(evaluation.intensity_percentage, 0)}%
                    </dd>
                  </div>
                  
                  <div className="text-center">
                    <dt className="text-sm font-medium text-red-700">Tempo de Treino (T)</dt>
                    <dd className="mt-1 text-2xl font-bold text-red-900">
                      {formatNumber(evaluation.training_time, 0)} minutos
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção de Resultados Calculados */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Resultados Calculados
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Distância de Treino */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <dt className="text-sm font-medium text-green-700">Distância de Treino</dt>
                  <dd className="mt-1 text-xl font-bold text-green-900">
                    {formatNumber(evaluation.training_distance, 0)} metros
                  </dd>
                </div>
                
                {/* Velocidade do Treino */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <dt className="text-sm font-medium text-purple-700">Velocidade do Treino</dt>
                  <dd className="mt-1 text-xl font-bold text-purple-900">
                    {formatNumber(evaluation.training_velocity)} m/min
                  </dd>
                </div>
                
                {/* Intensidade de Treinamento */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <dt className="text-sm font-medium text-orange-700">Intensidade de Treinamento</dt>
                  <dd className="mt-1 text-xl font-bold text-orange-900">
                    {formatNumber(evaluation.training_intensity)} ml/kg/min
                  </dd>
                </div>
                
                {/* Consumo Total de O2 */}
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 text-center">
                  <dt className="text-sm font-medium text-cyan-700">Consumo Total de O2</dt>
                  <dd className="mt-1 text-xl font-bold text-cyan-900">
                    {formatNumber(evaluation.total_o2_consumption)} L
                  </dd>
                </div>
                
                {/* Gasto Calórico */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <dt className="text-sm font-medium text-yellow-700">Gasto Calórico</dt>
                  <dd className="mt-1 text-xl font-bold text-yellow-900">
                    {formatNumber(evaluation.caloric_expenditure, 0)} Cal
                  </dd>
                </div>
                
                {/* Peso Perdido */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 text-center">
                  <dt className="text-sm font-medium text-pink-700">Peso Perdido</dt>
                  <dd className="mt-1 text-xl font-bold text-pink-900">
                    {formatNumber(evaluation.weight_loss)} gramas
                  </dd>
                </div>
              </div>
            </div>

            {/* Seção de Fórmulas Utilizadas */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Fórmulas Utilizadas nos Cálculos
              </h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="text-sm text-gray-700 space-y-3">
                  <div>
                    <strong>1. Distância de Treino:</strong> Distância Cooper × (% / 100) × (T / 12)
                  </div>
                  <div>
                    <strong>2. Intensidade de Treinamento:</strong> VO2 Max × (% / 100)
                  </div>
                  <div>
                    <strong>3. Velocidade do Treino:</strong> Distância de Treino / T
                  </div>
                  <div>
                    <strong>4. Consumo Total de O2:</strong> (Intensidade × Peso × T) / 1000
                  </div>
                  <div>
                    <strong>5. Gasto Calórico:</strong> Consumo Total O2 × 5
                  </div>
                  <div>
                    <strong>6. Peso Perdido:</strong> (Gasto Calórico × 1000) / 7730
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            {evaluation.observations && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                  Observações
                </h2>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <p className="text-sm text-gray-700">{evaluation.observations}</p>
                </div>
              </div>
            )}

            {/* Histórico do Avaliando */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Histórico do Avaliando</h3>
                  <p className="text-sm text-gray-500">Outros testes de performance</p>
                </div>
                <Link
                  href={`/tests?student_id=${evaluation.evaluatees.id}`}
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  Ver todos os testes do avaliando →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}