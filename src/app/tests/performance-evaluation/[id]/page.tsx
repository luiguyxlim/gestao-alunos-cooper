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

  const { id } = await params
  const evaluation = await getPerformanceEvaluation(id)

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

        <div className="bg-white shadow-lg rounded-xl border-2 border-gray-300">
          <div className="px-6 py-8 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                  Avaliação de Desempenho - {evaluation.evaluatees.name}
                </h1>
                <p className="text-base font-semibold text-gray-700 mt-2">
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
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 border-b-4 border-blue-500 pb-3 mb-6">
                📊 Dados Herdados do Teste de Cooper
              </h2>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-8 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                    <dt className="text-base font-bold text-blue-800 mb-2">Distância Cooper</dt>
                    <dd className="text-2xl font-black text-blue-900">
                      {evaluation.cooper_distance} metros
                    </dd>
                  </div>
                  
                  <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                    <dt className="text-base font-bold text-blue-800 mb-2">VO2 Máximo</dt>
                    <dd className="text-2xl font-black text-blue-900">
                      {formatNumber(evaluation.vo2_max)} ml/kg/min
                    </dd>
                  </div>
                  
                  <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                    <dt className="text-base font-bold text-blue-800 mb-2">Peso Corporal</dt>
                    <dd className="text-2xl font-black text-blue-900">
                      {formatNumber(evaluation.body_weight, 1)} kg
                    </dd>
                  </div>
                  
                  <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                    <dt className="text-base font-bold text-blue-800 mb-2">Data do Teste Cooper</dt>
                    <dd className="text-2xl font-black text-blue-900">
                      {formatDate(evaluation.test_date)}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção de Parâmetros de Entrada */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 border-b-4 border-red-500 pb-3 mb-6">
                ⚙️ Parâmetros de Treinamento
              </h2>
              
              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-8 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="text-center bg-white rounded-lg p-6 shadow-sm border border-red-200">
                    <dt className="text-base font-bold text-red-800 mb-3">Percentual de Intensidade (%)</dt>
                    <dd className="text-3xl font-black text-red-900">
                      {formatNumber(evaluation.intensity_percentage, 0)}%
                    </dd>
                  </div>
                  
                  <div className="text-center bg-white rounded-lg p-6 shadow-sm border border-red-200">
                    <dt className="text-base font-bold text-red-800 mb-3">Tempo de Treino (T)</dt>
                    <dd className="text-3xl font-black text-red-900">
                      {formatNumber(evaluation.training_time, 0)} minutos
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção de Resultados Calculados */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 border-b-4 border-green-500 pb-3 mb-6">
                🎯 Resultados Calculados
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Distância de Treino */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6 text-center shadow-md">
                  <dt className="text-base font-bold text-green-800 mb-3">Distância de Treino</dt>
                  <dd className="text-2xl font-black text-green-900">
                    {formatNumber(evaluation.training_distance, 0)} metros
                  </dd>
                </div>
                
                {/* Velocidade do Treino */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-6 text-center shadow-md">
                  <dt className="text-base font-bold text-purple-800 mb-3">Velocidade do Treino</dt>
                  <dd className="text-2xl font-black text-purple-900">
                    {formatNumber(evaluation.training_velocity)} m/min
                  </dd>
                </div>
                
                {/* Intensidade de Treinamento */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-6 text-center shadow-md">
                  <dt className="text-base font-bold text-orange-800 mb-3">Intensidade de Treinamento</dt>
                  <dd className="text-2xl font-black text-orange-900">
                    {formatNumber(evaluation.training_intensity)} ml/kg/min
                  </dd>
                </div>
                
                {/* Consumo Total de O2 */}
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-300 rounded-xl p-6 text-center shadow-md">
                  <dt className="text-base font-bold text-cyan-800 mb-3">Consumo Total de O2</dt>
                  <dd className="text-2xl font-black text-cyan-900">
                    {formatNumber(evaluation.total_o2_consumption)} L
                  </dd>
                </div>
                
                {/* Gasto Calórico */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-6 text-center shadow-md">
                  <dt className="text-base font-bold text-yellow-800 mb-3">Gasto Calórico</dt>
                  <dd className="text-2xl font-black text-yellow-900">
                    {formatNumber(evaluation.caloric_expenditure, 0)} Cal
                  </dd>
                </div>
                
                {/* Peso Perdido */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-300 rounded-xl p-6 text-center shadow-md">
                  <dt className="text-base font-bold text-pink-800 mb-3">Peso Perdido</dt>
                  <dd className="text-2xl font-black text-pink-900">
                    {formatNumber(evaluation.weight_loss)} gramas
                  </dd>
                </div>
              </div>
            </div>

            {/* Seção de Racional de Cálculo */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 border-b-4 border-blue-500 pb-3 mb-6">
                🧮 Racional de Cálculo
              </h2>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-8 shadow-md">
                <div className="space-y-6 text-base text-gray-800">
                  <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                    <strong className="text-blue-900">Distância de Treino:</strong> DT = (D × %I) / 100
                    <br />
                    <span className="text-sm text-blue-700 mt-2 block">
                      Onde D = Distância do teste de Cooper ({formatNumber(evaluation.cooper_distance, 0)}m) e %I = Percentual de Intensidade ({formatNumber(evaluation.intensity_percentage, 0)}%)
                    </span>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                    <strong className="text-blue-900">Velocidade do Treino:</strong> VT = DT / T
                    <br />
                    <span className="text-sm text-blue-700 mt-2 block">
                      Onde DT = Distância de Treino ({formatNumber(evaluation.training_distance, 0)}m) e T = Tempo de Treino ({formatNumber(evaluation.training_time, 0)} min)
                    </span>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                    <strong className="text-blue-900">Intensidade de Treinamento:</strong> IT = (VO2max × %I) / 100
                    <br />
                    <span className="text-sm text-blue-700 mt-2 block">
                      Onde VO2max = VO2 Máximo ({formatNumber(evaluation.vo2_max)} ml/kg/min) e %I = Percentual de Intensidade ({formatNumber(evaluation.intensity_percentage, 0)}%)
                    </span>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                    <strong className="text-blue-900">Consumo Total de O2:</strong> CTO2 = (IT × PC × T) / 1000
                    <br />
                    <span className="text-sm text-blue-700 mt-2 block">
                      Onde IT = Intensidade de Treinamento ({formatNumber(evaluation.training_intensity)} ml/kg/min), PC = Peso Corporal ({formatNumber(evaluation.body_weight)} kg) e T = Tempo de Treino ({formatNumber(evaluation.training_time, 0)} min)
                    </span>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                    <strong className="text-blue-900">Gasto Calórico:</strong> GC = CTO2 × 5
                    <br />
                    <span className="text-sm text-blue-700 mt-2 block">
                      Onde CTO2 = Consumo Total de O2 ({formatNumber(evaluation.total_o2_consumption)} L)
                    </span>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                    <strong className="text-blue-900">Peso Perdido:</strong> PP = (GC / 7.7) × 1000
                    <br />
                    <span className="text-sm text-blue-700 mt-2 block">
                      Onde GC = Gasto Calórico ({formatNumber(evaluation.caloric_expenditure, 0)} Cal)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            {evaluation.observations && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 border-b-4 border-yellow-500 pb-3 mb-6">
                  📝 Observações
                </h2>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-8 shadow-md">
                  <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">{evaluation.observations}</p>
                </div>
              </div>
            )}

            {/* Seção de Variáveis Utilizadas */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 border-b-4 border-indigo-500 pb-3 mb-6">
                📊 Variáveis Utilizadas
              </h2>
              
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-300 rounded-xl p-8 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                    <dt className="text-sm font-bold text-indigo-800">D</dt>
                    <dd className="text-lg font-black text-indigo-900">Distância do Teste Cooper</dd>
                    <dd className="text-sm text-indigo-700">{formatNumber(evaluation.cooper_distance, 0)} metros</dd>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                    <dt className="text-sm font-bold text-indigo-800">%I</dt>
                    <dd className="text-lg font-black text-indigo-900">Percentual de Intensidade</dd>
                    <dd className="text-sm text-indigo-700">{formatNumber(evaluation.intensity_percentage, 0)}%</dd>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                    <dt className="text-sm font-bold text-indigo-800">T</dt>
                    <dd className="text-lg font-black text-indigo-900">Tempo de Treino</dd>
                    <dd className="text-sm text-indigo-700">{formatNumber(evaluation.training_time, 0)} minutos</dd>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                    <dt className="text-sm font-bold text-indigo-800">VO2max</dt>
                    <dd className="text-lg font-black text-indigo-900">VO2 Máximo</dd>
                    <dd className="text-sm text-indigo-700">{formatNumber(evaluation.vo2_max)} ml/kg/min</dd>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                    <dt className="text-sm font-bold text-indigo-800">PC</dt>
                    <dd className="text-lg font-black text-indigo-900">Peso Corporal</dd>
                    <dd className="text-sm text-indigo-700">{formatNumber(evaluation.body_weight)} kg</dd>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
                    <dt className="text-sm font-bold text-indigo-800">Fator</dt>
                    <dd className="text-lg font-black text-indigo-900">Conversão Calórica</dd>
                    <dd className="text-sm text-indigo-700">5 Cal/L O2</dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico do Avaliando */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Histórico do Avaliando</h3>
                  <p className="text-sm text-gray-500">Outros testes de performance</p>
                </div>
                <Link
                  href={`/tests?evaluatee_id=${evaluation.evaluatees.id}`}
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