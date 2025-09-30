import { getTest, updateCooperTest } from '@/lib/actions/tests'
import { getStudents } from '@/lib/actions/students'
import { getAuthenticatedUser } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface EditCooperTestPageProps {
  params: {
    id: string
  }
}

export default async function EditCooperTestPage({ params }: EditCooperTestPageProps) {
  const { id } = await params

  await getAuthenticatedUser()

  const [test, students] = await Promise.all([
    getTest(id),
    getStudents(),
  ])

  if (!test || test.test_type !== 'cooper_vo2') {
    notFound()
  }

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={`/tests/${test.id}`}
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para o teste
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-6 py-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Editar Teste de Cooper</h1>
              <p className="text-sm text-gray-500 mt-1">
                Atualize as informações do teste de {test.students?.name || 'avaliando'} realizado em {formatDateForInput(test.test_date)}.
              </p>
            </div>

            <form action={updateCooperTest} className="space-y-6">
              <input type="hidden" name="id" value={test.id} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">
                    Avaliando
                  </label>
                  <select
                    id="student_id"
                    name="student_id"
                    required
                    defaultValue={test.student_id}
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
                    Data do teste
                  </label>
                  <input
                    id="test_date"
                    name="test_date"
                    type="date"
                    required
                    defaultValue={formatDateForInput(test.test_date)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cooper_distance" className="block text-sm font-medium text-gray-700">
                    Distância percorrida (metros)
                  </label>
                  <input
                    id="cooper_distance"
                    name="cooper_distance"
                    type="number"
                    min={500}
                    max={5000}
                    step={1}
                    required
                    defaultValue={test.cooper_test_distance ?? ''}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Ex: 2400"
                  />
                  <p className="mt-1 text-xs text-gray-500">Faixa válida: 500 a 5000 metros.</p>
                </div>

                <div>
                  <label htmlFor="vo2_max" className="block text-sm font-medium text-gray-700">
                    VO₂ máximo (ml/kg/min)
                  </label>
                  <input
                    id="vo2_max"
                    name="vo2_max"
                    type="number"
                    min={0}
                    step={0.1}
                    defaultValue={test.vo2_max ?? ''}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Ex: 45.2"
                  />
                  <p className="mt-1 text-xs text-gray-500">Se deixado vazio, o valor será recalculado automaticamente.</p>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Observações
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  defaultValue={test.notes ?? ''}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Observações sobre o teste, condições de aplicação, recomendações..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Link
                  href={`/tests/${test.id}`}
                  className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 rounded-md border border-transparent text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

