// Tipos centralizados para o Cooper Pro

export interface Evaluatee {
  id: string
  name: string
  email?: string
  weight?: number
  gender?: string
  birth_date?: string
}

export interface Student {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: 'masculino' | 'feminino' | 'outro'
  weight?: number // Peso corporal em kg
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  medical_notes?: string
  active: boolean
  created_at: string
  updated_at: string
}

// Tipos para compatibilidade com testes antigos
export interface StudentLegacy {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  date_of_birth: string
  gender: 'M' | 'F' | 'O'
  address: string
  emergency_contact: string
  emergency_phone: string
  medical_observations: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateStudentData {
  name: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: 'masculino' | 'feminino' | 'outro'
  weight?: number // Peso corporal em kg
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  medical_notes?: string
}

export type UpdateStudentData = CreateStudentData

export interface Test {
  id: string
  user_id: string
  student_id: string
  test_type: string
  test_date: string
  distance?: number
  time?: string
  heart_rate?: number
  blood_pressure?: string
  observations?: string
  created_at: string
  updated_at: string
}

export interface CreateTestData {
  student_id: string
  test_type: string
  test_date: string
  distance?: number
  time?: string
  heart_rate?: number
  blood_pressure?: string
  observations?: string
}

export interface UpdateTestData extends CreateTestData {
  id: string // ID do teste para atualização
}

// Novo tipo de teste: Avaliação de Desempenho
export interface PerformanceEvaluationTest {
  id: string
  user_id: string
  student_id: string
  test_type: 'performance_evaluation'
  test_date: string
  
  // Dados herdados do teste de VO2
  vo2_max: number
  cooper_distance: number
  
  // Variáveis de entrada do usuário
  intensity_percentage: number // % de intensidade (destacado em vermelho)
  training_time: number // T: tempo em minutos (destacado em vermelho)
  
  // Cálculos automáticos
  training_distance: number // Distância de treino calculada
  training_intensity: number // Intensidade de treinamento
  training_velocity: number // Velocidade do treino
  total_o2_consumption: number // Consumo total de O2
  caloric_expenditure: number // Gasto calórico estimado
  weight_loss: number // Peso perdido
  
  // Peso corporal do avaliando
  body_weight: number
  
  // Dados do aluno (join com tabela students)
  students: {
    id: string
    name: string
    email: string
    weight: number
    gender?: string
    birth_date?: string
  }
  
  observations?: string
  created_at: string
  updated_at: string
}

export interface CreatePerformanceEvaluationData {
  student_id: string // mantido para compat com formulários existentes
  test_date: string
  vo2_max: number
  cooper_distance: number
  intensity_percentage: number
  training_time: number
  body_weight: number
  observations?: string
}

export interface UpdatePerformanceEvaluationData extends CreatePerformanceEvaluationData {
  id: string
}

// Interface para testes de performance (compatibilidade com testes antigos)
export interface PerformanceTest {
  id: string
  evaluatee_id: string
  test_date: string
  test_type: string
  speed?: number | null
  agility?: number | null
  strength?: number | null
  endurance?: number | null
  flexibility?: number | null
  coordination?: number | null
  balance?: number | null
  power?: number | null
  reaction_time?: number | null
  vo2_max?: number | null
  observations?: string | null
  created_at: string
  updated_at: string
  evaluatees?: {
    full_name: string
  } | null
}