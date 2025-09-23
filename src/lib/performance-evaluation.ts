// Funções de cálculo para Avaliação de Desempenho
// Baseado nas fórmulas do arquivo "Calculos Vo2"

/**
 * Calcula o VO2 máximo baseado na distância percorrida no teste de Cooper
 * Nova fórmula: VO2max = (Distância - 504,1) / 44,8
 * @param cooperDistance - Distância percorrida em metros no teste de Cooper
 * @returns VO2 máximo em ml/kg/min
 */
export function calculateVO2Max(cooperDistance: number): number {
  const vo2Max = (cooperDistance - 504.1) / 44.8;
  return Math.max(0, Math.round(vo2Max * 100) / 100);
}

/**
 * Calcula o MET máximo baseado no VO2 máximo
 * Fórmula: MET Máx = VO2max / 3,5
 * @param vo2Max - VO2 máximo em ml/kg/min
 * @returns MET máximo
 */
export function calculateMaxMET(vo2Max: number): number {
  return Math.round((vo2Max / 3.5) * 100) / 100;
}

/**
 * Calcula a Fração do Treinamento (FT)
 * Fórmula: FT = MET Máx + (percentual / 100)
 * @param maxMET - MET máximo
 * @param intensityPercentage - Percentual de intensidade como valor inteiro (ex: 80 para 80%)
 * @returns Fração do Treinamento
 */
export function calculateTrainingFraction(maxMET: number, intensityPercentage: number): number {
  // Garantir que o percentual seja tratado como valor inteiro
  const percentage = Math.round(intensityPercentage);
  return Math.round((maxMET + (percentage / 100)) * 10000) / 10000;
}

/**
 * Calcula a Intensidade do Treinamento (IT)
 * Fórmula: IT = MET Máx x FT
 * @param maxMET - MET máximo
 * @param trainingFraction - Fração do Treinamento
 * @returns Intensidade do Treinamento
 */
export function calculateTrainingIntensity(maxMET: number, trainingFraction: number): number {
  return Math.round((maxMET * trainingFraction) * 100) / 100;
}

/**
 * Calcula a Velocidade do treino em metros por minuto
 * Fórmula: Vel m/m = IT / 60
 * @param trainingIntensity - Intensidade do Treinamento
 * @returns Velocidade em metros por minuto
 */
export function calculateTrainingVelocity(trainingIntensity: number): number {
  return Math.round((trainingIntensity / 60) * 100) / 100;
}

/**
 * Calcula a Distância do Treino (DT)
 * Fórmula: DT = Vel m/m x T
 * @param trainingVelocity - Velocidade em metros por minuto
 * @param trainingTime - Tempo de treino em minutos
 * @returns Distância do treino em metros
 */
export function calculateTrainingDistance(trainingVelocity: number, trainingTime: number): number {
  return Math.round(trainingVelocity * trainingTime);
}

/**
 * Calcula o Consumo de Oxigênio no treino (LO2/min)
 * Fórmula: Cons. O2T (LO2/min) = (VO2máx x % / 100) x PC / 1000
 * @param vo2Max - VO2 máximo em ml/kg/min
 * @param intensityPercentage - Percentual de intensidade (50-90%)
 * @param bodyWeight - Peso corporal em kg
 * @returns Consumo de O2 em litros por minuto
 */
export function calculateO2ConsumptionPerMinute(
  vo2Max: number,
  intensityPercentage: number,
  bodyWeight: number
): number {
  const consumption = (vo2Max * (intensityPercentage / 100) * bodyWeight) / 1000;
  return Math.round(consumption * 100) / 100;
}

/**
 * Calcula o Consumo Total de O2 no treino
 * Fórmula: Cons. O2 Total = Cons. O2 x Duração do treino
 * @param o2ConsumptionPerMinute - Consumo de O2 por minuto em litros
 * @param trainingTime - Duração do treino em minutos
 * @returns Consumo total de O2 em litros
 */
export function calculateTotalO2Consumption(
  o2ConsumptionPerMinute: number,
  trainingTime: number
): number {
  return Math.round((o2ConsumptionPerMinute * trainingTime) * 100) / 100;
}

/**
 * Calcula o Gasto Calórico
 * Fórmula: Gasto Cal. = Cons. O2 total x 5
 * @param totalO2Consumption - Consumo total de O2 em litros
 * @returns Gasto calórico em calorias
 */
export function calculateCaloricExpenditure(totalO2Consumption: number): number {
  return Math.round((totalO2Consumption * 5) * 100) / 100;
}

/**
 * Calcula o Peso Perdido em gramas
 * Fórmula: Peso Perdido (gr) = Gasto Calórico x 1000 / 7730
 * @param caloricExpenditure - Gasto calórico em calorias
 * @returns Peso perdido em gramas
 */
export function calculateWeightLoss(caloricExpenditure: number): number {
  return Math.round((caloricExpenditure * 1000 / 7730) * 100) / 100;
}

/**
 * Função principal que calcula todos os valores da avaliação de desempenho
 * @param cooperDistance - Distância percorrida no teste de Cooper em metros
 * @param intensityPercentage - Percentual de intensidade (50-90%)
 * @param trainingTime - Tempo de treino em minutos
 * @param bodyWeight - Peso corporal em kg
 * @returns Objeto com todos os cálculos
 */
export function calculatePerformanceEvaluation({
  cooperDistance,
  intensityPercentage,
  trainingTime,
  bodyWeight
}: {
  cooperDistance: number;
  intensityPercentage: number;
  trainingTime: number;
  bodyWeight: number;
}) {
  // 1. VO2 máximo
  const vo2Max = calculateVO2Max(cooperDistance);
  
  // 2. MET máximo
  const maxMET = calculateMaxMET(vo2Max);
  
  // 3. Fração do Treinamento (FT)
  const trainingFraction = calculateTrainingFraction(maxMET, intensityPercentage);
  
  // 4. Intensidade do Treinamento (IT)
  const trainingIntensity = calculateTrainingIntensity(maxMET, trainingFraction);
  
  // 5. Velocidade do treino (m/min)
  const trainingVelocity = calculateTrainingVelocity(trainingIntensity);
  
  // 6. Distância do Treino (DT)
  const trainingDistance = calculateTrainingDistance(trainingVelocity, trainingTime);
  
  // 7. Consumo de O2 por minuto
  const o2ConsumptionPerMinute = calculateO2ConsumptionPerMinute(vo2Max, intensityPercentage, bodyWeight);
  
  // 8. Consumo Total de O2
  const totalO2Consumption = calculateTotalO2Consumption(o2ConsumptionPerMinute, trainingTime);
  
  // 9. Gasto Calórico
  const caloricExpenditure = calculateCaloricExpenditure(totalO2Consumption);
  
  // 10. Peso Perdido
  const weightLoss = calculateWeightLoss(caloricExpenditure);

  return {
    vo2Max,
    maxMET,
    trainingFraction,
    trainingIntensity,
    trainingVelocity,
    trainingDistance,
    o2ConsumptionPerMinute,
    totalO2Consumption,
    caloricExpenditure,
    weightLoss
  };
}