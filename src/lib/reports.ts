import { createClient } from '@/lib/supabase'

export type ReportPeriod = 'last30' | 'last90' | 'last180' | 'all'

export interface NormalizedTest {
  id: string
  test_date: string
  test_type: string | null
  cooper_test_distance: number | null
  vo2_max: number | null
  intensity_percentage: number | null
  training_time: number | null
  training_distance: number | null
  training_velocity: number | null
  training_intensity: number | null
  total_o2_consumption: number | null
  caloric_expenditure: number | null
  notes: string | null
}

export interface ReportStudent {
  id: string
  name: string
  email: string | null
  birth_date: string | null
  gender: string | null
  tests: NormalizedTest[]
}

const daysMap: Record<string, number> = { last30: 30, last90: 90, last180: 180 }

function toNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return null
}

export async function fetchStudentsWithTests(userId: string, period: ReportPeriod): Promise<ReportStudent[]> {
  const supabase = createClient()
  const cutoff = period === 'all' ? null : new Date(Date.now() - (daysMap[period] ?? 90) * 864e5)

  const { data, error } = await supabase
    .from('students')
    .select(`
      id, name, email, birth_date, gender,
      performance_tests (
        id, test_date, test_type,
        cooper_test_distance, vo2_max,
        intensity_percentage, training_time,
        training_distance, training_velocity, training_intensity,
        total_o2_consumption, caloric_expenditure, notes
      )
    `)
    .eq('user_id', userId)
    .eq('active', true)
    .order('name')

  if (error) throw error

  type StudentRow = {
    id: string
    name: string
    email: string | null
    birth_date: string | null
    gender: string | null
    performance_tests?: Array<Record<string, unknown>>
  }

  const rows = (data ?? []) as StudentRow[]

  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email ?? null,
    birth_date: s.birth_date ?? null,
    gender: s.gender ?? null,
    tests: (s.performance_tests ?? [])
      .filter((t) => {
        const date = String(t.test_date ?? '')
        return !cutoff || new Date(date) >= cutoff
      })
      .map((t) => ({
        id: String(t.id ?? ''),
        test_date: String(t.test_date ?? new Date().toISOString()),
        test_type: (t.test_type as string) ?? null,
        cooper_test_distance: toNum(t.cooper_test_distance),
        vo2_max: toNum(t.vo2_max),
        intensity_percentage: toNum(t.intensity_percentage),
        training_time: toNum(t.training_time),
        training_distance: toNum(t.training_distance),
        training_velocity: toNum(t.training_velocity),
        training_intensity: toNum(t.training_intensity),
        total_o2_consumption: toNum(t.total_o2_consumption),
        caloric_expenditure: toNum(t.caloric_expenditure),
        notes: (t.notes as string) ?? null,
      }))
  }))
}


