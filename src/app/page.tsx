import ResponsiveNavigation from '@/components/ResponsiveNavigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveNavigation user={user} />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="mt-6 text-4xl font-extrabold text-gray-900">
            Cooper Pro
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Sistema profissional para avaliação e acompanhamento de performance física
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link
            href="/login"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Fazer Login
          </Link>
          
          <Link
            href="/register"
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Criar Conta
          </Link>
        </div>
        
        <div className="mt-8 text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Funcionalidades
          </h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✓ Cadastro e gerenciamento de avaliandos</li>
            <li>✓ Registro de testes de performance</li>
            <li>✓ Acompanhamento de progresso</li>
            <li>✓ Interface responsiva e moderna</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  )
}
