/**
 * Funções para cálculo do VO2 máximo baseado no teste de Cooper
 * 
 * O teste de Cooper é um método simples para estimar o VO2 máximo de um indivíduo.
 * O teste consiste em correr continuamente por 12 minutos e registrar a distância percorrida.
 */

/**
 * Calcula o VO2 máximo baseado na distância percorrida no teste de Cooper (12 minutos)
 * 
 * @param distanceInMeters - Distância percorrida em metros durante 12 minutos
 * @returns VO2 máximo estimado em ml/kg/min
 */
export function calculateVO2MaxFromCooperTest(distanceInMeters: number): number {
  // Fórmula oficial do teste de Cooper para distância em metros:
  // VO2max = (distância em metros - 504.9) / 44.73
  const vo2Max = (distanceInMeters - 504.9) / 44.73
  
  // Garantir que o resultado não seja negativo
  return Math.max(0, Math.round(vo2Max * 100) / 100)
}

/**
 * Calcula o VO2 máximo usando a fórmula alternativa em quilômetros
 * 
 * @param distanceInKilometers - Distância percorrida em quilômetros durante 12 minutos
 * @returns VO2 máximo estimado em ml/kg/min
 */
export function calculateVO2MaxFromCooperTestKm(distanceInKilometers: number): number {
  // Fórmula alternativa: VO2max = (22.351 x distância em km) - 11.288
  const vo2Max = (22.351 * distanceInKilometers) - 11.288
  
  return Math.max(0, Math.round(vo2Max * 100) / 100)
}

/**
 * Avalia a classificação do VO2 máximo baseado na idade e gênero
 * 
 * @param vo2Max - Valor do VO2 máximo
 * @param age - Idade do avaliando
 * @param gender - Gênero ('masculino' ou 'feminino')
 * @returns Classificação do condicionamento físico
 */
export function classifyVO2Max(vo2Max: number, age: number, gender: 'masculino' | 'feminino'): string {
  // Tabelas de classificação baseadas em Cooper (1982)
  const maleClassification = {
    '20-29': { excellent: 52, good: 46, fair: 42, poor: 37 },
    '30-39': { excellent: 50, good: 44, fair: 40, poor: 35 },
    '40-49': { excellent: 48, good: 42, fair: 38, poor: 33 },
    '50-59': { excellent: 45, good: 39, fair: 35, poor: 30 },
    '60+': { excellent: 42, good: 36, fair: 32, poor: 28 }
  }
  
  const femaleClassification = {
    '20-29': { excellent: 44, good: 39, fair: 35, poor: 31 },
    '30-39': { excellent: 42, good: 37, fair: 33, poor: 29 },
    '40-49': { excellent: 40, good: 35, fair: 31, poor: 27 },
    '50-59': { excellent: 37, good: 32, fair: 28, poor: 24 },
    '60+': { excellent: 35, good: 30, fair: 26, poor: 22 }
  }
  
  const ageGroup = age < 30 ? '20-29' : 
                   age < 40 ? '30-39' : 
                   age < 50 ? '40-49' : 
                   age < 60 ? '50-59' : '60+'
  
  const classification = gender === 'masculino' ? maleClassification[ageGroup] : femaleClassification[ageGroup]
  
  if (vo2Max >= classification.excellent) return 'Excelente'
  if (vo2Max >= classification.good) return 'Bom'
  if (vo2Max >= classification.fair) return 'Regular'
  if (vo2Max >= classification.poor) return 'Fraco'
  return 'Muito Fraco'
}

/**
 * Converte metros para quilômetros
 */
export function metersToKilometers(meters: number): number {
  return meters / 1000
}

/**
 * Converte quilômetros para metros
 */
export function kilometersToMeters(kilometers: number): number {
  return kilometers * 1000
}

/**
 * Valida se a distância está dentro de um range razoável para o teste de Cooper
 */
export function validateCooperTestDistance(distanceInMeters: number): { isValid: boolean; message?: string } {
  if (distanceInMeters < 500) {
    return { isValid: false, message: 'Distância muito baixa. Mínimo esperado: 500 metros.' }
  }
  
  if (distanceInMeters > 5000) {
    return { isValid: false, message: 'Distância muito alta. Máximo esperado: 5000 metros.' }
  }
  
  return { isValid: true }
}

/**
 * Interface para o resultado do teste de Cooper
 */
export interface CooperTestResult {
  distanceInMeters: number
  distanceInKilometers: number
  vo2Max: number
  classification: string
  isValid: boolean
  validationMessage?: string
}

/**
 * Executa o cálculo completo do teste de Cooper
 */
export function performCooperTestCalculation(
  distanceInMeters: number, 
  age: number, 
  gender: 'masculino' | 'feminino'
): CooperTestResult {
  const validation = validateCooperTestDistance(distanceInMeters)
  
  if (!validation.isValid) {
    return {
      distanceInMeters,
      distanceInKilometers: metersToKilometers(distanceInMeters),
      vo2Max: 0,
      classification: 'Inválido',
      isValid: false,
      validationMessage: validation.message
    }
  }
  
  const vo2Max = calculateVO2MaxFromCooperTest(distanceInMeters)
  const classification = classifyVO2Max(vo2Max, age, gender)
  
  return {
    distanceInMeters,
    distanceInKilometers: metersToKilometers(distanceInMeters),
    vo2Max,
    classification,
    isValid: true
  }
}