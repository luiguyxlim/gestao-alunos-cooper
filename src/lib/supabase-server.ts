import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthApiError } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side Supabase client
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

function isInvalidRefreshToken(error: unknown) {
  if (error instanceof AuthApiError) {
    const message = error.message?.toLowerCase() ?? ''
    return message.includes('invalid refresh token') || message.includes('refresh token not found')
  }
  return false
}

async function clearSupabaseCookies() {
  const cookieStore = await cookies()
  cookieStore
    .getAll()
    .filter(({ name }) => name.startsWith('sb-'))
    .forEach(({ name }) => {
      try {
        cookieStore.delete(name)
      } catch (error) {
        console.error('[AUTH] Falha ao remover cookie Supabase', { name, error })
      }
    })
}

export async function getAuthenticatedUser(supabase?: ReturnType<typeof createServerClient>) {
  const client = supabase ?? (await createServerSupabaseClient())

  try {
    const {
      data: { user },
      error,
    } = await client.auth.getUser()

    if (error) {
      if (isInvalidRefreshToken(error)) {
        await clearSupabaseCookies()
        try {
          await client.auth.signOut()
        } catch (signOutError) {
          console.warn('[AUTH] Erro ao fazer signOut após refresh token inválido', signOutError)
        }
        redirect('/login?session=expired')
      }
      throw error
    }

    if (!user) {
      redirect('/login')
    }

    return { supabase: client, user }
  } catch (error) {
    if (isInvalidRefreshToken(error)) {
      await clearSupabaseCookies()
      try {
        await client.auth.signOut()
      } catch (signOutError) {
        console.warn('[AUTH] Erro ao limpar sessão após refresh token inválido', signOutError)
      }
      redirect('/login?session=expired')
    }
    throw error
  }
}