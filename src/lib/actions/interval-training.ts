'use server'

import { getAuthenticatedUser } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { calculateIntervalTrainingResults, IntervalInput } from '@/lib/interval-training'

export async function createIntervalTrainingTestAction(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser()

  const studentId = formData.get('student_id') as string
  const testDate = formData.get('test_date') as string
  const cooperDistance = formData.get('cooper_distance') ? parseFloat(formData.get('cooper_distance') as string) : 0
  const bodyWeight = formData.get('body_weight') ? parseFloat(formData.get('body_weight') as string) : 0
  const notes = (formData.get('notes') as string) || null
  const intervalsJson = (formData.get('intervals_json') as string) || '[]'

  let intervals: IntervalInput[] = []
  try {
    intervals = JSON.parse(intervalsJson)
  } catch (e) {
    throw new Error('Formato de intervalos inválido')
  }

  if (!studentId || !testDate || !cooperDistance || !bodyWeight || intervals.length === 0) {
    throw new Error('Campos obrigatórios não preenchidos')
  }

  const calc = calculateIntervalTrainingResults(cooperDistance, bodyWeight, intervals)

  const { data: test, error: insertError } = await supabase
    .from('performance_tests')
    .insert({
      user_id: user.id,
      student_id: studentId,
      test_date: testDate,
      test_type: 'interval_training',
      notes,
      vo2_max: calc.summary.vo2Max,
      cooper_test_distance: cooperDistance,
      body_weight: bodyWeight,
      training_distance: calc.summary.totalDistanceMeters,
      training_time: calc.summary.totalTimeMinutes,
      total_o2_consumption: calc.summary.totalO2Liters,
      caloric_expenditure: calc.summary.totalKcal,
      weight_loss: calc.summary.totalWeightLossGrams,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Erro ao criar teste intervalado:', insertError)
    throw new Error('Erro ao criar teste intervalado')
  }

  const testId = test.id as string

  const rows = calc.intervals.map((r, idx) => ({
    test_id: testId,
    order_index: idx + 1,
    mode: r.mode,
    distance_meters: r.distanceMeters,
    intensity_percentage: r.intensityPercentage ?? null,
    time_minutes: r.timeMinutes,
    velocity_m_per_min: r.velocityMPerMin,
    o2_consumption_l: r.totalO2Liters, // por intervalo total
    kcal: r.kcal,
    weight_loss_grams: r.weightLossGrams,
  }))

  const { error: intervalsError } = await supabase
    .from('interval_training_intervals')
    .insert(rows)

  if (intervalsError) {
    console.error('Erro ao salvar intervalos:', intervalsError)
    throw new Error('Erro ao salvar intervalos do teste')
  }

  revalidatePath('/tests')
  revalidatePath(`/evaluatees/${studentId}`)
  // Retorna o ID do teste criado para que o cliente possa
  // mostrar feedback explícito e navegar programaticamente.
  return { testId }
}