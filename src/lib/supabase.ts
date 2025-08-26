import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
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
          student_id: string
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
          student_id: string
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
          student_id?: string
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
    }
  }
}