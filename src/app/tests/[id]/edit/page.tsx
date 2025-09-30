import { getTest } from '@/lib/actions/tests'
import { getAuthenticatedUser } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'

interface EditRouteProps {
  params: {
    id: string
  }
}

export default async function EditRoute({ params }: EditRouteProps) {
  const { id } = await params

  await getAuthenticatedUser()

  const test = await getTest(id)

  if (!test) {
    notFound()
  }

  switch (test.test_type) {
    case 'cooper_vo2':
      redirect(`/tests/cooper/${id}/edit`)
    case 'performance_evaluation':
      redirect(`/tests/performance-evaluation/${id}/edit`)
    default:
      notFound()
  }
}

