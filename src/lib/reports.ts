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
  weight_loss: number | null
  body_weight: number | null
  notes: string | null
  // Quando o teste for intervalado, estes detalhes são preenchidos
  intervals?: IntervalRow[]
}

export interface ReportStudent {
  id: string
  name: string
  email: string | null
  birth_date: string | null
  gender: string | null
  tests: NormalizedTest[]
}

export interface IntervalRow {
  test_id: string
  order_index: number
  mode: 'distance_intensity' | 'distance_time'
  distance_meters: number
  intensity_percentage: number | null
  time_minutes: number | null
  velocity_m_per_min: number | null
  o2_consumption_l: number | null
  kcal: number | null
  weight_loss_grams: number | null
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
        total_o2_consumption, caloric_expenditure,
        weight_loss, body_weight, notes
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

  // Primeiro normaliza os testes por aluno
  const students = rows.map((s) => ({
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
        weight_loss: toNum(t.weight_loss),
        body_weight: toNum(t.body_weight),
        notes: (t.notes as string) ?? null,
      }))
  }))

  // Em seguida, carrega todos os intervalos dos testes intervalados em lote
  const intervalTestIds = students
    .flatMap((s) => s.tests)
    .filter((t) => (t.test_type ?? '').toLowerCase() === 'interval_training')
    .map((t) => t.id)

  let intervalsMap: Record<string, IntervalRow[]> = {}
  if (intervalTestIds.length > 0) {
    const { data: intervalsData, error: intervalsError } = await supabase
      .from('interval_training_intervals')
      .select('test_id, order_index, mode, distance_meters, intensity_percentage, time_minutes, velocity_m_per_min, o2_consumption_l, kcal, weight_loss_grams')
      .in('test_id', intervalTestIds)
      .order('order_index', { ascending: true })

    if (!intervalsError && Array.isArray(intervalsData)) {
      intervalsMap = (intervalsData as IntervalRow[]).reduce<Record<string, IntervalRow[]>>((acc, row) => {
        const key = row.test_id
        if (!acc[key]) acc[key] = []
        acc[key].push(row)
        return acc
      }, {})
    }
  }

  // Por fim, agrega os intervalos aos testes correspondentes
  return students.map((s) => ({
    ...s,
    tests: s.tests.map((t) => {
      if ((t.test_type ?? '').toLowerCase() === 'interval_training') {
        return { ...t, intervals: intervalsMap[t.id] ?? [] }
      }
      return t
    })
  }))
}


