import { getAuthenticatedUser } from '@/lib/supabase-server'
import { getStudents } from '@/lib/actions/students'
import IntervalTrainingForm from '@/components/IntervalTrainingForm'
import ClientOnly from '@/components/ClientOnly'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewIntervalTrainingPage({ searchParams }: { searchParams: Promise<{ student_id?: string }> }) {
  await getAuthenticatedUser()
  const students = await getStudents()
  const sp = await searchParams
  const selectedStudentId = sp?.student_id

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex justify-start">
        <Link
          href="/tests"
          className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Testes
        </Link>
      </div>
      <ClientOnly fallback={<div className="animate-pulse h-24 bg-slate-100 rounded-xl" />}> 
        <IntervalTrainingForm students={students} selectedStudentId={selectedStudentId} />
      </ClientOnly>
    </div>
  )
}