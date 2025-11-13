'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { formatDateToBR } from '@/lib/utils'

interface Test {
  id: string
  test_date: string
  test_type: string
  cooper_test_distance?: number
  vo2_max?: number
  notes?: string
  student_id: string
  // Campos específicos de prescrição de treinamento
  intensity_percentage?: number
  training_time?: number
  training_intensity?: number
  training_velocity?: number
  training_distance?: number
  total_o2_consumption?: number
  caloric_expenditure?: number
  weight_loss?: number
  body_weight?: number
}

interface Student {
  id: string
  name: string
}

// Linhas de intervalos salvos para testes intervalados
interface IntervalRow {
  order_index: number
  mode: 'distance_intensity' | 'distance_time'
  distance_meters: number
  intensity_percentage: number | null
  time_minutes: number
  velocity_m_per_min: number
  o2_consumption_l: number
  kcal: number
  weight_loss_grams: number
}

const formatDate = (dateString: string) => formatDateToBR(dateString)

function getTestTypeLabel(testType: string) {
  const types: { [key: string]: string } = {
    'cooper_vo2': 'Cooper VO2 (Teste de 12 minutos)',
    'cooper': 'Cooper VO2 (Teste de 12 minutos)',
    'performance_evaluation': 'Avaliação de Performance',
    'interval_training': 'Treino Intervalado',
    'flexibility': 'Flexibilidade',
    'strength': 'Força',
    'endurance': 'Resistência',
    'speed': 'Velocidade',
    'agility': 'Agilidade'
  }
  return types[testType] || testType
}

export default function TestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [intervals, setIntervals] = useState<IntervalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setError('Usuário não autenticado')
          setLoading(false)
          return
        }
        
        const { data: testData, error: testError } = await supabase
          .from('performance_tests')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single()

        if (testError) {
          console.error('Erro ao buscar teste:', testError)
          if (testError.code === 'PGRST116') {
            setError('Teste não encontrado ou você não tem permissão para acessá-lo')
          } else {
            setError('Erro ao carregar teste')
          }
          return
        }

        setTest(testData)

        // Carrega intervalos quando for teste intervalado
        if (testData.test_type === 'interval_training') {
          const { data: intervalData, error: intervalsError } = await supabase
            .from('interval_training_intervals')
            .select('*')
            .eq('test_id', testData.id)
            .order('order_index', { ascending: true })

          if (intervalsError) {
            console.error('Erro ao buscar intervalos do treino:', intervalsError)
          } else {
            setIntervals((intervalData ?? []) as IntervalRow[])
          }
        }

        if (testData.student_id) {
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id, name')
            .eq('id', testData.student_id)
            .single()

          if (studentError) {
            console.error('Erro ao buscar student:', studentError)
            setError('Erro ao carregar dados do avaliando')
            return
          }

          setStudent(studentData)
        }
        
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        setError('Erro ao carregar dados')
      } finally {
        setLoading(false)
        setDataLoaded(true)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id])

  if (loading || !dataLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando teste...</p>
        </div>
      </div>
    )
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Teste não encontrado</h2>
          <p className="text-gray-600 mb-6">{error || 'O teste solicitado não foi encontrado.'}</p>
          <Button onClick={() => router.push('/tests')} className="bg-blue-600 hover:bg-blue-700">
            ← Voltar para Testes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/tests')}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                ← Voltar para Testes
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => {
                  if (test.test_type === 'cooper_vo2') {
                    router.push(`/tests/cooper/${test.id}/edit`)
                  } else if (test.test_type === 'performance_evaluation') {
                    router.push(`/tests/performance-evaluation/${test.id}/edit`)
                  } else {
                    router.push(`/tests/${test.id}/edit`)
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                ✏️ Editar
              </Button>
              {student && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/evaluatees/${student.id}`)}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  👤 Ver Avaliando
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {student && student.name ? student.name : 'Nome não disponível'}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">🏃‍♂️</span>
                    <span className="font-semibold">{getTestTypeLabel(test.test_type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">📅</span>
                    <span>{formatDate(test.test_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 space-y-8">
              {(test.test_type === 'cooper' || test.test_type === 'cooper_vo2') && (
                <div className="space-y-8">
                  {(test.cooper_test_distance || test.vo2_max) && (
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                      <div className="bg-blue-600 px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center text-white text-2xl">
                            🏃‍♂️
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold text-white">
                              Resultados do Teste Cooper
                            </h2>
                            <p className="text-blue-100 font-medium">
                              Teste de 12 minutos - Capacidade cardiorrespiratória
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                          {test.cooper_test_distance && (
                            <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-6">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center text-white">
                                  📏
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-pink-900">Distância Percorrida</h3>
                                  <p className="text-sm text-pink-700">Teste de Cooper - 12 minutos</p>
                                </div>
                              </div>
                              <div className="text-center bg-white rounded-lg p-6 shadow-sm">
                                <div className="text-6xl font-black text-pink-700 mb-2">
                                  {test.cooper_test_distance}
                                  <span className="text-2xl font-bold text-pink-600 ml-2">m</span>
                                </div>
                                <div className="text-xl font-semibold text-pink-800 mb-3">
                                  {(test.cooper_test_distance / 1000).toFixed(2)} km
                                </div>
                                <div className="text-sm text-pink-600 mb-3">
                                  Distância total percorrida em 12 minutos
                                </div>
                                <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-xs text-pink-800">
                                  <div className="font-semibold mb-1">🏃‍♂️ O que significa:</div>
                                  <div className="leading-relaxed">
                                    A distância percorrida no teste de Cooper indica a capacidade aeróbica. 
                                    Quanto maior a distância, melhor o condicionamento cardiorrespiratório.
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {test.vo2_max && (
                            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                                  🫁
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-emerald-900">VO2 Máximo</h3>
                                  <p className="text-sm text-emerald-700">Consumo Máximo de Oxigênio</p>
                                </div>
                              </div>
                              <div className="text-center bg-white rounded-lg p-6 shadow-sm">
                                <div className="text-5xl font-black text-emerald-700 mb-2">
                                  {test.vo2_max}
                                  <span className="text-xl font-semibold text-emerald-600 ml-2">ml/kg/min</span>
                                </div>
                                <div className="text-sm text-emerald-600 mb-3">
                                  Volume de oxigênio consumido por quilograma de peso corporal por minuto
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800">
                                  <div className="font-semibold mb-1">📊 O que significa:</div>
                                  <div className="leading-relaxed">
                                    O VO2 máximo é a medida da capacidade do corpo de transportar e utilizar oxigênio durante exercício máximo. 
                                    É considerado o melhor indicador da capacidade cardiorrespiratória e do condicionamento físico geral.
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Resultados do Treino Intervalado */}
              {test.test_type === 'interval_training' && (
                <div className="space-y-8">
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-teal-600 px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center text-white text-2xl">⏱️</div>
                        <div>
                          <h2 className="text-3xl font-bold text-white">Resultados do Treino Intervalado</h2>
                          <p className="text-teal-100 font-medium">Métricas derivadas do teste de Cooper e sessões de intervalo</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 space-y-8">
                      {/* Resumo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {typeof test.vo2_max === 'number' && (
                          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white">🫁</div>
                              <div>
                                <h3 className="text-lg font-bold text-emerald-900">VO2 Máximo</h3>
                                <p className="text-sm text-emerald-700">ml/kg/min</p>
                              </div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-3xl font-black text-emerald-700">
                                {test.vo2_max}
                                <span className="text-lg font-semibold text-emerald-600 ml-1">ml/kg/min</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {typeof test.total_o2_consumption === 'number' && (
                          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">💨</div>
                              <div>
                                <h3 className="text-lg font-bold text-blue-900">Consumo de O2</h3>
                                <p className="text-sm text-blue-700">Total (L)</p>
                              </div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-3xl font-black text-blue-700">
                                {test.total_o2_consumption.toFixed(2)}
                                <span className="text-lg font-semibold text-blue-600 ml-1">L</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {typeof test.caloric_expenditure === 'number' && (
                          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white">🔥</div>
                              <div>
                                <h3 className="text-lg font-bold text-red-900">Gasto Calórico</h3>
                                <p className="text-sm text-red-700">kcal</p>
                              </div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-3xl font-black text-red-700">
                                {test.caloric_expenditure.toFixed(2)}
                                <span className="text-lg font-semibold text-red-600 ml-1">kcal</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {typeof test.weight_loss === 'number' && (
                          <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center text-white">⚖️</div>
                              <div>
                                <h3 className="text-lg font-bold text-pink-900">Perda de Peso</h3>
                                <p className="text-sm text-pink-700">Total (g)</p>
                              </div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-3xl font-black text-pink-700">
                                {test.weight_loss.toFixed(1)}
                                <span className="text-lg font-semibold text-pink-600 ml-1">g</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tabela de Treinos */}
                      <div className="mt-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span>📈</span>
                          Treinos
                        </h3>
                        {intervals.length === 0 ? (
                          <div className="text-sm text-gray-600">Nenhum treino registrado.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 text-gray-700">
                                  <th className="p-2 text-left">#</th>
                                  <th className="p-2 text-left">Modo</th>
                                  <th className="p-2 text-left">Distância (m)</th>
                                  <th className="p-2 text-left">% Intensidade</th>
                                  <th className="p-2 text-left">Tempo (min)</th>
                                  <th className="p-2 text-left">Pace (km/h)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {intervals.map((r) => (
                                  <tr key={r.order_index} className="border-t">
                                    <td className="p-2">{r.order_index}</td>
                                    <td className="p-2">{r.mode === 'distance_intensity' ? 'D+I' : 'D+T'}</td>
                                    <td className="p-2">{r.distance_meters}</td>
                                    <td className="p-2">{r.intensity_percentage ?? '-'}</td>
                                    <td className="p-2">{r.time_minutes ?? '-'}</td>
                                    <td className="p-2">{(((r.velocity_m_per_min ?? 0) * 60) / 1000).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resultados do Teste de Performance */}
              {test.test_type === 'performance_evaluation' && (
                <div className="space-y-8">
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-purple-600 px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center text-white text-2xl">
                          📊
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-white">
                            Prescrição de Treinamento
                          </h2>
                          <p className="text-purple-100 font-medium">
                            Parâmetros calculados baseados no teste de Cooper
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* VO2 Máximo */}
                        {test.vo2_max && (
                          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                                🫁
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-blue-900">VO2 Máximo</h3>
                                <p className="text-sm text-blue-700">Base do cálculo</p>
                              </div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-3xl font-black text-blue-700 mb-2">
                                {test.vo2_max}
                                <span className="text-lg font-semibold text-blue-600 ml-1">ml/kg/min</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* PACE */}
                        {test.training_intensity && (
                          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                                🎯
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-green-900">PACE</h3>
                                <p className="text-sm text-green-700">km/h</p>
                              </div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-3xl font-black text-green-700 mb-2">
                                {test.training_intensity.toFixed(2)}
                                <span className="text-lg font-semibold text-green-600 ml-1">km/h</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Velocidade de Treino */}
                        {test.training_velocity && (
                          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                                🏃‍♂️
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-orange-900">Velocidade de Treino</h3>
                                <p className="text-sm text-orange-700">m/min</p>
                              </div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-3xl font-black text-orange-700 mb-2">
                                {test.training_velocity.toFixed(2)}
                                <span className="text-lg font-semibold text-orange-600 ml-1">m/min</span>
                              </div>
                              <div className="text-sm text-orange-600 mt-2">
                                {(test.training_velocity * 0.06).toFixed(2)} km/h
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Distância de Treino */}
                        {test.training_distance && (
                          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                                📏
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-purple-900">Distância de Treino</h3>
                                <p className="text-sm text-purple-700">metros</p>
                              </div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-3xl font-black text-purple-700 mb-2">
                                {test.training_distance.toFixed(0)}
                                <span className="text-lg font-semibold text-purple-600 ml-1">m</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Gasto Calórico */}
                        {test.caloric_expenditure && (
                          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white">
                                🔥
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-red-900">Gasto Calórico</h3>
                                <p className="text-sm text-red-700">kcal</p>
                              </div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-3xl font-black text-red-700 mb-2">
                                {test.caloric_expenditure.toFixed(2)}
                                <span className="text-lg font-semibold text-red-600 ml-1">kcal</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Perda de Peso */}
                        {test.weight_loss && (
                          <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center text-white">
                                ⚖️
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-pink-900">Perda de Peso</h3>
                                <p className="text-sm text-pink-700">gramas</p>
                              </div>
                            </div>
                            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                              <div className="text-3xl font-black text-pink-700 mb-2">
                                {test.weight_loss.toFixed(1)}
                                <span className="text-lg font-semibold text-pink-600 ml-1">g</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Informações Adicionais */}
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Parâmetros de Entrada */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span>⚙️</span>
                            Parâmetros de Entrada
                          </h3>
                          <div className="space-y-3">
                            {test.intensity_percentage && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Intensidade:</span>
                                <span className="font-semibold text-gray-900">{test.intensity_percentage}%</span>
                              </div>
                            )}
                            {test.training_time && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tempo:</span>
                                <span className="font-semibold text-gray-900">{test.training_time} min</span>
                              </div>
                            )}
                            {test.body_weight && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Peso:</span>
                                <span className="font-semibold text-gray-900">{test.body_weight} kg</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Gasto de Oxigênio */}
                        {test.total_o2_consumption && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <span>💨</span>
                              Gasto de Oxigênio
                            </h3>
                            <div className="text-center">
                              <div className="text-2xl font-black text-gray-700 mb-2">
                                {test.total_o2_consumption.toFixed(2)}
                                <span className="text-lg font-semibold text-gray-600 ml-1">L</span>
                              </div>
                              <p className="text-sm text-gray-600">Total durante o treino</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center text-white text-lg">
                    📋
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Informações do Teste
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <dt className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Avaliando</dt>
                    <dd className="text-sm">
                      {student && student.name ? (
                        <Link
                          href={`/evaluatees/${student.id}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          <span>👤</span>
                          {student.name}
                        </Link>
                      ) : (
                        <span className="text-gray-500">Nome não disponível</span>
                      )}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Data do Teste</dt>
                    <dd className="text-sm text-gray-900 font-medium">
                      {formatDate(test.test_date)}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Tipo de Teste</dt>
                    <dd className="text-sm text-gray-900 font-medium">
                      {getTestTypeLabel(test.test_type)}
                    </dd>
                  </div>
                  
                  {test.notes && (
                    <div>
                      <dt className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Observações</dt>
                      <dd className="text-xs text-gray-700">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 leading-relaxed">
                          {test.notes}
                        </div>
                      </dd>
                    </div>
                  )}
                </div>
              </div>
              
              {student && (
                <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-lg">
                      📈
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Histórico</h3>
                      <p className="text-xs text-gray-600">Evolução do avaliando</p>
                    </div>
                  </div>
                  <Link
                    href={`/tests?evaluatee_id=${student.id}`}
                    className="inline-flex items-center gap-2 w-full justify-center px-4 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl group text-sm"
                  >
                    <span>📊</span>
                    Ver Todos os Testes
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}