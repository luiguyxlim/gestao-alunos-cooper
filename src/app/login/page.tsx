'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import DebugLogger from '@/components/DebugLogger'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    logger.authInfo('Página de login carregada');
    
    // Limpar tokens expirados ao carregar a página
    const clearExpiredTokens = async () => {
      try {
        logger.authDebug('Iniciando limpeza de tokens expirados');
        await supabase.auth.signOut();
        logger.authDebug('Tokens limpos com sucesso');
      } catch (error) {
        logger.authError('Erro na limpeza de tokens', error as Error);
      }
    }
    clearExpiredTokens()
  }, [supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    logger.authInfo('Tentativa de login iniciada', { email });

    try {
      // Limpar sessão anterior antes de tentar login
      logger.authDebug('Limpando sessão anterior');
      await supabase.auth.signOut();
      logger.authDebug('Sessão anterior limpa');
      
      logger.authDebug('Iniciando autenticação com Supabase', { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logger.authError('Erro na autenticação', error, { 
          email, 
          errorMessage: error.message,
          errorCode: error.status 
        });
        
        if (error.message === 'Invalid login credentials') {
          setError('Email ou senha incorretos. Verifique suas credenciais.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu email antes de fazer login.')
          logger.authWarn('Email não confirmado', { email });
        } else {
          setError(error.message)
          logger.authError('Erro desconhecido na autenticação', error);
        }
      } else {
        logger.authInfo('Login realizado com sucesso', { 
          email, 
          userId: data.user?.id,
          emailConfirmed: data.user?.email_confirmed_at ? 'Sim' : 'Não'
        });
        
        logger.authDebug('Redirecionando para dashboard');
        router.push('/dashboard')
        router.refresh()
      }
    } catch (unexpectedError) {
      logger.authError('Erro inesperado no processo de login', unexpectedError as Error, { email });
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
      logger.authDebug('Processo de login finalizado');
    }
  }

  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Cooper Pro
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Gerencie avaliandos e testes de performance
        </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Cadastre-se
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
    <DebugLogger />
    </>
  )
}