import { getPerformanceEvaluation, updatePerformanceEvaluationAction } from '@/lib/actions/performance-evaluation'
import { getAuthenticatedUser } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface EditPerformanceEvaluationPageProps {
  params: {
    id: string
  }
}

export default async function EditPerformanceEvaluationPage({ params }: EditPerformanceEvaluationPageProps) {
  const { id } = await params

  await getAuthenticatedUser()

  const evaluation = await getPerformanceEvaluation(id)

  if (!evaluation) {
    notFound()
  }

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  const formatNumber = (value: number | null | undefined, decimals = 2) => {
    if (value === null || value === undefined) return ''
    return value.toFixed(decimals)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={`/tests/${evaluation.id}`}
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
              <h1 className="text-3xl font-bold text-gray-900">Editar Prescrição de Treino</h1>
              <p className="text-sm text-gray-500 mt-1">
                Ajuste os parâmetros de treino para {evaluation.students?.name || 'avaliando'}. Os resultados calculados serão atualizados automaticamente.
              </p>
            </div>

            <form action={updatePerformanceEvaluationAction} className="space-y-6">
              <input type="hidden" name="id" value={evaluation.id} />
              <input type="hidden" name="student_id" value={evaluation.student_id} />
              <input type="hidden" name="cooper_distance" value={evaluation.cooper_distance} />
              <input type="hidden" name="vo2_max" value={evaluation.vo2_max} />

              <div>
                <label htmlFor="test_date" className="block text-sm font-medium text-gray-700">
                  Data do teste
                </label>
                <input
                  id="test_date"
                  name="test_date"
                  type="date"
                  required
                  defaultValue={formatDateForInput(evaluation.test_date)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="intensity_percentage" className="block text-sm font-medium text-gray-700">
                    Intensidade alvo (%)
                  </label>
                  <input
                    id="intensity_percentage"
                    name="intensity_percentage"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    required
                    defaultValue={evaluation.intensity_percentage ?? ''}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Ex: 75"
                  />
                  <p className="mt-1 text-xs text-gray-500">Percentual de intensidade em relação ao VO₂máx.</p>
                </div>

                <div>
                  <label htmlFor="training_time" className="block text-sm font-medium text-gray-700">
                    Tempo de treino (minutos)
                  </label>
                  <input
                    id="training_time"
                    name="training_time"
                    type="number"
                    min={0}
                    step={1}
                    required
                    defaultValue={evaluation.training_time ?? ''}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Ex: 30"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="body_weight" className="block text-sm font-medium text-gray-700">
                  Peso corporal (kg)
                </label>
                <input
                  id="body_weight"
                  name="body_weight"
                  type="number"
                  min={0}
                  step={0.1}
                  required
                  defaultValue={evaluation.body_weight ?? ''}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Ex: 70.5"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Observações
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  defaultValue={evaluation.observations ?? ''}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Recomendações adicionais, ajustes específicos, etc."
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">Resumo do Cooper</h3>
                  <p className="text-sm text-blue-800 space-y-1">
                    <span className="block"><strong>Distância:</strong> {evaluation.cooper_distance ?? '-'} m</span>
                    <span className="block"><strong>VO₂ máx:</strong> {formatNumber(evaluation.vo2_max)} ml/kg/min</span>
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Resultados atuais</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <span>Distância: {formatNumber(evaluation.training_distance, 0)} m</span>
                    <span>Velocidade: {formatNumber(evaluation.training_velocity)} m/min</span>
                    <span>Intensidade (ml/kg/min): {formatNumber(evaluation.training_intensity)}</span>
                    <span>O₂ total: {formatNumber(evaluation.total_o2_consumption)} L</span>
                    <span>Gasto calórico: {formatNumber(evaluation.caloric_expenditure, 0)} kcal</span>
                    <span>Perda de peso: {formatNumber(evaluation.weight_loss)} g</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Link
                  href={`/tests/${evaluation.id}`}
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

