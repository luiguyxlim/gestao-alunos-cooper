import { getStudent, updateStudent } from '@/lib/actions/students'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

interface EditEvaluateePageProps {
  params: {
    id: string
  }
}

export default async function EditEvaluateePage({ params }: EditEvaluateePageProps) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const student = await getStudent(params.id)

  if (!student) {
    notFound()
  }

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                Sistema de Gestão de Alunos
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
                  className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Avaliandos
                </Link>
                <Link
                  href="/tests"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Testes
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
              href={`/evaluatees/${student.id}`}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para {student.name}
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Editar Avaliando</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Atualize as informações de {student.name}
                </p>
              </div>

              <form action={updateStudent.bind(null, student.id)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      defaultValue={student.name}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Digite o nome completo"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      defaultValue={student.email || ''}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      defaultValue={student.phone || ''}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      name="birth_date"
                      id="birth_date"
                      required
                      defaultValue={formatDateForInput(student.birth_date || null)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Necessário para cálculo da idade no teste de Cooper
                    </p>
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                      Sexo *
                    </label>
                    <select
                      name="gender"
                      id="gender"
                      required
                      defaultValue={student.gender || ''}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Selecione...</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Necessário para classificação do VO2 no teste de Cooper
                    </p>
                  </div>

                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                      Peso Corporal (kg) *
                    </label>
                    <input
                      type="number"
                      name="weight"
                      id="weight"
                      step="0.1"
                      min="1"
                      max="300"
                      required
                      defaultValue={student.weight || ''}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Ex: 70.5"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Necessário para cálculos de gasto calórico
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Endereço
                    </label>
                    <textarea
                      name="address"
                      id="address"
                      rows={3}
                      defaultValue={student.address || ''}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Rua, número, bairro, cidade, CEP"
                    />
                  </div>

                  <div>
                    <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">
                      Contato de Emergência
                    </label>
                    <input
                      type="text"
                      name="emergency_contact"
                      id="emergency_contact"
                      defaultValue={student.emergency_contact || ''}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Nome do contato de emergência"
                    />
                  </div>

                  <div>
                    <label htmlFor="emergency_phone" className="block text-sm font-medium text-gray-700">
                      Telefone de Emergência
                    </label>
                    <input
                      type="tel"
                      name="emergency_phone"
                      id="emergency_phone"
                      defaultValue={student.emergency_phone || ''}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="medical_notes" className="block text-sm font-medium text-gray-700">
                      Observações Médicas
                    </label>
                    <textarea
                      name="medical_notes"
                      id="medical_notes"
                      rows={4}
                      defaultValue={student.medical_notes || ''}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Alergias, medicamentos, condições médicas relevantes..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Link
                    href={`/evaluatees/${student.id}`}
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