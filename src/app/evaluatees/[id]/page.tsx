import { getStudent } from '@/lib/actions/students'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

interface EvaluateePageProps {
  params: {
    id: string
  }
}

export default async function EvaluateePage({ params }: EvaluateePageProps) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const student = await getStudent(id)

  if (!student) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informado'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
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
                Olá, {user?.user_metadata?.full_name || user?.email || 'Usuário'}
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
              href="/evaluatees"
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para Avaliandos
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Cadastrado em {formatDate(student.created_at)}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Link
                    href={`/evaluatees/${student.id}/edit`}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/tests/new?evaluatee_id=${student.id}`}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Novo Teste
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    Informações Pessoais
                  </h2>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {student.email || 'Não informado'}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {student.phone || 'Não informado'}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Data de Nascimento</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {student.birth_date ? (
                        <>
                          {formatDate(student.birth_date)}
                          {calculateAge(student.birth_date) && (
                            <span className="text-gray-500 ml-2">
                              ({calculateAge(student.birth_date)} anos)
                            </span>
                          )}
                        </>
                      ) : (
                        'Não informado'
                      )}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Gênero</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {student.gender ? (
                        student.gender.charAt(0).toUpperCase() + student.gender.slice(1)
                      ) : (
                        'Não informado'
                      )}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Peso Corporal</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {student.weight ? (
                        `${student.weight} kg`
                      ) : (
                        'Não informado'
                      )}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Endereço</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {student.address || 'Não informado'}
                    </dd>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    Contato de Emergência
                  </h2>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nome</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {student.emergency_contact || 'Não informado'}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {student.emergency_phone || 'Não informado'}
                    </dd>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                      Observações Médicas
                    </h3>
                    <div className="mt-2">
                      <dd className="text-sm text-gray-900">
                        {student.medical_notes ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            {student.medical_notes}
                          </div>
                        ) : (
                          <div className="text-gray-500 italic">
                            Nenhuma observação médica registrada
                          </div>
                        )}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Testes de Performance</h3>
                    <p className="text-sm text-gray-500">Histórico de avaliações do avaliando</p>
                  </div>
                  <Link
                    href={`/tests?evaluatee_id=${student.id}`}
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    Ver todos os testes →
                  </Link>
                </div>
                
                <div className="mt-4 bg-gray-50 rounded-md p-4">
                  <p className="text-sm text-gray-600 text-center">
                    Os testes de performance serão exibidos aqui quando implementados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}