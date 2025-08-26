import { getTest } from '@/lib/actions/tests'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

interface TestPageProps {
  params: {
    id: string
  }
}

export default async function TestPage({ params }: TestPageProps) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const test = await getTest(params.id)

  if (!test) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informado'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getTestTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'cooper_vo2': 'Cooper VO2 (Teste de 12 minutos)'
    }
    return types[type] || 'Cooper VO2 (Teste de 12 minutos)'
  }

  const getMetricsData = () => {
    const metrics = [
      { label: 'Velocidade', value: test.speed, unit: '/10' },
      { label: 'Agilidade', value: test.agility, unit: '/10' },
      { label: 'Força', value: test.strength, unit: '/10' },
      { label: 'Resistência', value: test.endurance, unit: '/10' },
      { label: 'Flexibilidade', value: test.flexibility, unit: '/10' },
      { label: 'Coordenação', value: test.coordination, unit: '/10' },
      { label: 'Equilíbrio', value: test.balance, unit: '/10' },
      { label: 'Potência', value: test.power, unit: '/10' },
      { label: 'Tempo de Reação', value: test.reaction_time, unit: 'ms' },
      { label: 'VO2 Max', value: test.vo2_max, unit: 'ml/kg/min' }
    ]
    
    return metrics.filter(metric => metric.value !== null && metric.value !== undefined)
  }

  const getAverageScore = () => {
    const scoreMetrics = [test.speed, test.agility, test.strength, test.endurance, test.flexibility, test.coordination, test.balance, test.power]
    const validMetrics = scoreMetrics.filter(metric => metric !== null && metric !== undefined) as number[]
    
    if (validMetrics.length === 0) return null
    
    const average = validMetrics.reduce((sum, metric) => sum + metric, 0) / validMetrics.length
    return Math.round(average * 100) / 100
  }

  const metricsData = getMetricsData()
  const averageScore = getAverageScore()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                Sistema de Gestão de Alunos
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/evaluatees"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Avaliandos
                </Link>
                <Link
                  href="/evaluatees"
                  className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Avaliandos
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Olá, {user.user_metadata?.full_name || user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Teste de {test.evaluatees.name}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {getTestTypeLabel(test.test_type)} • {formatDate(test.test_date)}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Link
                    href={`/tests/${test.id}/edit`}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/evaluatees/${test.evaluatees.id}`}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Ver Avaliando
                  </Link>
                </div>
              </div>

              {averageScore !== null && (
                <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-indigo-900">Pontuação Geral</h3>
                      <p className="text-sm text-indigo-700">Média das métricas avaliadas</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-indigo-600">{averageScore}/10</div>
                      <div className="text-sm text-indigo-500">
                        {metricsData.filter(m => m.unit === '/10').length} métricas
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                    Métricas de Performance
                  </h2>
                  
                  {metricsData.length > 0 ? (
                    <div className="space-y-4">
                      {metricsData.map((metric, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {metric.label}
                          </span>
                          <span className="text-sm text-gray-900 font-semibold">
                            {metric.value}{metric.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">
                        Nenhuma métrica foi registrada para este teste
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                    Informações do Teste
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Avaliando</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link
                          href={`/evaluatees/${test.evaluatees.id}`}
                          className="text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          {test.evaluatees.name}
                        </Link>
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Data do Teste</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(test.test_date)}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tipo de Teste</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {getTestTypeLabel(test.test_type)}
                      </dd>
                    </div>
                    
                    {test.notes && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Observações</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                            {test.notes}
                          </div>
                        </dd>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Seção específica para teste de Cooper */}
                {test.test_type === 'cooper_vo2' && test.cooper_test_distance && (
                  <div className="mt-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                      Resultado do Teste de Cooper
                    </h2>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      {/* Dados principais */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="text-center">
                          <dt className="text-sm font-medium text-blue-700">Avaliando</dt>
                          <dd className="mt-1 text-lg font-semibold text-blue-900">
                            {test.evaluatees.name}
                          </dd>
                        </div>
                        
                        {test.evaluatees.birth_date && (
                          <div className="text-center">
                            <dt className="text-sm font-medium text-blue-700">Idade</dt>
                            <dd className="mt-1 text-lg font-semibold text-blue-900">
                              {(() => {
                                const today = new Date()
                                const birth = new Date(test.evaluatees.birth_date)
                                let age = today.getFullYear() - birth.getFullYear()
                                const monthDiff = today.getMonth() - birth.getMonth()
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                                  age--
                                }
                                return age
                              })()} anos
                            </dd>
                          </div>
                        )}
                        
                        {test.evaluatees.gender && (
                          <div className="text-center">
                            <dt className="text-sm font-medium text-blue-700">Sexo</dt>
                            <dd className="mt-1 text-lg font-semibold text-blue-900">
                              {test.evaluatees.gender === 'masculino' ? 'Masculino' : 
                               test.evaluatees.gender === 'feminino' ? 'Feminino' : 
                               test.evaluatees.gender}
                            </dd>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <dt className="text-sm font-medium text-blue-700">Distância Percorrida</dt>
                          <dd className="mt-1 text-2xl font-bold text-blue-900">
                            {test.cooper_test_distance} metros
                          </dd>
                        </div>
                      </div>
                      
                      {/* Resultado VO2 em destaque */}
                      {test.vo2_max && (
                        <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6 text-center">
                          <dt className="text-sm font-medium text-green-700">VO2 Máximo Calculado</dt>
                          <dd className="mt-1 text-3xl font-bold text-green-600">
                            {test.vo2_max} ml/kg/min
                          </dd>
                        </div>
                      )}
                      
                      {/* Critérios do teste */}
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Critérios do Teste de Cooper</h3>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><strong>Duração:</strong> 12 minutos de corrida contínua</p>
                          <p><strong>Objetivo:</strong> Percorrer a maior distância possível</p>
                          <p><strong>Fórmula VO2:</strong> VO2 = (Distância - 504,9) ÷ 44,73</p>
                          <p><strong>Dados obrigatórios:</strong> Nome, idade e sexo do avaliando</p>
                        </div>
                      </div>
                      
                      {/* Interpretação do resultado */}
                      {test.vo2_max && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-green-800 mb-2">Interpretação do Resultado</h3>
                          <p className="text-sm text-green-700">
                            O VO2 máximo de <strong>{test.vo2_max} ml/kg/min</strong> representa a capacidade máxima de consumo de oxigênio 
                            do avaliando durante exercício físico intenso, sendo um indicador fundamental da aptidão cardiorrespiratória.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Histórico do Avaliando</h3>
                    <p className="text-sm text-gray-500">Outros testes de performance</p>
                  </div>
                  <Link
                    href={`/tests?student_id=${test.evaluatees.id}`}
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    Ver todos os testes do avaliando →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}