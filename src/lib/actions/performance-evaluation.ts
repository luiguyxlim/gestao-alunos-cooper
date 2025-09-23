'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { 
  CreatePerformanceEvaluationData, 
  UpdatePerformanceEvaluationData,
  PerformanceEvaluationTest 
} from '@/lib/types'
import { calculatePerformanceEvaluation } from '@/lib/performance-evaluation'

/**
 * Busca testes de Cooper de um avaliando para herdar dados de VO2
 */
export async function getCooperTestsByStudent(studentId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('performance_tests')
    .select('*')
    .eq('user_id', user.id)
    .eq('student_id', studentId)
    .eq('test_type', 'cooper_vo2')
    .not('cooper_test_distance', 'is', null)
    .order('test_date', { ascending: false })

  if (error) {
    console.error('Erro ao buscar testes de Cooper:', error)
    // Se a tabela não existe, retorna array vazio
    if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('relation "public.performance_tests" does not exist')) {
      console.warn('Tabela performance_tests não encontrada. Aguarde alguns minutos para o cache do PostgREST ser atualizado.')
      return []
    }
    throw new Error('Erro ao buscar testes de Cooper')
  }

  return data || []
}

/**
 * Cria uma nova avaliação de desempenho
 */
export async function createPerformanceEvaluation(data: CreatePerformanceEvaluationData) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  try {
    // Calcular todos os valores automaticamente
    const calculations = calculatePerformanceEvaluation({
      cooperDistance: data.cooper_distance,
      intensityPercentage: data.intensity_percentage,
      trainingTime: data.training_time,
      bodyWeight: data.body_weight
    })

    // Preparar dados para inserção
    const performanceEvaluationData = {
      user_id: user.id,
      student_id: data.evaluatee_id,
      test_type: 'performance_evaluation',
      test_date: data.test_date,
      
      // Dados herdados do teste de VO2
      vo2_max: data.vo2_max,
      cooper_test_distance: data.cooper_distance,
      
      // Variáveis de entrada
      intensity_percentage: data.intensity_percentage,
      training_time: data.training_time,
      body_weight: data.body_weight,
      
      // Cálculos automáticos
      training_distance: calculations.trainingDistance,
      training_intensity: calculations.trainingIntensity,
      training_velocity: calculations.trainingVelocity,
      total_o2_consumption: calculations.totalO2Consumption,
      caloric_expenditure: calculations.caloricExpenditure,
      weight_loss: calculations.weightLoss,
      
      // Observações
      notes: data.observations || null
    }

    const { data: result, error } = await supabase
      .from('performance_tests')
      .insert(performanceEvaluationData)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar avaliação de desempenho:', error)
      throw new Error('Erro ao criar avaliação de desempenho')
    }

    revalidatePath('/tests')
    revalidatePath(`/tests?student_id=${data.evaluatee_id}`)
    
    return result
  } catch (error) {
    console.error('Erro ao criar avaliação de desempenho:', error)
    throw error
  }
}

/**
 * Busca todas as avaliações de desempenho do usuário
 */
export async function getPerformanceEvaluations() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
      .from('performance_tests')
      .select(`
        *,
        students!performance_tests_student_id_fkey (
          id,
          name,
          email,
          weight
        )
      `)
    .eq('user_id', user.id)
    .eq('test_type', 'performance_evaluation')
    .order('test_date', { ascending: false })

  if (error) {
    console.error('Erro ao buscar avaliações de desempenho:', error)
    // Se a tabela não existe, retorna array vazio
    if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('relation "public.performance_tests" does not exist')) {
      console.warn('Tabela performance_tests não encontrada. Aguarde alguns minutos para o cache do PostgREST ser atualizado.')
      return []
    }
    throw new Error('Erro ao buscar avaliações de desempenho')
  }

  return data || []
}

/**
 * Busca uma avaliação de desempenho específica
 */
export async function getPerformanceEvaluation(id: string): Promise<PerformanceEvaluationTest | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
      .from('performance_tests')
      .select(`
        *,
        students!performance_tests_student_id_fkey (
          id,
          name,
          email,
          weight,
          gender,
          birth_date
        )
      `)
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('test_type', 'performance_evaluation')
    .single()

  if (error) {
    console.error('Erro ao buscar avaliação de desempenho:', error)
    // Se a tabela não existe, retorna null
    if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('relation "public.performance_tests" does not exist')) {
      console.warn('Tabela performance_tests não encontrada. Aguarde alguns minutos para o cache do PostgREST ser atualizado.')
    }
    return null
  }

  return data
}

/**
 * Atualiza uma avaliação de desempenho
 */
export async function updatePerformanceEvaluation(id: string, data: UpdatePerformanceEvaluationData) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  try {
    // Recalcular todos os valores
    const calculations = calculatePerformanceEvaluation({
      cooperDistance: data.cooper_distance,
      intensityPercentage: data.intensity_percentage,
      trainingTime: data.training_time,
      bodyWeight: data.body_weight
    })

    const updateData = {
      test_date: data.test_date,
      vo2_max: data.vo2_max,
      cooper_test_distance: data.cooper_distance,
      intensity_percentage: data.intensity_percentage,
      training_time: data.training_time,
      body_weight: data.body_weight,
      training_distance: calculations.trainingDistance,
      training_intensity: calculations.trainingIntensity,
      training_velocity: calculations.trainingVelocity,
      total_o2_consumption: calculations.totalO2Consumption,
      caloric_expenditure: calculations.caloricExpenditure,
      weight_loss: calculations.weightLoss,
      notes: data.observations || null,
      updated_at: new Date().toISOString()
    }

    const { data: result, error } = await supabase
      .from('performance_tests')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar avaliação de desempenho:', error)
      throw new Error('Erro ao atualizar avaliação de desempenho')
    }

    revalidatePath('/tests')
    revalidatePath(`/tests/${id}`)
    revalidatePath(`/tests?student_id=${data.evaluatee_id}`)
    
    return result
  } catch (error) {
    console.error('Erro ao atualizar avaliação de desempenho:', error)
    throw error
  }
}

/**
 * Deleta uma avaliação de desempenho
 */
export async function deletePerformanceEvaluation(id: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { error } = await supabase
    .from('performance_tests')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Erro ao deletar avaliação de desempenho:', error)
    throw new Error('Erro ao deletar avaliação de desempenho')
  }

  revalidatePath('/tests')
}