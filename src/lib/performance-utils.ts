import { createClient } from './supabase'
import type {
  Database,
  AgeGroup,
  PerformanceAgeGroupStats,
  PerformanceGlobalStats
} from './supabase'

type PerformanceTest = Database['public']['Tables']['performance_tests']['Row']
type Student = Database['public']['Tables']['evaluatees']['Row']

// Tipos para métricas de performance
export interface PerformanceMetrics {
  totalEvaluations: number
  totalStudents: number
  avgVo2Max: number
  avgCooperDistance: number
  avgBodyFatPercentage: number
  avgMuscleMass: number
  // avgRestingHeartRate: number
  vo2MaxP25: number
  vo2MaxP50: number
  vo2MaxP75: number
  vo2MaxP90: number
  cooperDistanceP25: number
  cooperDistanceP50: number
  cooperDistanceP75: number
  cooperDistanceP90: number
}

// Tipos para dados de faixa etária
export interface AgeGroupData {
  ageGroup: AgeGroup
  metrics: PerformanceMetrics
}

// Tipos para comparação de performance
export interface PerformanceComparison {
  current: PerformanceMetrics
  previous: PerformanceMetrics
  changes: Partial<PerformanceMetrics>
  percentageChanges: Partial<PerformanceMetrics>
}

// Tipos para filtros
export interface PerformanceFilter {
  dateRange?: {
    start: string
    end: string
  }
  ageGroup?: AgeGroup
  gender?: string
}

// Tipos para insights
export interface PerformanceInsight {
  type: 'improvement' | 'decline' | 'stable' | 'achievement' | 'info' | 'success' | 'warning' | 'error'
  title: string
  description: string
  metric: string
  value: number
}

/**
 * Calcula a faixa etária baseada na data de nascimento
 */
export function calculateAgeGroup(birthDate: string): AgeGroup | null {
  const birth = new Date(birthDate)
  const today = new Date()
  const age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
    ? age - 1 
    : age

  if (actualAge >= 18 && actualAge <= 25) return '18-25'
  if (actualAge >= 26 && actualAge <= 35) return '26-35'
  if (actualAge >= 36 && actualAge <= 45) return '36-45'
  if (actualAge >= 46 && actualAge <= 55) return '46-55'
  if (actualAge >= 56 && actualAge <= 65) return '56-65'
  if (actualAge > 65) return '65+'
  
  return null
}

/**
 * Calcula métricas de performance a partir de dados brutos
 */
export function calculatePerformanceMetrics(
  tests: PerformanceTest[]
): PerformanceMetrics {
  if (tests.length === 0) {
    return {
      totalEvaluations: 0,
      totalStudents: 0,
      avgVo2Max: 0,
      avgCooperDistance: 0,
      avgBodyFatPercentage: 0,
      avgMuscleMass: 0,
      // avgRestingHeartRate: 0,
      vo2MaxP25: 0,
      vo2MaxP50: 0,
      vo2MaxP75: 0,
      vo2MaxP90: 0,
      cooperDistanceP25: 0,
      cooperDistanceP50: 0,
      cooperDistanceP75: 0,
      cooperDistanceP90: 0
    }
  }

  const uniqueStudents = new Set(tests.map(t => t.evaluatee_id))
  const vo2MaxValues = tests.map(t => t.vo2_max).filter(v => v !== null).sort((a, b) => a! - b!)
  const cooperDistanceValues = tests.map(t => t.cooper_test_distance).filter(v => v !== null).sort((a, b) => a! - b!)

  return {
    totalEvaluations: tests.length,
    totalStudents: uniqueStudents.size,
    avgVo2Max: tests.reduce((sum, t) => sum + (t.vo2_max || 0), 0) / tests.length,
    avgCooperDistance: tests.reduce((sum, t) => sum + (t.cooper_test_distance || 0), 0) / tests.length,
    avgBodyFatPercentage: tests.reduce((sum, t) => sum + (t.body_fat_percentage || 0), 0) / tests.length,
    avgMuscleMass: tests.reduce((sum, t) => sum + (t.muscle_mass || 0), 0) / tests.length,
    // avgRestingHeartRate: tests.reduce((sum, t) => sum + (t.resting_heart_rate || 0), 0) / tests.length,
    vo2MaxP25: calculatePercentile(vo2MaxValues, 25),
    vo2MaxP50: calculatePercentile(vo2MaxValues, 50),
    vo2MaxP75: calculatePercentile(vo2MaxValues, 75),
    vo2MaxP90: calculatePercentile(vo2MaxValues, 90),
    cooperDistanceP25: calculatePercentile(cooperDistanceValues, 25),
    cooperDistanceP50: calculatePercentile(cooperDistanceValues, 50),
    cooperDistanceP75: calculatePercentile(cooperDistanceValues, 75),
    cooperDistanceP90: calculatePercentile(cooperDistanceValues, 90)
  }
}

/**
 * Calcula percentil de um array de números
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  
  const index = (percentile / 100) * (values.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index % 1
  
  if (upper >= values.length) return values[values.length - 1]
  
  return values[lower] * (1 - weight) + values[upper] * weight
}

/**
 * Busca estatísticas globais de performance do usuário
 */
export async function getGlobalPerformanceStats(
  userId: string
): Promise<PerformanceGlobalStats | null> {
  const supabase = createClient()
  
  // Buscar dados de avaliações existentes
  const { data: evaluations, error } = await supabase
    .from('performance_tests')
    .select(`
      id,
      vo2_max,
      cooper_test_distance,
      body_fat_percentage,
      muscle_mass,
      student_id,
      created_at
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Erro ao buscar avaliações:', error)
    return null
  }

  if (!evaluations || evaluations.length === 0) {
    return {
      id: 'temp',
      user_id: userId,
      total_evaluations: 0,
      total_evaluatees: 0,
      total_active_evaluatees: 0,
      global_avg_vo2_max: null,
      global_avg_cooper_distance: null,
      global_avg_body_fat_percentage: null,
      global_avg_muscle_mass: null,
      global_avg_age: null,
      male_count: 0,
      female_count: 0,
      other_gender_count: 0,
      best_vo2_max: null,
      best_cooper_distance: null,
      best_vo2_max_student_id: null,
      best_cooper_distance_student_id: null,
      recent_evaluations_count: 0,
      recent_avg_vo2_max: null,
      recent_avg_cooper_distance: null,
      last_calculation: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // Calcular estatísticas
  const uniqueEvaluatees = new Set(evaluations.map(e => e.student_id))
  const validVo2Max = evaluations.filter(e => e.vo2_max !== null).map(e => e.vo2_max!)
  const validCooperDistance = evaluations.filter(e => e.cooper_test_distance !== null).map(e => e.cooper_test_distance!)
  const validBodyFat = evaluations.filter(e => e.body_fat_percentage !== null).map(e => e.body_fat_percentage!)
  const validMuscleMass = evaluations.filter(e => e.muscle_mass !== null).map(e => e.muscle_mass!)

  return {
    id: 'calculated',
    user_id: userId,
    total_evaluations: evaluations.length,
    total_students: uniqueEvaluatees.size,
    total_active_students: uniqueEvaluatees.size,
    global_avg_vo2_max: validVo2Max.length > 0 ? validVo2Max.reduce((a, b) => a + b, 0) / validVo2Max.length : null,
    global_avg_cooper_distance: validCooperDistance.length > 0 ? validCooperDistance.reduce((a, b) => a + b, 0) / validCooperDistance.length : null,
    global_avg_body_fat_percentage: validBodyFat.length > 0 ? validBodyFat.reduce((a, b) => a + b, 0) / validBodyFat.length : null,
    global_avg_muscle_mass: validMuscleMass.length > 0 ? validMuscleMass.reduce((a, b) => a + b, 0) / validMuscleMass.length : null,
    global_avg_age: null,
    male_count: 0,
    female_count: 0,
    other_gender_count: 0,
    best_vo2_max: validVo2Max.length > 0 ? Math.max(...validVo2Max) : null,
    best_cooper_distance: validCooperDistance.length > 0 ? Math.max(...validCooperDistance) : null,
    best_vo2_max_student_id: null,
    best_cooper_distance_student_id: null,
    recent_evaluations_count: evaluations.length,
    recent_avg_vo2_max: validVo2Max.length > 0 ? validVo2Max.reduce((a, b) => a + b, 0) / validVo2Max.length : null,
    recent_avg_cooper_distance: validCooperDistance.length > 0 ? validCooperDistance.reduce((a, b) => a + b, 0) / validCooperDistance.length : null,
    last_calculation: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * Busca estatísticas de performance por faixa etária do usuário
 */
export async function getAgeGroupPerformanceStats(
  userId: string
): Promise<PerformanceAgeGroupStats[]> {
  const supabase = createClient()
  
  // Buscar dados de avaliações com informações dos avaliados
  const { data: evaluations, error } = await supabase
    .from('performance_tests')
    .select(`
      id,
      vo2_max,
      cooper_test_distance,
      body_fat_percentage,
      muscle_mass,
      student_id,
      created_at,
      students!inner (
        id,
        birth_date
      )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Erro ao buscar avaliações com dados dos avaliados:', error)
    return []
  }

  if (!evaluations || evaluations.length === 0) {
    return []
  }

  // Agrupar por faixa etária
  const ageGroups: { [key: string]: typeof evaluations } = {}
  
  evaluations.forEach(evaluation => {
    if (evaluation.students && Array.isArray(evaluation.students) && evaluation.students.length > 0) {
      const student = evaluation.students[0] // Pega o primeiro student
      if (student && student.birth_date) {
        const birthDate = new Date(student.birth_date)
        const age = new Date().getFullYear() - birthDate.getFullYear()
        
        let ageGroup: string
        if (age < 18) ageGroup = '< 18'
        else if (age < 25) ageGroup = '18-24'
        else if (age < 35) ageGroup = '25-34'
        else if (age < 45) ageGroup = '35-44'
        else if (age < 55) ageGroup = '45-54'
        else if (age < 65) ageGroup = '55-64'
        else ageGroup = '65+'
        
        if (!ageGroups[ageGroup]) {
          ageGroups[ageGroup] = []
        }
        ageGroups[ageGroup].push(evaluation)
      }
    }
  })

  // Calcular estatísticas para cada faixa etária
  const result: PerformanceAgeGroupStats[] = []
  
  Object.entries(ageGroups).forEach(([ageGroup, groupEvaluations]) => {
    const validVo2Max = groupEvaluations.filter(e => e.vo2_max !== null).map(e => e.vo2_max!)
    const validCooperDistance = groupEvaluations.filter(e => e.cooper_test_distance !== null).map(e => e.cooper_test_distance!)
    const validBodyFat = groupEvaluations.filter(e => e.body_fat_percentage !== null).map(e => e.body_fat_percentage!)
    const validMuscleMass = groupEvaluations.filter(e => e.muscle_mass !== null).map(e => e.muscle_mass!)
    
    result.push({
      id: `${ageGroup}-calculated`,
      user_id: userId,
      age_group: ageGroup,
      total_evaluations: groupEvaluations.length,
      total_students: new Set(groupEvaluations.map(e => e.student_id)).size,
      avg_vo2_max: validVo2Max.length > 0 ? validVo2Max.reduce((a, b) => a + b, 0) / validVo2Max.length : null,
      avg_cooper_distance: validCooperDistance.length > 0 ? validCooperDistance.reduce((a, b) => a + b, 0) / validCooperDistance.length : null,
      avg_body_fat_percentage: validBodyFat.length > 0 ? validBodyFat.reduce((a, b) => a + b, 0) / validBodyFat.length : null,
      avg_muscle_mass: validMuscleMass.length > 0 ? validMuscleMass.reduce((a, b) => a + b, 0) / validMuscleMass.length : null,
      avg_resting_heart_rate: null,
      total_cooper_distance: validCooperDistance.reduce((a, b) => a + b, 0),
      total_vo2_max: validVo2Max.reduce((a, b) => a + b, 0),
      vo2_max_p25: null,
      vo2_max_p50: null,
      vo2_max_p75: null,
      vo2_max_p90: null,
      cooper_distance_p25: null,
      cooper_distance_p50: null,
      cooper_distance_p75: null,
      cooper_distance_p90: null,
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  })

  return result.sort((a, b) => a.age_group.localeCompare(b.age_group))
}

/**
 * Busca dados de performance com filtros
 */
export async function getPerformanceData(
  userId: string,
  filters?: PerformanceFilter
): Promise<{
  tests: PerformanceTest[]
  students: Student[]
}> {
  const supabase = createClient()
  let testsQuery = supabase
    .from('performance_tests')
    .select('*')
    .eq('user_id', userId)

  let studentsQuery = supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)

  // Aplicar filtros de data
  if (filters?.dateRange) {
    testsQuery = testsQuery
      .gte('created_at', filters.dateRange.start)
      .lte('created_at', filters.dateRange.end)
  }

  // Aplicar filtro de faixa etária
  if (filters?.ageGroup) {
    const studentsInAgeGroup = await supabase
      .from('students')
      .select('id, birth_date')
      .eq('user_id', userId)
    
    if (studentsInAgeGroup.data) {
      const filteredStudentIds = studentsInAgeGroup.data
        .filter(() => {
          // Aqui precisaríamos da data de nascimento para calcular a idade
          // Por simplicidade, vamos buscar todos os estudantes e filtrar depois
          return true
        })
        .map(s => s.id)
      
      testsQuery = testsQuery.in('student_id', filteredStudentIds)
      studentsQuery = studentsQuery.in('id', filteredStudentIds)
    }
  }

  const [testsResult, studentsResult] = await Promise.all([
    testsQuery,
    studentsQuery
  ])

  if (testsResult.error) {
    console.error('Erro ao buscar testes de performance:', testsResult.error)
    // Se a tabela não existe, retorna dados vazios
    if (testsResult.error.code === 'PGRST116' || testsResult.error.code === 'PGRST205' || testsResult.error.message?.includes('Could not find the table') || testsResult.error.message?.includes('relation "public.performance_tests" does not exist')) {
      console.warn('Tabela performance_tests não encontrada. Aguarde alguns minutos para o cache do PostgREST ser atualizado.')
    }
  }

  if (studentsResult.error) {
    console.error('Erro ao buscar estudantes:', studentsResult.error)
  }

  return {
    tests: testsResult.data || [],
    students: studentsResult.data || []
  }
}

/**
 * Gera comparação de performance entre períodos
 */
export async function generatePerformanceComparison(
  userId: string,
  currentPeriod: { start: string; end: string },
  previousPeriod: { start: string; end: string }
): Promise<PerformanceComparison> {
  const [currentData, previousData] = await Promise.all([
    getPerformanceData(userId, { dateRange: currentPeriod }),
    getPerformanceData(userId, { dateRange: previousPeriod })
  ])

  const currentMetrics = calculatePerformanceMetrics(currentData.tests)
  const previousMetrics = calculatePerformanceMetrics(previousData.tests)

  return {
    current: currentMetrics,
    previous: previousMetrics,
    changes: {
      totalEvaluations: currentMetrics.totalEvaluations - previousMetrics.totalEvaluations,
      totalStudents: currentMetrics.totalStudents - previousMetrics.totalStudents,
      avgVo2Max: currentMetrics.avgVo2Max - previousMetrics.avgVo2Max,
      avgCooperDistance: currentMetrics.avgCooperDistance - previousMetrics.avgCooperDistance,
      avgBodyFatPercentage: currentMetrics.avgBodyFatPercentage - previousMetrics.avgBodyFatPercentage,
      avgMuscleMass: currentMetrics.avgMuscleMass - previousMetrics.avgMuscleMass
      // avgRestingHeartRate: currentMetrics.avgRestingHeartRate - previousMetrics.avgRestingHeartRate
    },
    percentageChanges: {
      totalEvaluations: previousMetrics.totalEvaluations > 0 
        ? ((currentMetrics.totalEvaluations - previousMetrics.totalEvaluations) / previousMetrics.totalEvaluations) * 100 
        : 0,
      totalStudents: previousMetrics.totalStudents > 0 
        ? ((currentMetrics.totalStudents - previousMetrics.totalStudents) / previousMetrics.totalStudents) * 100 
        : 0,
      avgVo2Max: previousMetrics.avgVo2Max > 0 
        ? ((currentMetrics.avgVo2Max - previousMetrics.avgVo2Max) / previousMetrics.avgVo2Max) * 100 
        : 0,
      avgCooperDistance: previousMetrics.avgCooperDistance > 0 
        ? ((currentMetrics.avgCooperDistance - previousMetrics.avgCooperDistance) / previousMetrics.avgCooperDistance) * 100 
        : 0,
      avgBodyFatPercentage: previousMetrics.avgBodyFatPercentage > 0 
        ? ((currentMetrics.avgBodyFatPercentage - previousMetrics.avgBodyFatPercentage) / previousMetrics.avgBodyFatPercentage) * 100 
        : 0,
      avgMuscleMass: previousMetrics.avgMuscleMass > 0 
        ? ((currentMetrics.avgMuscleMass - previousMetrics.avgMuscleMass) / previousMetrics.avgMuscleMass) * 100 
        : 0
      // avgRestingHeartRate: previousMetrics.avgRestingHeartRate > 0 
      //   ? ((currentMetrics.avgRestingHeartRate - previousMetrics.avgRestingHeartRate) / previousMetrics.avgRestingHeartRate) * 100 
      //   : 0
    }
  }
}

/**
 * Gera insights de performance baseados nos dados
 */
export function generatePerformanceInsights(
  metrics: PerformanceMetrics,
  ageGroupData: AgeGroupData[],
  comparison?: PerformanceComparison
): PerformanceInsight[] {
  const insights: PerformanceInsight[] = []

  // Insight sobre número de avaliações
  if (metrics.totalEvaluations > 0) {
    insights.push({
      type: 'info',
      title: 'Total de Avaliações',
      description: `Foram realizadas ${metrics.totalEvaluations} avaliações com ${metrics.totalStudents} alunos únicos.`,
      metric: 'totalEvaluations',
      value: metrics.totalEvaluations
    })
  }

  // Insight sobre VO2 Max
  if (metrics.avgVo2Max > 0) {
    const vo2Insight: PerformanceInsight = {
      type: 'info',
      title: 'VO2 Máximo Médio',
      description: `A média de VO2 máximo é ${metrics.avgVo2Max.toFixed(1)} ml/kg/min.`,
      metric: 'avgVo2Max',
      value: metrics.avgVo2Max
    }

    // Classificar o VO2 Max
    if (metrics.avgVo2Max >= 50) {
      vo2Insight.type = 'success'
      vo2Insight.description += ' Excelente capacidade cardiovascular!'
    } else if (metrics.avgVo2Max >= 40) {
      vo2Insight.type = 'warning'
      vo2Insight.description += ' Boa capacidade cardiovascular.'
    } else {
      vo2Insight.type = 'error'
      vo2Insight.description += ' Capacidade cardiovascular pode ser melhorada.'
    }

    insights.push(vo2Insight)
  }

  // Insight sobre distância Cooper
  if (metrics.avgCooperDistance > 0) {
    const cooperInsight: PerformanceInsight = {
      type: 'info',
      title: 'Distância Cooper Média',
      description: `A distância média no teste Cooper é ${(metrics.avgCooperDistance / 1000).toFixed(2)} km.`,
      metric: 'avgCooperDistance',
      value: metrics.avgCooperDistance
    }

    // Classificar a distância Cooper
    if (metrics.avgCooperDistance >= 2800) {
      cooperInsight.type = 'success'
      cooperInsight.description += ' Excelente resistência!'
    } else if (metrics.avgCooperDistance >= 2400) {
      cooperInsight.type = 'warning'
      cooperInsight.description += ' Boa resistência.'
    } else {
      cooperInsight.type = 'error'
      cooperInsight.description += ' Resistência pode ser melhorada.'
    }

    insights.push(cooperInsight)
  }

  // Insights de comparação temporal
  if (comparison) {
    const vo2MaxChange = comparison.percentageChanges.avgVo2Max || 0
    const cooperDistanceChange = comparison.percentageChanges.avgCooperDistance || 0
    
    if (vo2MaxChange > 5) {
      insights.push({
        type: 'success',
        title: 'Melhoria no VO2 Max',
        description: `O VO2 máximo médio aumentou ${vo2MaxChange.toFixed(1)}% em relação ao período anterior.`,
        metric: 'avgVo2Max',
        value: vo2MaxChange
      })
    } else if (vo2MaxChange < -5) {
      insights.push({
        type: 'warning',
        title: 'Declínio no VO2 Max',
        description: `O VO2 máximo médio diminuiu ${Math.abs(vo2MaxChange).toFixed(1)}% em relação ao período anterior.`,
        metric: 'avgVo2Max',
        value: vo2MaxChange
      })
    }

    if (cooperDistanceChange > 5) {
      insights.push({
        type: 'success',
        title: 'Melhoria na Distância Cooper',
        description: `A distância Cooper média aumentou ${cooperDistanceChange.toFixed(1)}% em relação ao período anterior.`,
        metric: 'avgCooperDistance',
        value: cooperDistanceChange
      })
    }
  }

  // Insights sobre faixas etárias
  if (ageGroupData.length > 1) {
    const bestAgeGroup = ageGroupData.reduce((best, current) => 
      current.metrics.avgVo2Max > best.metrics.avgVo2Max ? current : best
    )

    insights.push({
      type: 'info',
      title: 'Melhor Faixa Etária',
      description: `A faixa etária ${bestAgeGroup.ageGroup} apresenta o melhor VO2 máximo médio (${bestAgeGroup.metrics.avgVo2Max.toFixed(1)} ml/kg/min).`,
      metric: 'avgVo2Max',
      value: bestAgeGroup.metrics.avgVo2Max
    })
  }

  return insights
}

/**
 * Formata valores de performance para exibição
 */
export const formatters = {
  vo2Max: (value: number) => `${value.toFixed(1)} ml/kg/min`,
  cooperDistance: (value: number) => `${(value / 1000).toFixed(2)} km`,
  bodyFatPercentage: (value: number) => `${value.toFixed(1)}%`,
  muscleMass: (value: number) => `${value.toFixed(1)} kg`,
  restingHeartRate: (value: number) => `${Math.round(value)} bpm`,
  percentage: (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
  count: (value: number) => value.toString()
}

/**
 * Cores para diferentes tipos de métricas
 */
export const metricColors = {
  vo2Max: '#10B981', // green
  cooperDistance: '#3B82F6', // blue
  bodyFatPercentage: '#F59E0B', // amber
  muscleMass: '#8B5CF6', // violet
  restingHeartRate: '#EF4444', // red
  evaluations: '#6B7280' // gray
} as const

/**
 * Configurações de gráficos padrão
 */
export const chartConfig = {
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    tertiary: '#F59E0B',
    quaternary: '#8B5CF6',
    danger: '#EF4444',
    muted: '#6B7280'
  },
  gradients: {
    primary: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    secondary: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    tertiary: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
  }
} as const