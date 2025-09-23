'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calculator, User, TestTube, CheckCircle } from 'lucide-react'
import { Student } from '@/lib/actions/students'
import { calculatePerformanceEvaluation } from '@/lib/performance-evaluation'
import { getCooperTestsByStudent, createPerformanceEvaluation } from '@/lib/actions/performance-evaluation'

interface PerformanceEvaluationFormProps {
  students: Student[]
  selectedStudentId?: string
}

interface CooperTest {
  id: string
  test_date: string
  cooper_test_distance: number
  vo2_max: number
}

function PerformanceEvaluationForm({ students = [], selectedStudentId }: PerformanceEvaluationFormProps) {
  const router = useRouter()
  const [selectedEvaluatee, setSelectedEvaluatee] = useState<string>('')
  const [selectedCooperTest, setSelectedCooperTest] = useState<string>('')
  const [cooperTests, setCooperTests] = useState<CooperTest[]>([])
  
  // Garantir que students seja sempre um array
  const safeStudents = useMemo(() => Array.isArray(students) ? students : [], [students])
  const [intensityPercentage, setIntensityPercentage] = useState<string>('')
  const [trainingTime, setTrainingTime] = useState<string>('')
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [observations, setObservations] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTests, setIsLoadingTests] = useState(false)
  const [error, setError] = useState<string>('')
  const [calculations, setCalculations] = useState<{
    vo2Max: number;
    trainingDistance: number;
    trainingIntensity: number;
    trainingVelocity: number;
    totalO2Consumption: number;
    caloricExpenditure: number;
    weightLoss: number;
  } | null>(null)
  const [success, setSuccess] = useState(false)

  // Definir estudante selecionado se fornecido via props
  useEffect(() => {
    if (selectedStudentId && !selectedEvaluatee) {
      setSelectedEvaluatee(selectedStudentId)
    }
  }, [selectedStudentId, selectedEvaluatee])

  // Buscar testes de Cooper quando um avaliando for selecionado
  useEffect(() => {
    if (selectedEvaluatee) {
      setIsLoadingTests(true)
      setError('')
      
      getCooperTestsByStudent(selectedEvaluatee)
        .then((tests) => {
          setCooperTests(tests)
          setSelectedCooperTest('')
          setCalculations(null)
          
          if (tests.length === 0) {
            setError('Nenhum teste de Cooper encontrado para este avaliando. É necessário realizar um teste de Cooper primeiro.')
          }
        })
        .catch((err) => {
          console.error('Erro ao buscar testes de Cooper:', err)
          setError('Erro ao buscar testes de Cooper do avaliando')
          setCooperTests([])
        })
        .finally(() => {
          setIsLoadingTests(false)
        })
    } else {
      setCooperTests([])
      setSelectedCooperTest('')
      setCalculations(null)
      setError('')
    }
  }, [selectedEvaluatee])

  // Calcular resultados quando os dados necessários estiverem disponíveis
  useEffect(() => {
    if (selectedCooperTest && intensityPercentage && trainingTime) {
      const cooperTest = cooperTests?.find(test => test.id === selectedCooperTest)
      const evaluatee = safeStudents.find(e => e.id === selectedEvaluatee)
      
      if (cooperTest && evaluatee && evaluatee.weight) {
        try {
          console.log('Calculando com dados:', {
            cooperDistance: cooperTest.cooper_test_distance,
            intensityPercentage: parseFloat(intensityPercentage),
            trainingTime: parseFloat(trainingTime),
            bodyWeight: evaluatee.weight
          })
          
          const results = calculatePerformanceEvaluation({
            cooperDistance: cooperTest.cooper_test_distance,
            intensityPercentage: parseFloat(intensityPercentage),
            trainingTime: parseFloat(trainingTime),
            bodyWeight: evaluatee.weight
          })
          
          console.log('Resultados calculados:', results)
          setCalculations(results)
          setError('')
        } catch (error) {
          console.error('Erro ao calcular:', error)
          setError('Erro ao calcular os resultados')
          setCalculations(null)
        }
      } else if (evaluatee && !evaluatee.weight) {
        setError('O peso corporal do avaliando é necessário para os cálculos. Por favor, atualize o cadastro do avaliando.')
        setCalculations(null)
      }
    } else {
      setCalculations(null)
    }
  }, [selectedCooperTest, intensityPercentage, trainingTime, cooperTests, safeStudents, selectedEvaluatee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const cooperTest = cooperTests?.find(test => test.id === selectedCooperTest)
      const evaluatee = safeStudents.find(e => e.id === selectedEvaluatee)
      
      if (!cooperTest || !evaluatee || !evaluatee.weight) {
        throw new Error('Dados incompletos para criar a avaliação')
      }

      await createPerformanceEvaluation({
        student_id: selectedEvaluatee,
        test_date: testDate,
        vo2_max: cooperTest.vo2_max,
        cooper_distance: cooperTest.cooper_test_distance,
        intensity_percentage: parseFloat(intensityPercentage),
        training_time: parseFloat(trainingTime),
        body_weight: evaluatee.weight,
        observations: observations || undefined
      })
      
      setSuccess(true)
      
      // Reset form após sucesso
      setTimeout(() => {
        setSelectedEvaluatee('')
        setSelectedCooperTest('')
        setIntensityPercentage('')
        setTrainingTime('')
        setObservations('')
        setCalculations(null)
        setSuccess(false)
        router.push('/tests')
      }, 2000)
      
    } catch (err: unknown) {
      console.error('Erro ao criar avaliação:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar teste de avaliação de desempenho')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedEvaluateeData = safeStudents.find(e => e.id === selectedEvaluatee)
  const selectedCooperTestData = cooperTests?.find(test => test.id === selectedCooperTest)

  if (success) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold text-green-800">
              Avaliação de Desempenho Criada!
            </h3>
            <p className="text-sm text-muted-foreground">
              Redirecionando para a lista de testes...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Cabeçalho Principal */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
                📊
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  Nova Avaliação de Desempenho
                </h1>
                <p className="text-slate-600 mt-1">
                  Crie uma nova avaliação de desempenho baseada em dados de testes de Cooper anteriores
                </p>
              </div>
            </div>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white">
                  <TestTube className="h-4 w-4" />
                </div>
                Dados da Avaliação
              </CardTitle>
              <CardDescription className="text-slate-600">
                Preencha os dados necessários para gerar a avaliação de desempenho
              </CardDescription>
            </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Seleção do Avaliando */}
            <div className="space-y-3">
              <Label htmlFor="evaluatee" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                Avaliando
              </Label>
              <Select value={selectedEvaluatee} onValueChange={setSelectedEvaluatee}>
                <SelectTrigger className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl">
                  <SelectValue placeholder="Selecione um avaliando" />
                </SelectTrigger>
                <SelectContent>
                  {safeStudents.map((evaluatee) => (
                    <SelectItem key={evaluatee.id} value={evaluatee.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{evaluatee.name}</span>
                        {evaluatee.weight ? (
                          <span className="text-sm text-muted-foreground">
                            ({evaluatee.weight}kg)
                          </span>
                        ) : (
                          <span className="text-sm text-red-500">
                            (sem peso)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção do Teste de Cooper */}
            {selectedEvaluatee && (
              <div className="space-y-3">
                <Label htmlFor="cooper-test" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center text-white text-xs">
                    🏃‍♂️
                  </div>
                  Teste de Cooper (Dados de VO2)
                </Label>
                {isLoadingTests ? (
                  <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    <span className="text-sm text-slate-600 font-medium">Carregando testes...</span>
                  </div>
                ) : (
                  <Select value={selectedCooperTest} onValueChange={setSelectedCooperTest}>
                    <SelectTrigger className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl">
                      <SelectValue placeholder="Selecione um teste de Cooper" />
                    </SelectTrigger>
                    <SelectContent>
                      {cooperTests.map((test) => (
                        <SelectItem key={test.id} value={test.id}>
                          <div className="flex flex-col">
                            <span>{new Date(test.test_date).toLocaleDateString('pt-BR')}</span>
                            <span className="text-sm text-muted-foreground">
                              Distância: {test.cooper_test_distance}m | VO2 Max: {test.vo2_max} ml/kg/min
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Dados do Avaliando Selecionado */}
            {selectedEvaluateeData && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                      <User className="h-4 w-4" />
                    </div>
                    Dados do Avaliando
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Nome:</span> {selectedEvaluateeData.name}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {selectedEvaluateeData.email}
                    </div>
                    {selectedEvaluateeData.weight ? (
                      <div>
                        <span className="font-medium">Peso:</span> {selectedEvaluateeData.weight}kg
                      </div>
                    ) : (
                      <div className="col-span-2">
                        <Alert variant="destructive">
                          <AlertDescription>
                            Peso corporal não informado. É necessário atualizar o cadastro do avaliando.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                    {selectedCooperTestData && (
                      <>
                        <div>
                          <span className="font-medium">VO2 Max:</span> {selectedCooperTestData.vo2_max} ml/kg/min
                        </div>
                        <div>
                          <span className="font-medium">Distância Cooper:</span> {selectedCooperTestData.cooper_test_distance}m
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Variáveis de Entrada */}
            {selectedCooperTest && selectedEvaluateeData?.weight && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white">
                    ⚡
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Parâmetros de Treinamento</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="intensity" className="text-sm font-bold text-orange-700 flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-600 rounded-full"></div>
                      % Intensidade do Treino *
                    </Label>
                    <Input
                      id="intensity"
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                      value={intensityPercentage}
                      onChange={(e) => setIntensityPercentage(e.target.value)}
                      placeholder="Ex: 75"
                      className="h-12 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl bg-white/90"
                      required
                    />
                    <p className="text-xs text-orange-600 font-medium">
                      Percentual de intensidade do treinamento (1-100%)
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="time" className="text-sm font-bold text-red-700 flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                      T - Tempo de Treino (min) *
                    </Label>
                    <Input
                      id="time"
                      type="number"
                      min="1"
                      step="0.1"
                      value={trainingTime}
                      onChange={(e) => setTrainingTime(e.target.value)}
                      placeholder="Ex: 40"
                      className="h-12 border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl bg-white/90"
                      required
                    />
                    <p className="text-xs text-red-600 font-medium">
                      Tempo para percorrer determinada distância (em minutos)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Data do Teste */}
            <div className="space-y-3">
              <Label htmlFor="test-date" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded flex items-center justify-center text-white text-xs">
                  📅
                </div>
                Data do Teste
              </Label>
              <Input
                id="test-date"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl"
                required
              />
            </div>

            {/* Observações */}
            <div className="space-y-3">
              <Label htmlFor="observations" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded flex items-center justify-center text-white text-xs">
                  📝
                </div>
                Observações
              </Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observações adicionais sobre o teste..."
                rows={4}
                className="border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl resize-none"
              />
            </div>

            {/* Resultados Calculados */}
            {calculations && (
              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl shadow-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-bold text-emerald-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center text-white">
                      <Calculator className="h-5 w-5" />
                    </div>
                    Resultados Calculados
                  </CardTitle>
                  <CardDescription className="text-emerald-700 font-medium">
                    Análise completa dos parâmetros de treinamento calculados
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* VO2 Máximo */}
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm">
                          💨
                        </div>
                        <span className="text-sm font-bold text-slate-700">VO2 Máximo</span>
                      </div>
                      <div className="text-2xl font-black text-indigo-600">
                        {calculations.vo2Max.toFixed(2)} ml/kg/min
                      </div>
                    </div>

                    {/* MET Máximo */}
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-cyan-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-sm">
                          📊
                        </div>
                        <span className="text-sm font-bold text-slate-700">MET Máximo</span>
                      </div>
                      <div className="text-2xl font-black text-cyan-600">
                        {calculations.maxMET.toFixed(2)}
                      </div>
                    </div>

                    {/* Fração do Treinamento */}
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-green-600 rounded-lg flex items-center justify-center text-white text-sm">
                          🎯
                        </div>
                        <span className="text-sm font-bold text-slate-700">Fração do Treinamento</span>
                      </div>
                      <div className="text-2xl font-black text-teal-600">
                        {calculations.trainingFraction.toFixed(2)}
                      </div>
                    </div>

                    {/* Consumo de O2 por minuto */}
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-sm">
                          🫁
                        </div>
                        <span className="text-sm font-bold text-slate-700">Consumo O2/min</span>
                      </div>
                      <div className="text-2xl font-black text-yellow-600">
                        {calculations.o2ConsumptionPerMinute.toFixed(2)} L/min
                      </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-sm">
                          📏
                        </div>
                        <span className="text-sm font-bold text-slate-700">Distância de Treino</span>
                      </div>
                      <div className="text-2xl font-black text-green-600">
                        {calculations.trainingDistance.toFixed(1)}m
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">
                          ⚡
                        </div>
                        <span className="text-sm font-bold text-slate-700">Intensidade de Treinamento</span>
                      </div>
                      <div className="text-2xl font-black text-blue-600">
                        {calculations.trainingIntensity.toFixed(2)} ml/kg/min
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center text-white text-sm">
                          🏃‍♂️
                        </div>
                        <span className="text-sm font-bold text-slate-700">Velocidade do Treino</span>
                      </div>
                      <div className="text-2xl font-black text-purple-600">
                        {calculations.trainingVelocity.toFixed(2)} m/min
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center text-white text-sm">
                          🫁
                        </div>
                        <span className="text-sm font-bold text-slate-700">Consumo Total de O2</span>
                      </div>
                      <div className="text-2xl font-black text-orange-600">
                        {calculations.totalO2Consumption.toFixed(2)} L
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center text-white text-sm">
                          🔥
                        </div>
                        <span className="text-sm font-bold text-slate-700">Gasto Calórico</span>
                      </div>
                      <div className="text-2xl font-black text-red-600">
                        {calculations.caloricExpenditure.toFixed(0)} Cal
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-pink-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center text-white text-sm">
                          ⚖️
                        </div>
                        <span className="text-sm font-bold text-slate-700">Peso Perdido</span>
                      </div>
                      <div className="text-2xl font-black text-pink-600">
                        {calculations.weightLoss.toFixed(1)}g
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="pt-6 border-t border-slate-200">
              <Button 
                type="submit" 
                className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                disabled={isLoading || !selectedEvaluatee || !selectedCooperTest || !intensityPercentage || !trainingTime || !selectedEvaluateeData?.weight}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Criando Avaliação...
                  </>
                ) : (
                  <>
                    <div className="mr-3 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-sm">
                      ✨
                    </div>
                    Criar Avaliação de Desempenho
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}

export default memo(PerformanceEvaluationForm)