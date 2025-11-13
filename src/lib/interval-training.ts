// Utilitários de cálculo para Treino Intervalado baseado no teste de Cooper
// Reutiliza as fórmulas já padronizadas em src/lib/performance-evaluation.ts

import {
  calculateVO2Max,
  calculateMaxMET,
  calculateTrainingFraction,
  calculateTrainingIntensity,
  calculateTrainingVelocity,
  calculateO2ConsumptionPerMinute,
  calculateCaloricExpenditure,
  calculateWeightLoss,
} from './performance-evaluation'

export type IntervalMode = 'distance_intensity' | 'distance_time'

export interface IntervalInput {
  mode: IntervalMode
  distanceMeters: number
  dayOfWeek?: string
  repetitions?: number
  restSeconds?: number
  // Quando mode = 'distance_intensity'
  intensityPercentage?: number
  // Quando mode = 'distance_time'
  timeMinutes?: number
}

export interface IntervalResult extends IntervalInput {
  // Derivados
  vo2Max: number
  maxMET: number
  trainingFraction: number
  trainingIntensity: number
  velocityMPerMin: number
  velocityKmPerHour: number
  timeMinutes: number
  trainingMET: number
  o2PerMinuteLiters: number
  totalO2Liters: number
  kcal: number
  weightLossGrams: number
}

export interface IntervalTrainingSummary {
  vo2Max: number
  maxMET: number
  totalDistanceMeters: number
  totalTimeMinutes: number
  totalO2Liters: number
  totalKcal: number
  totalWeightLossGrams: number
}

export interface IntervalTrainingCalculation {
  intervals: IntervalResult[]
  summary: IntervalTrainingSummary
}

/**
 * Calcula os resultados do circuito de treino intervalado.
 * Mantém consistência com os cálculos de performance-evaluation.
 */
export function calculateIntervalTrainingResults(
  cooperDistanceMeters: number,
  bodyWeightKg: number,
  intervals: IntervalInput[],
): IntervalTrainingCalculation {
  const vo2Max = calculateVO2Max(cooperDistanceMeters)
  const maxMET = calculateMaxMET(vo2Max)

  const results: IntervalResult[] = intervals.map((it) => {
    const base = { vo2Max, maxMET }
    const reps = Math.max(1, Math.round(it.repetitions ?? 1))
    const restSec = Math.max(0, Math.round(it.restSeconds ?? 0))

    if (it.mode === 'distance_intensity') {
      const intensityPct = Math.max(0, Math.round(it.intensityPercentage ?? 0))
      const trainingFraction = calculateTrainingFraction(maxMET, intensityPct)
      const trainingIntensity = calculateTrainingIntensity(maxMET, trainingFraction)
      const velocityMPerMin = calculateTrainingVelocity(trainingIntensity)
      const timeMinutesBase = it.distanceMeters / velocityMPerMin
      const timeMinutes = Math.round((timeMinutesBase * reps + (restSec * reps) / 60) * 100) / 100
      const velocityKmPerHour = Math.round(((velocityMPerMin * 60) / 1000) * 100) / 100
      const trainingMET = Math.round((maxMET * (intensityPct / 100)) * 100) / 100
      const o2PerMinuteLiters = calculateO2ConsumptionPerMinute(vo2Max, intensityPct, bodyWeightKg)
      const totalO2Liters = Math.round(o2PerMinuteLiters * timeMinutes * 100) / 100
      const kcal = calculateCaloricExpenditure(totalO2Liters)
      const weightLossGrams = calculateWeightLoss(kcal)

      return {
        ...it,
        ...base,
        trainingFraction,
        trainingIntensity,
        velocityMPerMin,
        velocityKmPerHour,
        timeMinutes,
        trainingMET,
        o2PerMinuteLiters,
        totalO2Liters,
        kcal,
        weightLossGrams,
      }
    } else {
      const timeMinutes = Math.max(0, it.timeMinutes ?? 0)
      const velocityMPerMin = timeMinutes > 0 ? it.distanceMeters / timeMinutes : 0
      const trainingIntensity = Math.round(((velocityMPerMin * 60) / 1000) * 100) / 100
      const trainingFraction = maxMET > 0 ? Math.round((trainingIntensity / maxMET) * 10000) / 10000 : 0
      // Pela modelagem atual: percentage ≈ FT*100 - METmáx
      const intensityPctApprox = Math.max(0, Math.round(trainingFraction * 100 - maxMET))
      const o2PerMinuteLiters = calculateO2ConsumptionPerMinute(vo2Max, intensityPctApprox, bodyWeightKg)
      const totalO2Liters = Math.round(o2PerMinuteLiters * (timeMinutes * reps + (restSec * reps) / 60) * 100) / 100
      const velocityKmPerHour = Math.round(((velocityMPerMin * 60) / 1000) * 100) / 100
      const trainingMET = Math.round((maxMET * (intensityPctApprox / 100)) * 100) / 100
      const kcal = calculateCaloricExpenditure(totalO2Liters)
      const weightLossGrams = calculateWeightLoss(kcal)

      return {
        ...it,
        intensityPercentage: intensityPctApprox,
        ...base,
        trainingFraction,
        trainingIntensity,
        velocityMPerMin: Math.round(velocityMPerMin * 100) / 100,
        velocityKmPerHour,
        timeMinutes: Math.round((timeMinutes * reps + (restSec * reps) / 60) * 100) / 100,
        trainingMET,
        o2PerMinuteLiters,
        totalO2Liters,
        kcal,
        weightLossGrams,
      }
    }
  })

  const summary: IntervalTrainingSummary = {
    vo2Max,
    maxMET,
    totalDistanceMeters: Math.round(results.reduce((acc, r) => acc + r.distanceMeters, 0)),
    totalTimeMinutes: Math.round(results.reduce((acc, r) => acc + r.timeMinutes, 0) * 100) / 100,
    totalO2Liters: Math.round(results.reduce((acc, r) => acc + r.totalO2Liters, 0) * 100) / 100,
    totalKcal: Math.round(results.reduce((acc, r) => acc + r.kcal, 0) * 100) / 100,
    totalWeightLossGrams: Math.round(results.reduce((acc, r) => acc + r.weightLossGrams, 0) * 100) / 100,
  }

  return { intervals: results, summary }
}