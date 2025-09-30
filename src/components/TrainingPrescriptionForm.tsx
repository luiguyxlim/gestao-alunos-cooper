'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, Calculator, User, Target, Zap, Clock, MapPin } from 'lucide-react'
import { Student } from '@/lib/actions/students'
import { getCooperTestsByStudent } from '@/lib/actions/performance-evaluation'
import { calculatePerformanceEvaluation } from '@/lib/performance-evaluation'
import { createPerformanceTest } from '@/lib/actions/tests'

interface CooperTest {
  id: string
  test_date: string
  cooper_test_distance: number
  vo2_max: number
}

interface TrainingPrescriptionFormProps {
  students: Student[]
  selectedStudentId?: string
}

export default function TrainingPrescriptionForm({ students, selectedStudentId }: TrainingPrescriptionFormProps) {
  const router = useRouter()
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedCooperTest, setSelectedCooperTest] = useState<string>('')
  const [cooperTests, setCooperTests] = useState<CooperTest[]>([])
  const [intensityPercentage, setIntensityPercentage] = useState<string>('70')
  const [trainingTime, setTrainingTime] = useState<string>('40')
  const [isLoadingTests, setIsLoadingTests] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string>('')
  const [calculations, setCalculations] = useState<{
    vo2Max: number
    maxMET: number
    trainingFraction: number
    trainingIntensity: number
    trainingVelocity: number
    trainingDistance: number
    o2ConsumptionPerMinute: number
    totalO2Consumption: number
    caloricExpenditure: number
    weightLoss: number
  } | null>(null)

  // Garantir que students seja sempre um array
  const safeStudents = useMemo(() => Array.isArray(students) ? students : [], [students])

  // Definir estudante selecionado se fornecido via props
  useEffect(() => {
    if (selectedStudentId && !selectedStudent) {
      setSelectedStudent(selectedStudentId)
    }
  }, [selectedStudentId, selectedStudent])

  // Buscar testes de Cooper quando um estudante for selecionado
  useEffect(() => {
    if (selectedStudent) {
      setIsLoadingTests(true)
      setError('')
      
      getCooperTestsByStudent(selectedStudent)
        .then(tests => {
          setCooperTests(tests || [])
          if (tests && tests.length > 0) {
            setSelectedCooperTest(tests[0].id)
          }
        })
        .catch(err => {
          console.error('Erro ao buscar testes:', err)
          setError('Erro ao carregar testes de Cooper')
          setCooperTests([])
        })
        .finally(() => {
          setIsLoadingTests(false)
        })
    }
  }, [selectedStudent])

  // Calcular resultados quando os dados necessários estiverem disponíveis
  useEffect(() => {
    if (selectedCooperTest && intensityPercentage && trainingTime) {
      const cooperTest = cooperTests?.find(test => test.id === selectedCooperTest)
      const student = safeStudents.find(s => s.id === selectedStudent)
      
      if (cooperTest && student && student.weight) {
        try {
          console.log('Calculando prescrição com dados:', {
            cooperDistance: cooperTest.cooper_test_distance,
            intensityPercentage: parseFloat(intensityPercentage),
            trainingTime: parseFloat(trainingTime),
            bodyWeight: student.weight
          })
          
          const results = calculatePerformanceEvaluation({
            cooperDistance: cooperTest.cooper_test_distance,
            intensityPercentage: parseFloat(intensityPercentage),
            trainingTime: parseFloat(trainingTime),
            bodyWeight: student.weight
          })
          
          console.log('Resultados da prescrição:', results)
          setCalculations(results)
          setError('')
        } catch (error) {
          console.error('Erro ao calcular prescrição:', error)
          setError('Erro ao calcular a prescrição de treinamento')
          setCalculations(null)
        }
      } else if (student && !student.weight) {
        setError('O peso corporal do estudante é necessário para os cálculos. Por favor, atualize o cadastro.')
        setCalculations(null)
      }
    } else {
      setCalculations(null)
    }
  }, [selectedCooperTest, intensityPercentage, trainingTime, cooperTests, safeStudents, selectedStudent])

  const handleSaveTest = async () => {
    if (!calculations || !selectedStudent || !selectedCooperTest) {
      setError('Dados insuficientes para salvar o teste')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('student_id', selectedStudent)
      formData.append('test_date', new Date().toISOString().split('T')[0])

      const selectedTest = cooperTests.find((test) => test.id === selectedCooperTest)
      if (!selectedTest) {
        throw new Error('Teste de Cooper selecionado não encontrado')
      }

      formData.append('cooper_distance', selectedTest.cooper_test_distance.toString())
      formData.append('vo2_max', selectedTest.vo2_max.toString())
      formData.append('intensity_percentage', intensityPercentage)
      formData.append('training_time', trainingTime)
      formData.append('notes', `Prescrição de treinamento baseada no teste de Cooper`)
      
      // Dados calculados
      formData.append('vo2_max', calculations.vo2Max.toString())
      formData.append('training_intensity', calculations.trainingIntensity.toString())
      formData.append('training_velocity', calculations.trainingVelocity.toString())
      formData.append('training_distance', calculations.trainingDistance.toString())
      formData.append('total_o2_consumption', calculations.totalO2Consumption.toString())
      formData.append('caloric_expenditure', calculations.caloricExpenditure.toString())
      formData.append('weight_loss', calculations.weightLoss.toString())
      
      const student = safeStudents.find(s => s.id === selectedStudent)
      if (student?.weight) {
        formData.append('body_weight', student.weight.toString())
      }

      await createPerformanceTest(formData)
      setSaveSuccess(true)
      
      // Reset form after successful save
      setTimeout(() => {
        setSaveSuccess(false)
        setCalculations(null)
        setSelectedStudent('')
        setSelectedCooperTest('')
        setIntensityPercentage('70')
        setTrainingTime('40')
      }, 2000)

    } catch (error) {
      console.error('Erro ao salvar teste:', error)
      setError(error instanceof Error ? error.message : 'Erro ao salvar teste')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg mb-4">
              <Target className="h-6 w-6" />
              <span className="text-lg font-bold">Prescrição de Treinamento</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">
              Calculadora de Performance
            </h1>
            <p className="text-slate-600 text-lg">
              Baseada no teste de Cooper para prescrição precisa de treinamento
            </p>
          </div>

          {/* Botão de Voltar */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/tests')}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            >
              ← Voltar para Testes
            </Button>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white">
                  <Calculator className="h-4 w-4" />
                </div>
                Parâmetros da Prescrição
              </CardTitle>
              <CardDescription className="text-slate-600">
                Selecione o estudante e teste de Cooper base para calcular a prescrição de treinamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Seleção do Estudante */}
                <div className="space-y-3">
                  <Label htmlFor="student" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-600" />
                    Estudante
                  </Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl">
                      <SelectValue placeholder="Selecione um estudante" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{student.name}</span>
                            {student.weight ? (
                              <span className="text-sm text-muted-foreground">
                                ({student.weight}kg)
                              </span>
                            ) : (
                              <span className="text-sm text-red-500">
                                (sem peso)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Seleção do Teste de Cooper */}
                {selectedStudent && (
                  <div className="space-y-3">
                    <Label htmlFor="cooper-test" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center text-white text-xs">
                        🏃‍♂️
                      </div>
                      Teste de Cooper Base
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

                {/* Parâmetros de Treinamento */}
                {selectedCooperTest && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="intensity" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-600" />
                        % Intensidade do Treino *
                      </Label>
                      <Input
                        id="intensity"
                        type="number"
                        min="50"
                        max="90"
                        value={intensityPercentage}
                        onChange={(e) => setIntensityPercentage(e.target.value)}
                        className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl"
                        placeholder="70"
                      />
                      <p className="text-xs text-slate-500">Percentual de intensidade do treinamento (50-90%)</p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="time" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        T - Tempo de Treino (min) *
                      </Label>
                      <Input
                        id="time"
                        type="number"
                        min="10"
                        max="120"
                        value={trainingTime}
                        onChange={(e) => setTrainingTime(e.target.value)}
                        className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl"
                        placeholder="40"
                      />
                      <p className="text-xs text-slate-500">Tempo para percorrer determinada distância (em minutos)</p>
                    </div>
                  </div>
                )}

                {/* Resultados Calculados */}
                {calculations && (
                  <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl shadow-xl">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl font-bold text-emerald-800 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center text-white">
                          <Target className="h-5 w-5" />
                        </div>
                        Prescrição de Treinamento Calculada
                      </CardTitle>
                      <CardDescription className="text-emerald-700 font-medium">
                        Análise completa dos parâmetros de treinamento baseados no teste de Cooper
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
                            {calculations.trainingFraction.toFixed(4)}
                          </div>
                        </div>

                        {/* Gasto de Oxigênio */}
                        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">
                              ⚡
                            </div>
                            <span className="text-sm font-bold text-slate-700">Gasto de Oxigênio</span>
                          </div>
                          <div className="text-2xl font-black text-blue-600">
                            {calculations.trainingIntensity.toFixed(2)} ml/kg/min
                          </div>
                        </div>

                        {/* Velocidade do Treino */}
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

                        {/* Distância do Treino */}
                        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-sm">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-700">Distância do Treino</span>
                          </div>
                          <div className="text-2xl font-black text-green-600">
                            {calculations.trainingDistance.toFixed(1)}m
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

                        {/* Consumo Total de O2 */}
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

                        {/* Gasto Calórico */}
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

                        {/* Peso Perdido */}
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
                      
                      {/* Botão de Salvar e Mensagens */}
                      <div className="mt-8 space-y-4">
                        {/* Botão de Salvar */}
                        <div className="flex justify-center">
                          <Button
                            onClick={handleSaveTest}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              <>
                                💾 Salvar Teste de Performance
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Mensagem de Sucesso */}
                        {saveSuccess && (
                          <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                            <AlertDescription className="flex items-center gap-2">
                              <span className="text-emerald-600">✅</span>
                              Teste de performance salvo com sucesso! Os dados foram registrados no banco de dados.
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Mensagem de Erro */}
                        {error && (
                          <Alert className="bg-red-50 border-red-200 text-red-800">
                            <AlertDescription className="flex items-center gap-2">
                              <span className="text-red-600">❌</span>
                              {error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
