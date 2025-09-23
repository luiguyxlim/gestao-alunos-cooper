import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'cooper-pro-web'
      }
    }
  })
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          updated_at?: string
        }
      }
      evaluatees: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          birth_date: string | null
          gender: string | null
          weight: number | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          birth_date?: string | null
          gender?: string | null
          weight?: number | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          birth_date?: string | null
          gender?: string | null
          weight?: number | null
          user_id?: string
          updated_at?: string
        }
      }
      performance_tests: {
        Row: {
          id: string
          evaluatee_id: string
          user_id: string
          test_date: string
          test_type: string
          // Medidas corporais
          weight: number | null
          height: number | null
          body_fat_percentage: number | null
          muscle_mass: number | null
          // Testes cardiovasculares
          max_heart_rate: number | null
          blood_pressure_systolic: number | null
          blood_pressure_diastolic: number | null
          // Testes de força
          bench_press_1rm: number | null
          squat_1rm: number | null
          deadlift_1rm: number | null
          // Testes de resistência
          vo2_max: number | null
          cooper_test_distance: number | null
          plank_time: number | null
          // Testes de flexibilidade
          sit_and_reach: number | null
          shoulder_flexibility: string | null
          // Métricas de performance
          speed: number | null
          agility: number | null
          strength: number | null
          endurance: number | null
          flexibility: number | null
          coordination: number | null
          balance: number | null
          power: number | null
          reaction_time: number | null
          // Observações gerais
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          evaluatee_id: string
          user_id: string
          test_date: string
          test_type: string
          // Medidas corporais
          weight?: number | null
          height?: number | null
          body_fat_percentage?: number | null
          muscle_mass?: number | null
          // Testes cardiovasculares
          max_heart_rate?: number | null
          blood_pressure_systolic?: number | null
          blood_pressure_diastolic?: number | null
          // Testes de força
          bench_press_1rm?: number | null
          squat_1rm?: number | null
          deadlift_1rm?: number | null
          // Testes de resistência
          vo2_max?: number | null
          cooper_test_distance?: number | null
          plank_time?: number | null
          // Testes de flexibilidade
          sit_and_reach?: number | null
          shoulder_flexibility?: string | null
          // Métricas de performance
          speed?: number | null
          agility?: number | null
          strength?: number | null
          endurance?: number | null
          flexibility?: number | null
          coordination?: number | null
          balance?: number | null
          power?: number | null
          reaction_time?: number | null
          // Observações gerais
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          evaluatee_id?: string
          user_id?: string
          test_date?: string
          test_type?: string
          // Medidas corporais
          weight?: number | null
          height?: number | null
          body_fat_percentage?: number | null
          muscle_mass?: number | null
          // Testes cardiovasculares
          max_heart_rate?: number | null
          blood_pressure_systolic?: number | null
          blood_pressure_diastolic?: number | null
          // Testes de força
          bench_press_1rm?: number | null
          squat_1rm?: number | null
          deadlift_1rm?: number | null
          // Testes de resistência
          vo2_max?: number | null
          cooper_test_distance?: number | null
          plank_time?: number | null
          // Testes de flexibilidade
          sit_and_reach?: number | null
          shoulder_flexibility?: string | null
          // Métricas de performance
          speed?: number | null
          agility?: number | null
          strength?: number | null
          endurance?: number | null
          flexibility?: number | null
          coordination?: number | null
          balance?: number | null
          power?: number | null
          reaction_time?: number | null
          // Observações gerais
          notes?: string | null
          updated_at?: string
        }
      }
      performance_age_groups: {
        Row: {
          id: string
          user_id: string
          age_group: string
          total_evaluations: number
          total_students: number
          avg_vo2_max: number | null
          avg_cooper_distance: number | null
          avg_body_fat_percentage: number | null
          avg_muscle_mass: number | null
          avg_resting_heart_rate: number | null
          total_cooper_distance: number
          total_vo2_max: number
          vo2_max_p25: number | null
          vo2_max_p50: number | null
          vo2_max_p75: number | null
          vo2_max_p90: number | null
          cooper_distance_p25: number | null
          cooper_distance_p50: number | null
          cooper_distance_p75: number | null
          cooper_distance_p90: number | null
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          age_group: string
          total_evaluations?: number
          total_students?: number
          avg_vo2_max?: number | null
          avg_cooper_distance?: number | null
          avg_body_fat_percentage?: number | null
          avg_muscle_mass?: number | null
          avg_resting_heart_rate?: number | null
          total_cooper_distance?: number
          total_vo2_max?: number
          vo2_max_p25?: number | null
          vo2_max_p50?: number | null
          vo2_max_p75?: number | null
          vo2_max_p90?: number | null
          cooper_distance_p25?: number | null
          cooper_distance_p50?: number | null
          cooper_distance_p75?: number | null
          cooper_distance_p90?: number | null
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          age_group?: string
          total_evaluations?: number
          total_students?: number
          avg_vo2_max?: number | null
          avg_cooper_distance?: number | null
          avg_body_fat_percentage?: number | null
          avg_muscle_mass?: number | null
          avg_resting_heart_rate?: number | null
          total_cooper_distance?: number
          total_vo2_max?: number
          vo2_max_p25?: number | null
          vo2_max_p50?: number | null
          vo2_max_p75?: number | null
          vo2_max_p90?: number | null
          cooper_distance_p25?: number | null
          cooper_distance_p50?: number | null
          cooper_distance_p75?: number | null
          cooper_distance_p90?: number | null
          last_updated?: string
          updated_at?: string
        }
      }
      performance_global_stats: {
        Row: {
          id: string
          user_id: string
          total_evaluations: number
          total_students: number
          total_active_students: number
          global_avg_vo2_max: number | null
          global_avg_cooper_distance: number | null
          global_avg_body_fat_percentage: number | null
          global_avg_muscle_mass: number | null
          global_avg_age: number | null
          male_count: number
          female_count: number
          other_gender_count: number
          best_vo2_max: number | null
          best_cooper_distance: number | null
          best_vo2_max_student_id: string | null
          best_cooper_distance_student_id: string | null
          recent_evaluations_count: number
          recent_avg_vo2_max: number | null
          recent_avg_cooper_distance: number | null
          last_calculation: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_evaluations?: number
          total_students?: number
          total_active_students?: number
          global_avg_vo2_max?: number | null
          global_avg_cooper_distance?: number | null
          global_avg_body_fat_percentage?: number | null
          global_avg_muscle_mass?: number | null
          global_avg_age?: number | null
          male_count?: number
          female_count?: number
          other_gender_count?: number
          best_vo2_max?: number | null
          best_cooper_distance?: number | null
          best_vo2_max_student_id?: string | null
          best_cooper_distance_student_id?: string | null
          recent_evaluations_count?: number
          recent_avg_vo2_max?: number | null
          recent_avg_cooper_distance?: number | null
          last_calculation?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_evaluations?: number
          total_students?: number
          total_active_students?: number
          global_avg_vo2_max?: number | null
          global_avg_cooper_distance?: number | null
          global_avg_body_fat_percentage?: number | null
          global_avg_muscle_mass?: number | null
          global_avg_age?: number | null
          male_count?: number
          female_count?: number
          other_gender_count?: number
          best_vo2_max?: number | null
          best_cooper_distance?: number | null
          best_vo2_max_student_id?: string | null
          best_cooper_distance_student_id?: string | null
          recent_evaluations_count?: number
          recent_avg_vo2_max?: number | null
          recent_avg_cooper_distance?: number | null
          last_calculation?: string
          updated_at?: string
        }
      }
    }
  }
}

// Tipos auxiliares para a área de Performance
export type AgeGroup = '18-25' | '26-35' | '36-45' | '46-55' | '56-65' | '65+'

export type PerformanceAgeGroupStats = Database['public']['Tables']['performance_age_groups']['Row']
export type PerformanceGlobalStats = Database['public']['Tables']['performance_global_stats']['Row']

// Tipos para componentes de interface
export interface PerformanceMetrics {
  vo2Max: number | null
  cooperDistance: number | null
  bodyFatPercentage: number | null
  muscleMass: number | null
  restingHeartRate: number | null
}

export interface AgeGroupData {
  ageGroup: AgeGroup
  stats: PerformanceAgeGroupStats
  percentileRank?: number
}

export interface PerformanceComparison {
  current: PerformanceMetrics
  ageGroupAverage: PerformanceMetrics
  globalAverage: PerformanceMetrics
  percentileRank: {
    vo2Max: number | null
    cooperDistance: number | null
  }
}

export interface PerformanceTrend {
  date: string
  vo2Max: number | null
  cooperDistance: number | null
  bodyFatPercentage: number | null
  muscleMass: number | null
}

export interface PerformanceFilter {
  dateRange: {
    start: Date | null
    end: Date | null
  }
  testTypes: string[]
  ageGroups: AgeGroup[]
  gender: ('masculino' | 'feminino' | 'outro')[] | null
}

export interface PerformanceInsight {
  type: 'improvement' | 'decline' | 'stable' | 'achievement'
  metric: string
  value: number
  change: number
  description: string
  recommendation?: string
}