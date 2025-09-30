'use server'

import { getAuthenticatedUser } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { PerformanceTestDetail } from '@/lib/types'

export async function getTests(studentId?: string): Promise<PerformanceTestDetail[]> {
  const { supabase, user } = await getAuthenticatedUser()

  let query = supabase
    .from('performance_tests')
    .select(`
      *,
      students:students!performance_tests_student_id_fkey (
        id,
        name,
        birth_date,
        gender,
        email,
        phone
      )
    `)
    .eq('user_id', user.id)
    .order('test_date', { ascending: false })

  if (studentId) {
    query = query.eq('student_id', studentId)
  }

  let { data: tests, error } = await query

  // Fallback: se o embed falhar por relacionamento/tabela, buscar sem join
  if (error && (error.code === 'PGRST200' || error.message?.includes('Could not find a relationship'))) {
    const fallback = await supabase
      .from('performance_tests')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false })
    tests = fallback.data || []
    error = fallback.error || null
  }

  if (error) {
    console.error('Error fetching tests:', error)
    return []
  }

  return (tests as PerformanceTestDetail[]) || []
}

export async function getTest(id: string): Promise<PerformanceTestDetail | null> {
  const { supabase, user } = await getAuthenticatedUser()

  let { data: test, error } = await supabase
    .from('performance_tests')
    .select(`
      *,
      students:students!performance_tests_student_id_fkey (
        id,
        name,
        birth_date,
        gender,
        email,
        phone
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error && (error.code === 'PGRST200' || error.message?.includes('Could not find a relationship'))) {
    const fallback = await supabase
      .from('performance_tests')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    test = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error('Error fetching test:', error)
    // Se a tabela não existe, retorna null
    if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('relation "public.performance_tests" does not exist')) {
      console.warn('Tabela performance_tests não encontrada. Aguarde alguns minutos para o cache do PostgREST ser atualizado.')
    }
    return null
  }

  return (test as PerformanceTestDetail) || null
}

export async function createTest(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser()

  const studentId = formData.get('student_id') as string
  const testDate = formData.get('test_date') as string
  const testType = formData.get('test_type') as string
  const notes = formData.get('notes') as string
  
  // Métricas de performance
  const speed = formData.get('speed') ? parseFloat(formData.get('speed') as string) : null
  const agility = formData.get('agility') ? parseFloat(formData.get('agility') as string) : null
  const strength = formData.get('strength') ? parseFloat(formData.get('strength') as string) : null
  const endurance = formData.get('endurance') ? parseFloat(formData.get('endurance') as string) : null
  const flexibility = formData.get('flexibility') ? parseFloat(formData.get('flexibility') as string) : null
  const coordination = formData.get('coordination') ? parseFloat(formData.get('coordination') as string) : null
  const balance = formData.get('balance') ? parseFloat(formData.get('balance') as string) : null
  const power = formData.get('power') ? parseFloat(formData.get('power') as string) : null
  const reaction_time = formData.get('reaction_time') ? parseFloat(formData.get('reaction_time') as string) : null
  let vo2_max = formData.get('vo2_max') ? parseFloat(formData.get('vo2_max') as string) : null
  
  // Dados específicos do teste de Cooper
  const cooper_distance = formData.get('cooper_distance') ? parseFloat(formData.get('cooper_distance') as string) : null
  const cooper_age = formData.get('cooper_age') ? parseInt(formData.get('cooper_age') as string) : null
  const cooper_gender = formData.get('cooper_gender') as string
  
  // Se for teste de Cooper, calcular VO2 máximo automaticamente
  if (testType === 'cooper_vo2' && cooper_distance && cooper_age && cooper_gender) {
    // Nova fórmula do Cooper: VO2max = (distância em metros - 504,1) / 44,8
    vo2_max = Math.max(0, Math.round(((cooper_distance - 504.1) / 44.8) * 100) / 100)
  }

  if (!studentId || !testDate || !testType) {
    throw new Error('Campos obrigatórios não preenchidos')
  }

  // Log dos dados para debug
  console.log('Creating test with data:', {
    studentId,
    testDate,
    testType,
    cooper_distance,
    vo2_max,
    cooper_age,
    cooper_gender
  })

  const { data, error } = await supabase
      .from('performance_tests')
      .insert({
        user_id: user.id,
        student_id: studentId,
        test_date: testDate,
        test_type: testType,
        notes,
        speed,
        agility,
        strength,
        endurance,
        flexibility,
        coordination,
        balance,
        power,
        reaction_time,
        vo2_max,
        cooper_test_distance: cooper_distance
      })
      .select()
    .single()

  if (error) {
    console.error('Error creating test:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    throw new Error(`Erro ao criar teste: ${error.message}`)
  }

  revalidatePath('/tests')
  revalidatePath(`/evaluatees/${studentId}`)
  redirect(`/tests/${data.id}`)
}

export async function updateTest(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser()

  const id = formData.get('id') as string
  const studentId = formData.get('student_id') as string
  const testDate = formData.get('test_date') as string
  const testType = formData.get('test_type') as string
  const notes = formData.get('notes') as string
  
  // Métricas de performance
  const speed = formData.get('speed') ? parseFloat(formData.get('speed') as string) : null
  const agility = formData.get('agility') ? parseFloat(formData.get('agility') as string) : null
  const strength = formData.get('strength') ? parseFloat(formData.get('strength') as string) : null
  const endurance = formData.get('endurance') ? parseFloat(formData.get('endurance') as string) : null
  const flexibility = formData.get('flexibility') ? parseFloat(formData.get('flexibility') as string) : null
  const coordination = formData.get('coordination') ? parseFloat(formData.get('coordination') as string) : null
  const balance = formData.get('balance') ? parseFloat(formData.get('balance') as string) : null
  const power = formData.get('power') ? parseFloat(formData.get('power') as string) : null
  const reaction_time = formData.get('reaction_time') ? parseFloat(formData.get('reaction_time') as string) : null
  let vo2_max = formData.get('vo2_max') ? parseFloat(formData.get('vo2_max') as string) : null
  
  // Dados específicos do teste de Cooper
  const cooper_distance = formData.get('cooper_distance') ? parseFloat(formData.get('cooper_distance') as string) : null
  const cooper_age = formData.get('cooper_age') ? parseInt(formData.get('cooper_age') as string) : null
  const cooper_gender = formData.get('cooper_gender') as string
  
  // Se for teste de Cooper, calcular VO2 máximo automaticamente
  if (testType === 'cooper_vo2' && cooper_distance && cooper_age && cooper_gender) {
    // Nova fórmula do Cooper: VO2max = (distância em metros - 504,1) / 44,8
    vo2_max = Math.max(0, Math.round(((cooper_distance - 504.1) / 44.8) * 100) / 100)
  }

  if (!id || !studentId || !testDate || !testType) {
    throw new Error('Campos obrigatórios não preenchidos')
  }

  const { error } = await supabase
    .from('performance_tests')
    .update({
      student_id: studentId,
      test_date: testDate,
      test_type: testType,
      notes,
      speed,
      agility,
      strength,
      endurance,
      flexibility,
      coordination,
      balance,
      power,
      reaction_time,
      vo2_max,
      cooper_test_distance: cooper_distance
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating test:', error)
    throw new Error('Erro ao atualizar teste')
  }

  revalidatePath('/tests')
  revalidatePath(`/tests/${id}`)
  revalidatePath(`/evaluatees/${studentId}`)
  redirect(`/tests/${id}`)
}

export async function deleteTest(formData: FormData | { id: string }) {
  const { supabase, user } = await getAuthenticatedUser()

  // Suportar tanto FormData quanto objeto simples
  let id: string
  if (formData instanceof FormData) {
    id = formData.get('id') as string
  } else if (typeof formData === 'object' && formData.id) {
    id = formData.id
  } else {
    console.error('🔴 [SERVER ACTION] Tipo de dados inválido:', typeof formData, formData)
    throw new Error('Dados inválidos para exclusão')
  }
  
  if (!id) {
    throw new Error('ID do teste é obrigatório')
  }

  const { error } = await supabase
    .from('performance_tests')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('🔴 [SERVER ACTION] Erro ao excluir teste:', error)
    throw new Error('Erro ao excluir teste')
  }

  revalidatePath('/tests')
  redirect('/tests')
}

export async function getTestsByStudent(studentId: string) {
  return getTests(studentId)
}

export async function getTestsStats(studentId?: string) {
  const { supabase, user } = await getAuthenticatedUser()

  let query = supabase
    .from('performance_tests')
    .select('*')
    .eq('user_id', user.id)

  if (studentId) {
    query = query.eq('student_id', studentId)
  }

  const { data: tests, error } = await query

  if (error) {
    console.error('Error fetching tests stats:', error)
    // Se a tabela não existe, retorna dados vazios
    if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('relation "public.performance_tests" does not exist')) {
      console.warn('Tabela performance_tests não encontrada. Aguarde alguns minutos para o cache do PostgREST ser atualizado.')
    }
    return {
      total: 0,
      thisMonth: 0,
      averageScore: 0,
      lastTest: null
    }
  }

  const now = new Date()
  const normalizedTests: PerformanceTestDetail[] = (tests as PerformanceTestDetail[]) || []

  const thisMonth = normalizedTests.filter(test => {
    const testDate = new Date(test.test_date)
    return testDate.getMonth() === now.getMonth() && testDate.getFullYear() === now.getFullYear()
  }).length || 0

  const lastTest = normalizedTests.sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime())[0] || null

  // Calcular média das métricas disponíveis
  let totalScore = 0
  let scoreCount = 0

  const metricsList: (keyof PerformanceTestDetail)[] = ['speed', 'agility', 'strength', 'endurance', 'flexibility', 'coordination', 'balance', 'power']

  normalizedTests.forEach(test => {
    metricsList.forEach(metric => {
      const value = test[metric] as number
      if (value !== null && value !== undefined) {
        totalScore += value
        scoreCount++
      }
    })
  })

  const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0

  return {
    total: tests?.length || 0,
    thisMonth,
    averageScore: Math.round(averageScore * 100) / 100,
    lastTest
  }
}

export async function createPerformanceTest(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser()

  const studentId = formData.get('student_id') as string
  const testDate = formData.get('test_date') as string
  const cooperTestId = formData.get('cooper_test_id') as string
  const intensityPercentage = formData.get('intensity_percentage') ? parseFloat(formData.get('intensity_percentage') as string) : null
  const trainingTime = formData.get('training_time') ? parseFloat(formData.get('training_time') as string) : null
  const notes = formData.get('notes') as string

  // Dados calculados da prescrição
  const vo2Max = formData.get('vo2_max') ? parseFloat(formData.get('vo2_max') as string) : null
  const trainingIntensity = formData.get('training_intensity') ? parseFloat(formData.get('training_intensity') as string) : null
  const trainingVelocity = formData.get('training_velocity') ? parseFloat(formData.get('training_velocity') as string) : null
  const trainingDistance = formData.get('training_distance') ? parseFloat(formData.get('training_distance') as string) : null
  const totalO2Consumption = formData.get('total_o2_consumption') ? parseFloat(formData.get('total_o2_consumption') as string) : null
  const caloricExpenditure = formData.get('caloric_expenditure') ? parseFloat(formData.get('caloric_expenditure') as string) : null
  const weightLoss = formData.get('weight_loss') ? parseFloat(formData.get('weight_loss') as string) : null
  const bodyWeight = formData.get('body_weight') ? parseFloat(formData.get('body_weight') as string) : null

  if (!studentId || !testDate || !cooperTestId) {
    throw new Error('Campos obrigatórios não preenchidos')
  }

  console.log('Creating performance test with data:', {
    studentId,
    testDate,
    cooperTestId,
    vo2Max,
    intensityPercentage,
    trainingTime
  })

  const { data, error } = await supabase
    .from('performance_tests')
    .insert({
      user_id: user.id,
      student_id: studentId,
      test_date: testDate,
      test_type: 'performance_evaluation',
      notes,
      vo2_max: vo2Max,
      intensity_percentage: intensityPercentage,
      training_time: trainingTime,
      body_weight: bodyWeight,
      training_distance: trainingDistance,
      training_intensity: trainingIntensity,
      training_velocity: trainingVelocity,
      total_o2_consumption: totalO2Consumption,
      caloric_expenditure: caloricExpenditure,
      weight_loss: weightLoss
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating performance test:', error)
    throw new Error(`Erro ao criar teste de performance: ${error.message}`)
  }

  revalidatePath('/tests')
  revalidatePath(`/evaluatees/${studentId}`)
  
  return data
}