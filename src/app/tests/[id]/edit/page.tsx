import { getTest, updateTest } from '@/lib/actions/tests'
import { getStudents } from '@/lib/actions/students'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

interface EditTestPageProps {
  params: {
    id: string
  }
}

export default async function EditTestPage({ params }: EditTestPageProps) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const test = await getTest(id)
  const students = await getStudents()

  if (!test) {
    notFound()
  }

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  const getTestTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'cooper_vo2': 'Cooper VO2 (Teste de 12 minutos)',
      'physical': 'Físico',
      'technical': 'Técnico',
      'tactical': 'Tático',
      'psychological': 'Psicológico',
      'medical': 'Médico',
      'other': 'Outro'
    }
    return types[type] || 'Tipo não identificado'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                Cooper Pro
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
              href={`/tests/${test.id}`}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para o Teste
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Editar Teste</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Atualize as informações do teste de {test.evaluatees.name} - {getTestTypeLabel(test.test_type)}
                </p>
              </div>

              <form action={updateTest} className="space-y-6">
                <input type="hidden" name="id" value={test.id} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="evaluatee_id" className="block text-sm font-medium text-gray-700">
                    Avaliando
                  </label>
                  <select
                    name="evaluatee_id"
                    id="evaluatee_id"
                      required
                      defaultValue={test.evaluatees.id}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    <label htmlFor="test_date" className="block text-sm font-medium text-gray-700">
                      Data do Teste *
                    </label>
                    <input
                      type="date"
                      name="test_date"
                      id="test_date"
                      required
                      defaultValue={formatDateForInput(test.test_date)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="test_type" className="block text-sm font-medium text-gray-700">
                      Tipo de Teste *
                    </label>
                    <select
                      name="test_type"
                      id="test_type"
                      required
                      defaultValue={test.test_type}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="cooper_vo2">Cooper VO2 (Teste de 12 minutos)</option>
                      <option value="physical">Físico</option>
                      <option value="technical">Técnico</option>
                      <option value="tactical">Tático</option>
                      <option value="psychological">Psicológico</option>
                      <option value="medical">Médico</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                </div>

                {/* Campos específicos para Teste de Cooper */}
                {test.test_type === 'cooper_vo2' ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Teste de Cooper</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Edite a distância percorrida em 12 minutos e o VO2 máximo calculado.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="cooper_distance" className="block text-sm font-medium text-gray-700">
                          Distância Percorrida (metros) *
                        </label>
                        <input
                          type="number"
                          name="cooper_distance"
                          id="cooper_distance"
                          min="500"
                          max="5000"
                          step="1"
                          defaultValue={test.cooper_distance || ''}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Ex: 2400"
                        />
                        <p className="text-xs text-gray-500 mt-1">Distância entre 500 e 5000 metros</p>
                      </div>

                      <div>
                        <label htmlFor="vo2_max" className="block text-sm font-medium text-gray-700">
                          VO2 Max (ml/kg/min)
                        </label>
                        <input
                          type="number"
                          name="vo2_max"
                          id="vo2_max"
                          min="0"
                          step="0.1"
                          defaultValue={test.vo2_max || ''}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Ex: 45.2"
                        />
                        <p className="text-xs text-gray-500 mt-1">VO2 máximo calculado</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Campos para outros tipos de teste */
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas de Performance</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Avalie cada métrica de 0 a 10 (deixe em branco se não aplicável)
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="speed" className="block text-sm font-medium text-gray-700">
                          Velocidade
                        </label>
                        <input
                          type="number"
                          name="speed"
                          id="speed"
                          min="0"
                          max="10"
                          step="0.1"
                          defaultValue={test.speed || ''}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="0.0 - 10.0"
                        />
                      </div>

                      <div>
                        <label htmlFor="agility" className="block text-sm font-medium text-gray-700">
                          Agilidade
                        </label>
                        <input
                          type="number"
                          name="agility"
                          id="agility"
                          min="0"
                          max="10"
                          step="0.1"
                          defaultValue={test.agility || ''}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="0.0 - 10.0"
                        />
                      </div>

                      <div>
                        <label htmlFor="strength" className="block text-sm font-medium text-gray-700">
                          Força
                        </label>
                        <input
                          type="number"
                          name="strength"
                          id="strength"
                          min="0"
                          max="10"
                          step="0.1"
                          defaultValue={test.strength || ''}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="0.0 - 10.0"
                        />
                      </div>

                      <div>
                        <label htmlFor="endurance" className="block text-sm font-medium text-gray-700">
                          Resistência
                        </label>
                        <input
                          type="number"
                          name="endurance"
                          id="endurance"
                          min="0"
                          max="10"
                          step="0.1"
                          defaultValue={test.endurance || ''}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="0.0 - 10.0"
                        />
                      </div>

                      <div>
                        <label htmlFor="flexibility" className="block text-sm font-medium text-gray-700">
                          Flexibilidade
                        </label>
                        <input
                          type="number"
                          name="flexibility"
                          id="flexibility"
                          min="0"
                          max="10"
                          step="0.1"
                          defaultValue={test.flexibility || ''}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="0.0 - 10.0"
                        />
                      </div>

                      <div>
                        <label htmlFor="coordination" className="block text-sm font-medium text-gray-700">
                          Coordenação
                        </label>
                        <input
                          type="number"
                          name="coordination"
                          id="coordination"
                          min="0"
                          max="10"
                          step="0.1"
                          defaultValue={test.coordination || ''}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="0.0 - 10.0"
                        />
                      </div>

                      <div>
                        <label htmlFor="balance" className="block text-sm font-medium text-gray-700">
                          Equilíbrio
                        </label>
                        <input
                          type="number"
                          name="balance"
                          id="balance"
                          min="0"
                          max="10"
                          step="0.1"
                          defaultValue={test.balance || ''}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="0.0 - 10.0"
                        />
                      </div>

                      <div>
                        <label htmlFor="power" className="block text-sm font-medium text-gray-700">
                          Potência
                        </label>
                        <input
                          type="number"
                          name="power"
                          id="power"
                          min="0"
                          max="10"
                          step="0.1"
                          defaultValue={test.power || ''}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="0.0 - 10.0"
                        />
                      </div>

                      <div>
                        <label htmlFor="reaction_time" className="block text-sm font-medium text-gray-700">
                          Tempo de Reação (ms)
                        </label>
                        <input
                          type="number"
                          name="reaction_time"
                          id="reaction_time"
                          min="0"
                          step="0.1"
                          defaultValue={test.reaction_time || ''}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Ex: 250.5"
                        />
                      </div>

                      <div>
                        <label htmlFor="vo2_max" className="block text-sm font-medium text-gray-700">
                          VO2 Max (ml/kg/min)
                        </label>
                        <input
                          type="number"
                          name="vo2_max"
                          id="vo2_max"
                          min="0"
                          step="0.1"
                          defaultValue={test.vo2_max || ''}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Ex: 45.2"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Observações
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    rows={4}
                    defaultValue={test.notes || ''}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Observações sobre o teste, condições, recomendações..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Link
                    href={`/tests/${test.id}`}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Salvar Alterações
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