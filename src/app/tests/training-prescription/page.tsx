import { getStudents } from '@/lib/actions/students'
import TrainingPrescriptionForm from '@/components/TrainingPrescriptionForm'

interface TrainingPrescriptionPageProps {
  searchParams: Promise<{
    student_id?: string
  }>
}

export default async function TrainingPrescriptionPage({ searchParams }: TrainingPrescriptionPageProps) {
  const resolvedSearchParams = await searchParams
  const students = await getStudents()

  return (
    <TrainingPrescriptionForm 
      students={students} 
      selectedStudentId={resolvedSearchParams.student_id}
    />
  )
}