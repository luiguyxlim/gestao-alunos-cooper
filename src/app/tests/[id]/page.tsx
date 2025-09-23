'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, User, Calendar, Activity, Target, Calculator, Info, BarChart3 } from 'lucide-react'

interface Test {
  id: string
  test_date: string
  test_type: string
  cooper_test_distance?: number
  duration?: number
  age?: number
  gender?: string
  notes?: string
  // Métricas de performance
  speed?: number
  agility?: number
  strength?: number
  endurance?: number
  flexibility?: number
  coordination?: number
  balance?: number
  power?: number
  reaction_time?: number
  vo2_max?: number
  evaluatees: {
    id: string
    name: string
  }
}

interface Metric {
  label: string
  value: string
  unit: string
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

function getTestTypeLabel(testType: string) {
  const types: { [key: string]: string } = {
    'cooper_vo2': 'Cooper VO2 (Teste de 12 minutos)',
    'cooper': 'Cooper VO2 (Teste de 12 minutos)',
    'performance_evaluation': 'Avaliação de Performance',
    'flexibility': 'Flexibilidade',
    'strength': 'Força',
    'endurance': 'Resistência',
    'speed': 'Velocidade',
    'agility': 'Agilidade'
  }
  return types[testType] || testType
}

function calculateVO2Max(distance: number, age: number, gender: string): number {
  // Fórmula de Cooper para VO2 máximo
  let vo2 = (distance - 504.9) / 44.73
  
  // Ajuste por idade
  const ageAdjustment = (220 - age) / 220
  vo2 = vo2 * ageAdjustment
  
  // Ajuste por gênero (mulheres têm valores ligeiramente menores)
  if (gender === 'female') {
    vo2 = vo2 * 0.9
  }
  
  return Math.max(vo2, 0)
}

function calculateTrainingDistance(vo2Max: number, intensityPercentage: number = 70): number {
  // Fórmula inversa do Cooper para calcular distância baseada no VO2
  const targetVO2 = vo2Max * (intensityPercentage / 100);
  const trainingDistance = (targetVO2 * 44.73) + 504.9;
  
  return Math.round(trainingDistance);
}

function getVO2Classification(vo2: number, age: number, gender: string): { level: string; color: string; description: string } {
  // Classificação baseada em tabelas de referência para VO2 máximo
  const classifications = {
    male: {
      '20-29': [{ min: 56, level: 'Excelente', color: 'emerald', description: 'Condicionamento excepcional' }, { min: 50, level: 'Bom', color: 'blue', description: 'Boa condição física' }, { min: 44, level: 'Regular', color: 'yellow', description: 'Condição física média' }, { min: 0, level: 'Fraco', color: 'red', description: 'Necessita melhorar' }],
      '30-39': [{ min: 52, level: 'Excelente', color: 'emerald', description: 'Condicionamento excepcional' }, { min: 46, level: 'Bom', color: 'blue', description: 'Boa condição física' }, { min: 40, level: 'Regular', color: 'yellow', description: 'Condição física média' }, { min: 0, level: 'Fraco', color: 'red', description: 'Necessita melhorar' }],
      '40-49': [{ min: 48, level: 'Excelente', color: 'emerald', description: 'Condicionamento excepcional' }, { min: 42, level: 'Bom', color: 'blue', description: 'Boa condição física' }, { min: 36, level: 'Regular', color: 'yellow', description: 'Condição física média' }, { min: 0, level: 'Fraco', color: 'red', description: 'Necessita melhorar' }],
      '50+': [{ min: 44, level: 'Excelente', color: 'emerald', description: 'Condicionamento excepcional' }, { min: 38, level: 'Bom', color: 'blue', description: 'Boa condição física' }, { min: 32, level: 'Regular', color: 'yellow', description: 'Condição física média' }, { min: 0, level: 'Fraco', color: 'red', description: 'Necessita melhorar' }]
    },
    female: {
      '20-29': [{ min: 50, level: 'Excelente', color: 'emerald', description: 'Condicionamento excepcional' }, { min: 44, level: 'Bom', color: 'blue', description: 'Boa condição física' }, { min: 38, level: 'Regular', color: 'yellow', description: 'Condição física média' }, { min: 0, level: 'Fraco', color: 'red', description: 'Necessita melhorar' }],
      '30-39': [{ min: 46, level: 'Excelente', color: 'emerald', description: 'Condicionamento excepcional' }, { min: 40, level: 'Bom', color: 'blue', description: 'Boa condição física' }, { min: 34, level: 'Regular', color: 'yellow', description: 'Condição física média' }, { min: 0, level: 'Fraco', color: 'red', description: 'Necessita melhorar' }],
      '40-49': [{ min: 42, level: 'Excelente', color: 'emerald', description: 'Condicionamento excepcional' }, { min: 36, level: 'Bom', color: 'blue', description: 'Boa condição física' }, { min: 30, level: 'Regular', color: 'yellow', description: 'Condição física média' }, { min: 0, level: 'Fraco', color: 'red', description: 'Necessita melhorar' }],
      '50+': [{ min: 38, level: 'Excelente', color: 'emerald', description: 'Condicionamento excepcional' }, { min: 32, level: 'Bom', color: 'blue', description: 'Boa condição física' }, { min: 26, level: 'Regular', color: 'yellow', description: 'Condição física média' }, { min: 0, level: 'Fraco', color: 'red', description: 'Necessita melhorar' }]
    }
  }

  const ageGroup = age < 30 ? '20-29' : age < 40 ? '30-39' : age < 50 ? '40-49' : '50+'
  const genderClassifications = classifications[gender as keyof typeof classifications] || classifications.male
  const ageClassifications = genderClassifications[ageGroup as keyof typeof genderClassifications]
  
  for (const classification of ageClassifications) {
    if (vo2 >= classification.min) {
      return classification
    }
  }
  
  return { level: 'Fraco', color: 'red', description: 'Necessita melhorar' }
}

export default function TestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTest() {
      try {
        const supabase = createClient()
        
        // Verificar se o usuário está autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setError('Usuário não autenticado')
          setLoading(false)
          return
        }
        
        const { data, error } = await supabase
          .from('performance_tests')
          .select(`
            *,
            evaluatees (
              id,
              name
            )
          `)
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Erro ao buscar teste:', error)
          if (error.code === 'PGRST116') {
            setError('Teste não encontrado ou você não tem permissão para acessá-lo')
          } else {
            setError('Erro ao carregar teste')
          }
          return
        }
        
        setTest(data)
      } catch (error) {
        console.error('Erro ao buscar teste:', error)
        setError('Erro ao carregar teste')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchTest()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Carregando teste...</p>
        </div>
      </div>
    )
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Teste não encontrado</h2>
          <p className="text-slate-600 mb-6">{error || 'O teste solicitado não foi encontrado.'}</p>
          <Button onClick={() => router.push('/tests')} className="bg-indigo-600 hover:bg-indigo-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Testes
          </Button>
        </div>
      </div>
    )
  }

  // Calcular métricas para testes de performance
  const metricsData: Metric[] = []
  
  if (test.test_type === 'performance_evaluation') {
    // Métricas específicas de avaliação de performance
    if (test.speed) {
      metricsData.push({
        label: 'Velocidade',
        value: test.speed.toString(),
        unit: 'm/s'
      })
    }
    if (test.agility) {
      metricsData.push({
        label: 'Agilidade',
        value: test.agility.toString(),
        unit: 's'
      })
    }
    if (test.strength) {
      metricsData.push({
        label: 'Força',
        value: test.strength.toString(),
        unit: 'kg'
      })
    }
    if (test.endurance) {
      metricsData.push({
        label: 'Resistência',
        value: test.endurance.toString(),
        unit: 'min'
      })
    }
    if (test.flexibility) {
      metricsData.push({
        label: 'Flexibilidade',
        value: test.flexibility.toString(),
        unit: 'cm'
      })
    }
    if (test.coordination) {
      metricsData.push({
        label: 'Coordenação',
        value: test.coordination.toString(),
        unit: 'pts'
      })
    }
    if (test.balance) {
      metricsData.push({
        label: 'Equilíbrio',
        value: test.balance.toString(),
        unit: 's'
      })
    }
    if (test.power) {
      metricsData.push({
        label: 'Potência',
        value: test.power.toString(),
        unit: 'W'
      })
    }
    if (test.reaction_time) {
      metricsData.push({
        label: 'Tempo de Reação',
        value: test.reaction_time.toString(),
        unit: 'ms'
      })
    }
    
    // VO2 máximo para testes de performance
    if (test.vo2_max) {
      metricsData.push({
        label: 'VO2 Máximo',
        value: test.vo2_max.toString(),
        unit: 'ml/kg/min'
      })
    }
  }

  // Calcular VO2 máximo para teste de Cooper
  const vo2Max = (test.test_type === 'cooper' || test.test_type === 'cooper_vo2') && test.cooper_test_distance && test.age && test.gender
    ? calculateVO2Max(test.cooper_test_distance, test.age, test.gender)
    : null

  const vo2Classification = vo2Max && test.age && test.gender 
    ? getVO2Classification(vo2Max, test.age, test.gender)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header com navegação */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/tests')}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Testes
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => router.push(`/tests/${test.id}/edit`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/evaluatees/${test.evaluatees.id}`)}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <User className="w-4 h-4 mr-2" />
                Ver Avaliando
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Cabeçalho do Teste */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">
                  {test.evaluatees.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold">{getTestTypeLabel(test.test_type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span>{formatDate(test.test_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 space-y-8">
              {(test.test_type === 'cooper' || test.test_type === 'cooper_vo2') ? (
                <div className="space-y-8">
                  {/* Resultados do Teste Cooper - Seção Destacada */}
                  {(test.cooper_test_distance || test.vo2_max || vo2Max) && (
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-2xl">
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

                      {/* Content */}
                      <div className="p-8">
                        {/* Métricas Principais */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                          {/* Distância Percorrida */}
                          {test.cooper_test_distance && (
                            <div className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 rounded-2xl p-6">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white">
                                  📏
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-pink-900">Distância Percorrida</h3>
                                  <p className="text-sm text-pink-700">Teste de 12 minutos</p>
                                </div>
                              </div>
                              <div className="text-center bg-white rounded-xl p-6 shadow-sm">
                                <div className="text-6xl font-black text-pink-700 mb-2">
                                  {test.cooper_test_distance}
                                  <span className="text-2xl font-bold text-pink-600 ml-2">m</span>
                                </div>
                                <div className="text-xl font-semibold text-pink-800 mb-2">
                                  {(test.cooper_test_distance / 1000).toFixed(2)} km
                                </div>
                                <div className="text-sm text-pink-600">
                                  Distância total percorrida
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* VO2 Máximo e Distância de Treino */}
                          {(test.vo2_max || vo2Max) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* VO2 Máximo */}
                              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white">
                                    🫁
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold text-emerald-900">VO2 Máximo</h3>
                                    <p className="text-sm text-emerald-700">Capacidade cardiorrespiratória</p>
                                  </div>
                                </div>
                                <div className="text-center bg-white rounded-xl p-6 shadow-sm">
                                  <div className="text-5xl font-black text-emerald-700 mb-2">
                                    {test.vo2_max || vo2Max?.toFixed(1)}
                                    <span className="text-xl font-semibold text-emerald-600 ml-2">ml/kg/min</span>
                                  </div>
                                  <div className="text-sm text-emerald-600 mb-4">
                                    Consumo máximo de oxigênio
                                  </div>
                                  
                                  {/* Classificação do VO2 */}
                                  {vo2Classification && (
                                    <div className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-bold shadow-sm ${
                                      vo2Classification.color === 'emerald' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                                      vo2Classification.color === 'blue' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
                                      vo2Classification.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                                      'bg-red-100 text-red-800 border-2 border-red-300'
                                    }`}>
                                      <div className={`w-3 h-3 rounded-full mr-3 ${
                                        vo2Classification.color === 'emerald' ? 'bg-green-500' :
                                        vo2Classification.color === 'blue' ? 'bg-blue-500' :
                                        vo2Classification.color === 'yellow' ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`}></div>
                                      {vo2Classification.level}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Distância de Treino Recomendada */}
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                                    🏃‍♂️
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold text-blue-900">Distância de Treino</h3>
                                    <p className="text-sm text-blue-700">Recomendação para 70% VO2</p>
                                  </div>
                                </div>
                                <div className="text-center bg-white rounded-xl p-6 shadow-sm">
                                  <div className="text-4xl font-black text-blue-700 mb-2">
                                    {calculateTrainingDistance(test.vo2_max || vo2Max || 0, 70)}
                                    <span className="text-xl font-semibold text-blue-600 ml-2">m</span>
                                  </div>
                                  <div className="text-xl font-semibold text-blue-800 mb-2">
                                    {(calculateTrainingDistance(test.vo2_max || vo2Max || 0, 70) / 1000).toFixed(2)} km
                                  </div>
                                  <div className="text-sm text-blue-600 mb-4">
                                    Distância recomendada para treino aeróbico
                                  </div>
                                  
                                  {/* Intensidade */}
                                  <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border-2 border-blue-300">
                                    <div className="w-3 h-3 rounded-full mr-2 bg-blue-500"></div>
                                    70% Intensidade
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Resumo Estatístico */}
                        {(test.vo2_max || vo2Max) && (
                          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center text-white">
                                  📊
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-slate-900">Resumo da Avaliação</h4>
                                  <p className="text-sm text-slate-600">Análise geral do desempenho</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-black text-slate-700 mb-1">
                                  {(test.vo2_max || vo2Max)?.toFixed(1)}
                                </div>
                                <div className="text-sm font-medium text-slate-500">Pontuação Final</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}





                  {/* Informações sobre o Teste de Cooper */}
                  <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-xl">
                        💡
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Sobre o Teste de Cooper
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                            <Target className="w-5 h-5" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">Objetivo</h3>
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          Avaliar a capacidade cardiorrespiratória através da distância percorrida em 12 minutos de corrida contínua.
                        </p>
                      </div>

                      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white">
                            <Calculator className="w-5 h-5" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">Fórmula VO2</h3>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-mono text-sm bg-slate-50 p-3 rounded-lg">
                          VO2 = (Distância - 504.9) / 44.73
                        </p>
                      </div>

                      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white">
                            <BarChart3 className="w-5 h-5" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">Indicador</h3>
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          Consumo máximo de oxigênio (VO2 máx) em ml/kg/min, principal indicador de condicionamento aeróbico.
                        </p>
                      </div>

                      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-white">
                            <Info className="w-5 h-5" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">Modalidade</h3>
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          Corrida ou caminhada contínua em pista de atletismo ou terreno plano por exatos 12 minutos.
                        </p>
                      </div>
                    </div>
                  </div>


                </div>
              ) : (
                <div className="space-y-8">
                  {/* Métricas de Performance */}
                  <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl">
                        📊
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Métricas de Performance
                      </h2>
                    </div>
                    
                    {/* Média Geral das Métricas */}
                    {metricsData.length > 0 && (() => {
                      const validMetrics = metricsData.map(m => parseFloat(m.value)).filter(v => !isNaN(v))
                      const averageScore = validMetrics.length > 0 ? validMetrics.reduce((sum, val) => sum + val, 0) / validMetrics.length : null
                      
                      return averageScore !== null ? (
                        <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                          <h4 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                            <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Resumo das Métricas
                          </h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-indigo-700">Média Geral</p>
                                <p className={`text-2xl font-bold ${
                                  averageScore >= 8 ? 'text-green-600' :
                                  averageScore >= 6 ? 'text-blue-600' :
                                  averageScore >= 4 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {averageScore.toFixed(1)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-indigo-700">Métricas</p>
                              <p className="text-xl font-bold text-indigo-900">{metricsData.length}/10</p>
                            </div>
                          </div>
                        </div>
                      ) : null
                    })()}
                    
                    {metricsData.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {metricsData.map((metric, index) => (
                          <div key={index} className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform duration-300">
                                📈
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-black text-slate-900">
                                  {metric.value}
                                  <span className="text-sm font-semibold text-indigo-600 ml-1">{metric.unit}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{metric.label}</h3>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma métrica registrada</h3>
                        <p className="text-slate-600">
                          Não foram registradas métricas de performance para este teste
                        </p>
                      </div>
                    )}
                  </div>


                </div>
              )}

            </div>
            
            {/* Sidebar com informações adicionais */}
            <div className="xl:col-span-1 space-y-6">
              {/* Distância do Teste Cooper movida para a área principal */}
              
              {/* Informações do Teste */}
              <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-lg">
                    📋
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Informações do Teste
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <dt className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Avaliando</dt>
                    <dd className="text-sm">
                      <Link
                        href={`/evaluatees/${test.evaluatees.id}`}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {test.evaluatees.name}
                      </Link>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Data do Teste</dt>
                    <dd className="text-sm text-slate-900 font-medium">
                      {formatDate(test.test_date)}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Tipo de Teste</dt>
                    <dd className="text-sm text-slate-900 font-medium">
                      {getTestTypeLabel(test.test_type)}
                    </dd>
                  </div>
                  
                  {test.notes && (
                    <div>
                      <dt className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Observações</dt>
                      <dd className="text-xs text-slate-700">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
                          {test.notes}
                        </div>
                      </dd>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Histórico do Avaliando */}
              <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-lg">
                    📈
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Histórico</h3>
                    <p className="text-xs text-slate-600">Evolução do avaliando</p>
                  </div>
                </div>
                <Link
                  href={`/tests?evaluatee_id=${test.evaluatees.id}`}
                  className="inline-flex items-center gap-2 w-full justify-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl group text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Ver Todos os Testes
                  <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}