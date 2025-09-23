import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cooper Pro - Sistema de Avaliação de Performance Física',
  description: 'Sistema profissional para avaliação e acompanhamento de performance física. Gerencie avaliandos, registre testes de Cooper e acompanhe o progresso de forma eficiente.',
  keywords: ['cooper', 'teste de cooper', 'avaliação física', 'performance', 'educação física', 'fitness'],
  openGraph: {
    title: 'Cooper Pro - Sistema de Avaliação de Performance Física',
    description: 'Sistema profissional para avaliação e acompanhamento de performance física',
    type: 'website',
    locale: 'pt_BR'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cooper Pro - Sistema de Avaliação de Performance Física',
    description: 'Sistema profissional para avaliação e acompanhamento de performance física'
  }
}

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  // Redireciona diretamente para o login se não estiver autenticado
  redirect('/login')
}
