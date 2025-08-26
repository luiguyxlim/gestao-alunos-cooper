import ResponsiveNavigation from '@/components/ResponsiveNavigation'
import { createTest } from '@/lib/actions/tests'
import { getStudents } from '@/lib/actions/students'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface NewCooperTestPageProps {
  searchParams: Promise<{
    student_id?: string
  }>
}

export default async function NewCooperTestPage({ searchParams }: NewCooperTestPageProps) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const students = await getStudents()
  const selectedStudentId = resolvedSearchParams.student_id

  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveNavigation user={user} />

      <main className="max-w-4xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={selectedStudentId ? `/tests?student_id=${selectedStudentId}` : '/tests'}
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
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Novo Teste de Cooper</h1>
              <p className="text-sm text-gray-500 mt-1">
                Registre uma nova avaliação do teste de Cooper (12 minutos)
              </p>
            </div>

            <form action={createTest} className="space-y-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Avaliando *
                    </label>
                    <select
                      name="student_id"
                      id="student_id"
                      required
                      defaultValue={selectedStudentId || ''}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
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
                    <label htmlFor="test_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Data do Teste *
                    </label>
                    <input
                      type="date"
                      name="test_date"
                      id="test_date"
                      required
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                    />
                  </div>

                  {/* Campo oculto para tipo de teste - sempre Cooper */}
                  <input type="hidden" name="test_type" value="cooper_vo2" />
                </div>

                {/* Pré-requisitos do Teste de Cooper */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-yellow-800 mb-3">Pré-requisitos do Teste de Cooper</h3>
                  <div className="text-sm text-yellow-700 space-y-2">
                    <p><strong>Antes do teste, verifique se:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>O avaliando possui idade e sexo cadastrados (obrigatórios para cálculo do VO2)</li>
                      <li>O avaliando está em condições físicas adequadas para corrida</li>
                      <li>Não há contraindicações médicas para exercício intenso</li>
                      <li>O local do teste possui pista ou percurso medido adequadamente</li>
                      <li>Condições climáticas são favoráveis (evitar calor excessivo)</li>
                      <li>O avaliando compreende as instruções do teste</li>
                    </ul>
                    <p className="mt-3"><strong>Duração:</strong> 12 minutos de corrida contínua</p>
                    <p><strong>Objetivo:</strong> Percorrer a maior distância possível</p>
                  </div>
                </div>

                {/* Dados do Teste de Cooper */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Teste de Cooper</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Preencha a distância percorrida em 12 minutos. A idade e sexo serão obtidos automaticamente do avaliando selecionado.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="cooper_distance" className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                        placeholder="Ex: 2400"
                      />
                      <p className="text-xs text-gray-500 mt-1">Distância entre 500 e 5000 metros</p>
                    </div>

                    <div>
                      <label htmlFor="vo2_max" className="block text-sm font-medium text-gray-700 mb-1">
                        VO2 Max (ml/kg/min)
                      </label>
                      <input
                        type="number"
                        name="vo2_max"
                        id="vo2_max"
                        min="0"
                        step="0.1"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm bg-gray-50"
                        placeholder="Calculado automaticamente"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Será calculado automaticamente</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      id="calculate-vo2"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Calcular VO2 Máximo
                    </button>
                  </div>

                  <div id="cooper-results" className="hidden mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Resultados do Teste de Cooper</h4>
                    <div className="text-sm text-blue-800">
                      <p><strong>VO2 Máximo:</strong> <span id="calculated-vo2">-</span> ml/kg/min</p>
                      <p><strong>Classificação:</strong> <span id="vo2-classification">-</span></p>
                      <p><strong>Distância:</strong> <span id="distance-km">-</span> km</p>
                    </div>
                  </div>

                  {/* Campos ocultos para dados do teste de Cooper */}
                  <input type="hidden" id="cooper_age_hidden" name="cooper_age" />
                  <input type="hidden" id="cooper_gender_hidden" name="cooper_gender" />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm resize-none"
                    placeholder="Observações sobre o teste, condições, recomendações..."
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-reverse space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                <Link
                  href={selectedStudentId ? `/tests?student_id=${selectedStudentId}` : '/tests'}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002 2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Criar Teste
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <script dangerouslySetInnerHTML={{
        __html: `
          // Dados dos estudantes para busca automática de idade e sexo
          const studentsData = ${JSON.stringify(students.map(s => ({
            id: s.id,
            name: s.name,
            birth_date: s.birth_date,
            gender: s.gender
          })))};
          
          document.addEventListener('DOMContentLoaded', function() {
            const studentSelect = document.getElementById('student_id');
            const calculateBtn = document.getElementById('calculate-vo2');
            const cooperResults = document.getElementById('cooper-results');
            const vo2Input = document.getElementById('vo2_max');
            
            // Calcular VO2 máximo
            calculateBtn.addEventListener('click', function() {
              const distance = parseFloat(document.getElementById('cooper_distance').value);
              const selectedStudentId = studentSelect.value;
              
              if (!distance) {
                alert('Por favor, preencha a distância percorrida.');
                return;
              }
              
              if (!selectedStudentId) {
                alert('Por favor, selecione um avaliando.');
                return;
              }
              
              if (distance < 500 || distance > 5000) {
                alert('Distância deve estar entre 500 e 5000 metros.');
                return;
              }
              
              // Buscar dados do estudante selecionado
              const selectedStudent = studentsData.find(s => s.id === selectedStudentId);
              
              if (!selectedStudent || !selectedStudent.birth_date || !selectedStudent.gender) {
                alert('O avaliando selecionado não possui data de nascimento ou sexo cadastrados. Por favor, complete o cadastro do avaliando antes de realizar o teste.');
                return;
              }
              
              // Calcular idade
              const birthDate = new Date(selectedStudent.birth_date);
              const today = new Date();
              let age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
              
              const gender = selectedStudent.gender;
              
              // Fórmula do Cooper: VO2max = (distância em metros - 504.9) / 44.73
              const vo2Max = Math.max(0, Math.round(((distance - 504.9) / 44.73) * 100) / 100);
              
              // Classificação baseada na idade e gênero
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
              };
              
              const ageGroup = age < 30 ? '20-29' : 
                               age < 40 ? '30-39' : 
                               age < 50 ? '40-49' : 
                               age < 60 ? '50-59' : '60+';
              
              const classification = classifications[gender][ageGroup];
              let classificationText = 'Muito Fraco';
              
              if (vo2Max >= classification.excellent) classificationText = 'Excelente';
              else if (vo2Max >= classification.good) classificationText = 'Bom';
              else if (vo2Max >= classification.fair) classificationText = 'Regular';
              else if (vo2Max >= classification.poor) classificationText = 'Fraco';
              
              // Atualizar resultados
              document.getElementById('calculated-vo2').textContent = vo2Max;
              document.getElementById('vo2-classification').textContent = classificationText;
              document.getElementById('distance-km').textContent = (distance / 1000).toFixed(2);
              
              // Preencher campo VO2 Max
              vo2Input.value = vo2Max;
              
              // Preencher campos ocultos para envio do formulário
              document.getElementById('cooper_age_hidden').value = age;
              document.getElementById('cooper_gender_hidden').value = gender;
              
              // Mostrar resultados
              cooperResults.classList.remove('hidden');
            });
          });
        `
      }} />
    </div>
  )
}