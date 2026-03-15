import type { Metadata } from 'next'
import ResponsiveNavigation from '@/components/ResponsiveNavigation'
import GuiaViewerLoader from '@/components/guia/GuiaViewerLoader'
import { getAuthenticatedUser } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'GUIA | Cooper Pro',
  description: 'Visualização completa do guia em PDF com busca, zoom e download seguro.',
}

export default async function GuiaPage() {
  const { user } = await getAuthenticatedUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <ResponsiveNavigation user={user} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <GuiaViewerLoader />
      </main>
    </div>
  )
}
