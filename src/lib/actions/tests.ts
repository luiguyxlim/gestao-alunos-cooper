'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function getTests(studentId?: string) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let query = supabase
    .from('performance_tests')
    .select(`
      *,
      evaluatees (
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
    query = query.eq('evaluatee_id', studentId)
  }

  const { data: tests, error } = await query

  if (error) {
    console.error('Error fetching tests:', error)
    return []
  }

  return tests || []
}

export async function getTest(id: string) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: test, error } = await supabase
    .from('performance_tests')
    .select(`
      *,
      evaluatees (
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

  if (error) {
    console.error('Error fetching test:', error)
    // Se a tabela não existe, retorna null
    if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('relation "public.performance_tests" does not exist')) {
      console.warn('Tabela performance_tests não encontrada. Aguarde alguns minutos para o cache do PostgREST ser atualizado.')
    }
    return null
  }

  return test
}

export async function createTest(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const studentId = formData.get('evaluatee_id') as string
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
    // Fórmula do Cooper: VO2max = (distância em metros - 504.9) / 44.73
    vo2_max = Math.max(0, Math.round(((cooper_distance - 504.9) / 44.73) * 100) / 100)
  }

  if (!studentId || !testDate || !testType) {
    throw new Error('Campos obrigatórios não preenchidos')
  }

  const { data, error } = await supabase
      .from('performance_tests')
      .insert({
        user_id: user.id,
        evaluatee_id: studentId,
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
    throw new Error('Erro ao criar teste')
  }

  revalidatePath('/tests')
  revalidatePath(`/evaluatees/${studentId}`)
  redirect(`/tests/${data.id}`)
}

export async function updateTest(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const id = formData.get('id') as string
  const studentId = formData.get('evaluatee_id') as string
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
    // Fórmula do Cooper: VO2max = (distância em metros - 504.9) / 44.73
    vo2_max = Math.max(0, Math.round(((cooper_distance - 504.9) / 44.73) * 100) / 100)
  }

  if (!id || !studentId || !testDate || !testType) {
    throw new Error('Campos obrigatórios não preenchidos')
  }

  const { error } = await supabase
    .from('performance_tests')
    .update({
      evaluatee_id: studentId,
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
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let query = supabase
    .from('performance_tests')
    .select('*')
    .eq('user_id', user.id)

  if (studentId) {
    query = query.eq('evaluatee_id', studentId)
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
  const thisMonth = tests?.filter(test => {
    const testDate = new Date(test.test_date)
    return testDate.getMonth() === now.getMonth() && testDate.getFullYear() === now.getFullYear()
  }).length || 0

  const lastTest = tests?.sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime())[0] || null

  // Calcular média das métricas disponíveis
  const metrics = ['speed', 'agility', 'strength', 'endurance', 'flexibility', 'coordination', 'balance', 'power']
  let totalScore = 0
  let scoreCount = 0

  tests?.forEach(test => {
    metrics.forEach(metric => {
      const value = test[metric as keyof typeof test] as number
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