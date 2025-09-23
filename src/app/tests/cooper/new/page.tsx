'use client'

import { useState, useEffect } from 'react'
import ResponsiveNavigation from '@/components/ResponsiveNavigation'
import { createTest } from '@/lib/actions/tests'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Student } from '@/lib/types'

// Declaração global para a função calculateCooperVO2
declare global {
  interface Window {
    calculateCooperVO2: () => void;
  }
}

interface NewCooperTestPageProps {
  searchParams: Promise<{
    evaluatee_id?: string
  }>
}

export default function NewCooperTestPage({ searchParams }: NewCooperTestPageProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        // Fetch students filtered by user_id
        const { data: studentsData, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .eq('active', true)
          .order('name')

        if (error) {
          console.error('Error fetching students:', error)
          return
        }

        const resolvedSearchParams = await searchParams
        
        setUser(user)
        setStudents(studentsData || [])
        setSelectedStudentId(resolvedSearchParams.evaluatee_id || '')
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, searchParams])

  useEffect(() => {
    if (students.length === 0) return

    // Função para calcular VO2 do Cooper
    window.calculateCooperVO2 = function() {
      // Calculando VO2 máximo baseado no teste de Cooper
      
      const distanceInput = document.getElementById('cooper_distance') as HTMLInputElement
      const studentSelect = document.getElementById('evaluatee_id') as HTMLSelectElement
      const vo2Input = document.getElementById('vo2_max') as HTMLInputElement
      const cooperResults = document.getElementById('cooper-results')
      
      if (!distanceInput || !studentSelect || !vo2Input) {
        alert('Erro: Elementos do formulário não encontrados.')
        return
      }
      
      const distance = parseFloat(distanceInput.value)
      const selectedStudentId = studentSelect.value
      
      if (!distance || isNaN(distance)) {
        alert('Por favor, preencha a distância percorrida.')
        return
      }
      
      if (!selectedStudentId) {
        alert('Por favor, selecione um avaliando.')
        return
      }
      
      if (distance < 500 || distance > 5000) {
        alert('Distância deve estar entre 500 e 5000 metros.')
        return
      }
      
      const selectedStudent = students.find(s => s.id === selectedStudentId)
      
      if (!selectedStudent || !selectedStudent.birth_date || !selectedStudent.gender) {
        alert('O avaliando selecionado não possui data de nascimento ou sexo cadastrados.')
        return
      }
      
      // Calcular idade
      const birthDate = new Date(selectedStudent.birth_date)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      const gender = selectedStudent.gender
      
      // Fórmula do Cooper
      const vo2Max = Math.max(0, Math.round(((distance - 504.9) / 44.73) * 100) / 100)
      
      // Classificação
      const classifications = {
        masculino: {
          '20-29': { excellent: 52, good: 46, fair: 42, poor: 37 },
          '30-39': { excellent: 50, good: 44, fair: 40, poor: 35 },
          '40-49': { excellent: 48, good: 42, fair: 38, poor: 33 },
          '50-59': { excellent: 45, good: 39, fair: 35, poor: 30 },
          '60+': { excellent: 42, good: 36, fair: 32, poor: 28 }
        },
        feminino: {
          '20-29': { excellent: 44, good: 39, fair: 35, poor: 31 },
          '30-39': { excellent: 42, good: 37, fair: 33, poor: 29 },
          '40-49': { excellent: 40, good: 35, fair: 31, poor: 27 },
          '50-59': { excellent: 37, good: 32, fair: 28, poor: 24 },
          '60+': { excellent: 35, good: 30, fair: 26, poor: 22 }
        }
      }
      
      const ageGroup = age < 30 ? '20-29' : age < 40 ? '30-39' : age < 50 ? '40-49' : age < 60 ? '50-59' : '60+'
      const genderKey = (gender === 'masculino' || gender === 'feminino') ? gender : 'masculino'
      const classification = classifications[genderKey]?.[ageGroup] || classifications['masculino']['20-29']
      
      let classificationText = 'Muito Fraco'
      if (vo2Max >= classification.excellent) classificationText = 'Excelente'
      else if (vo2Max >= classification.good) classificationText = 'Bom'
      else if (vo2Max >= classification.fair) classificationText = 'Regular'
      else if (vo2Max >= classification.poor) classificationText = 'Fraco'
      
      // Atualizar interface
      vo2Input.value = vo2Max.toString()
      
      const calculatedVo2El = document.getElementById('calculated-vo2')
      const classificationEl = document.getElementById('vo2-classification')
      const distanceKmEl = document.getElementById('distance-km')
      
      if (calculatedVo2El) calculatedVo2El.textContent = vo2Max.toString()
      if (classificationEl) classificationEl.textContent = classificationText
      if (distanceKmEl) distanceKmEl.textContent = (distance / 1000).toFixed(2)
      
      // Campos ocultos
      const ageHidden = document.getElementById('cooper_age_hidden') as HTMLInputElement
      const genderHidden = document.getElementById('cooper_gender_hidden') as HTMLInputElement
      if (ageHidden) ageHidden.value = age.toString()
      if (genderHidden) genderHidden.value = gender
      
      // Mostrar resultados
      if (cooperResults) {
        cooperResults.classList.remove('hidden')
      }
      
      // Cálculo de VO2 concluído
    }

    // Adicionar event listener para o botão
    const calculateButton = document.getElementById('calculate-vo2')
    if (calculateButton) {
      calculateButton.addEventListener('click', window.calculateCooperVO2)
    }

    // Cleanup function
    return () => {
      if (calculateButton) {
        calculateButton.removeEventListener('click', window.calculateCooperVO2)
      }
    }
  }, [students])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <ResponsiveNavigation user={user} />

      <main className="max-w-4xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Navegação */}
          <div className="flex items-center gap-4">
            <Link
              href={selectedStudentId ? `/tests?evaluatee_id=${selectedStudentId}` : '/tests'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-slate-700 hover:text-indigo-600 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para Testes
            </Link>
          </div>

          {/* Cabeçalho Principal */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
                🏃‍♂️
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  Novo Teste de Cooper
                </h1>
                <p className="text-slate-600 mt-1">
                  Avalie a capacidade aeróbica através do teste de corrida de 12 minutos
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20">
            <div className="px-4 py-5 sm:p-6">

            <form action={createTest} className="space-y-8">
              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="evaluatee_id" className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center text-white text-xs">
                        👤
                      </div>
                      Avaliando *
                    </label>
                    <select
                      name="evaluatee_id"
                      id="evaluatee_id"
                      required
                      defaultValue={selectedStudentId || ''}
                      className="block w-full px-4 py-3 border-2 border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="">Selecione um avaliando...</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="test_date" className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded flex items-center justify-center text-white text-xs">
                        📅
                      </div>
                      Data do Teste *
                    </label>
                    <input
                      type="date"
                      name="test_date"
                      id="test_date"
                      required
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="block w-full px-4 py-3 border-2 border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
                    />
                  </div>

                  {/* Campo oculto para tipo de teste - sempre Cooper */}
                  <input type="hidden" name="test_type" value="cooper_vo2" />
                </div>

                {/* Pré-requisitos do Teste de Cooper */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6 mb-8 shadow-lg">
                  <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center text-white">
                      ⚠️
                    </div>
                    Pré-requisitos do Teste de Cooper
                  </h3>
                  <div className="text-sm text-amber-700 space-y-4">
                    <p className="font-semibold text-amber-800">Antes do teste, verifique se:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">✓</div>
                        <span className="font-medium">O avaliando possui idade e sexo cadastrados (obrigatórios para cálculo do VO2)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">✓</div>
                        <span className="font-medium">O avaliando está em condições físicas adequadas para corrida</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">✓</div>
                        <span className="font-medium">Não há contraindicações médicas para exercício intenso</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">✓</div>
                        <span className="font-medium">O local do teste possui pista ou percurso medido adequadamente</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">✓</div>
                        <span className="font-medium">Condições climáticas são favoráveis (evitar calor excessivo)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">✓</div>
                        <span className="font-medium">O avaliando compreende as instruções do teste</span>
                      </div>
                    </div>
                    <div className="bg-amber-100 rounded-xl p-4 mt-4">
                      <p className="font-bold text-amber-800">⏱️ Duração: 12 minutos de corrida contínua</p>
                      <p className="font-bold text-amber-800">🎯 Objetivo: Percorrer a maior distância possível</p>
                    </div>
                  </div>
                </div>

                {/* Dados do Teste de Cooper */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                      📊
                    </div>
                    Dados do Teste de Cooper
                  </h3>
                  <p className="text-sm text-blue-700 mb-6 bg-blue-100 rounded-xl p-4">
                    Preencha a distância percorrida em 12 minutos. A idade e sexo serão obtidos automaticamente do avaliando selecionado.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="cooper_distance" className="block text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded flex items-center justify-center text-white text-xs">
                          📏
                        </div>
                        Distância Percorrida (metros) *
                      </label>
                      <input
                        type="number"
                        name="cooper_distance"
                        id="cooper_distance"
                        min="500"
                        max="5000"
                        step="1"
                        required
                        className="block w-full px-4 py-3 border-2 border-blue-200 rounded-xl shadow-sm placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
                        placeholder="Ex: 2400"
                      />
                      <p className="text-xs text-blue-600 mt-2 bg-blue-50 rounded-lg px-3 py-1">Distância entre 500 e 5000 metros</p>
                    </div>

                    <div>
                      <label htmlFor="vo2_max" className="block text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded flex items-center justify-center text-white text-xs">
                          💨
                        </div>
                        VO2 Max (ml/kg/min)
                      </label>
                      <input
                        type="number"
                        name="vo2_max"
                        id="vo2_max"
                        min="0"
                        step="0.1"
                        className="block w-full px-4 py-3 border-2 border-blue-200 rounded-xl shadow-sm placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm bg-blue-50/50 backdrop-blur-sm transition-all duration-200"
                        placeholder="Calculado automaticamente"
                        readOnly
                      />
                      <p className="text-xs text-blue-600 mt-2 bg-blue-50 rounded-lg px-3 py-1">Será calculado automaticamente</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      id="calculate-vo2"
                      className="inline-flex items-center gap-3 px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      Calcular VO2 Máximo
                    </button>
                  </div>

                  <div id="cooper-results" className="hidden mt-6 p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl shadow-lg">
                    <h4 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-green-600 rounded-lg flex items-center justify-center text-white">
                        🎯
                      </div>
                      Resultados do Teste de Cooper
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">VO2 Máximo</p>
                        <p className="text-2xl font-black text-emerald-900"><span id="calculated-vo2">-</span> <span className="text-sm font-medium">ml/kg/min</span></p>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Classificação</p>
                        <p className="text-lg font-bold text-emerald-900"><span id="vo2-classification">-</span></p>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Distância</p>
                        <p className="text-2xl font-black text-emerald-900"><span id="distance-km">-</span> <span className="text-sm font-medium">km</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Campos ocultos para dados do teste de Cooper */}
                  <input type="hidden" id="cooper_age_hidden" name="cooper_age" />
                  <input type="hidden" id="cooper_gender_hidden" name="cooper_gender" />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded flex items-center justify-center text-white text-xs">
                      📝
                    </div>
                    Observações
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    rows={4}
                    className="block w-full px-4 py-3 border-2 border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm resize-none bg-white/80 backdrop-blur-sm transition-all duration-200"
                    placeholder="Observações sobre o teste, condições, recomendações..."
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-8 border-t-2 border-slate-200">
                <Link
                  href={selectedStudentId ? `/tests?evaluatee_id=${selectedStudentId}` : '/tests'}
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3 border-2 border-slate-300 rounded-xl shadow-lg bg-white/80 backdrop-blur-sm text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-300 transform hover:scale-105"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-3 px-6 py-3 border border-transparent rounded-xl shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-bold text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002 2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  Criar Teste
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}