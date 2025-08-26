'use client'

import { useState, useEffect, useMemo } from 'react'
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

export default function PerformanceEvaluationForm({ students = [], selectedStudentId }: PerformanceEvaluationFormProps) {
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
          const results = calculatePerformanceEvaluation({
            cooperDistance: cooperTest.cooper_test_distance,
            intensityPercentage: parseFloat(intensityPercentage),
            trainingTime: parseFloat(trainingTime),
            bodyWeight: evaluatee.weight
          })
          setCalculations(results)
          setError('')
        } catch {
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Nova Avaliação de Desempenho
          </CardTitle>
          <CardDescription>
            Crie uma nova avaliação de desempenho baseada em dados de testes de Cooper anteriores
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
            <div className="space-y-2">
              <Label htmlFor="evaluatee">Avaliando</Label>
              <Select value={selectedEvaluatee} onValueChange={setSelectedEvaluatee}>
                <SelectTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="cooper-test">Teste de Cooper (Dados de VO2)</Label>
                {isLoadingTests ? (
                  <div className="flex items-center gap-2 p-3 border rounded">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Carregando testes...</span>
                  </div>
                ) : (
                  <Select value={selectedCooperTest} onValueChange={setSelectedCooperTest}>
                    <SelectTrigger>
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
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="intensity" className="text-red-600 font-semibold">
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
                    className="border-red-200 focus:border-red-500"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentual de intensidade do treinamento (1-100%)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-red-600 font-semibold">
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
                    className="border-red-200 focus:border-red-500"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo para percorrer determinada distância (em minutos)
                  </p>
                </div>
              </div>
            )}

            {/* Data do Teste */}
            <div className="space-y-2">
              <Label htmlFor="test-date">Data do Teste</Label>
              <Input
                id="test-date"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                required
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observações adicionais sobre o teste..."
                rows={3}
              />
            </div>

            {/* Resultados Calculados */}
            {calculations && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                    <Calculator className="h-4 w-4" />
                    Resultados Calculados
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-green-800">Distância de Treino:</span>
                      <div className="text-lg font-bold text-green-900">
                        {calculations.trainingDistance.toFixed(1)}m
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-green-800">Intensidade de Treinamento:</span>
                      <div className="text-lg font-bold text-green-900">
                        {calculations.trainingIntensity.toFixed(2)} ml/kg/min
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-green-800">Velocidade do Treino:</span>
                      <div className="text-lg font-bold text-green-900">
                        {calculations.trainingVelocity.toFixed(2)} m/min
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-green-800">Consumo Total de O2:</span>
                      <div className="text-lg font-bold text-green-900">
                        {calculations.totalO2Consumption.toFixed(2)} L
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-green-800">Gasto Calórico:</span>
                      <div className="text-lg font-bold text-green-900">
                        {calculations.caloricExpenditure.toFixed(0)} Cal
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-green-800">Peso Perdido:</span>
                      <div className="text-lg font-bold text-green-900">
                        {calculations.weightLoss.toFixed(1)}g
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !selectedEvaluatee || !selectedCooperTest || !intensityPercentage || !trainingTime || !selectedEvaluateeData?.weight}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando Avaliação...
                </>
              ) : (
                'Criar Avaliação de Desempenho'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}