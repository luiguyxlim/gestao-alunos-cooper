// Funções de cálculo para Avaliação de Desempenho
// Baseado nas fórmulas fornecidas nos documentos

/**
 * Calcula a distância de treino baseada no VO2 máximo e percentual de intensidade
 * Fórmula: Distância Percorrida = 504.1 / 44.8
 * @param vo2Max - VO2 máximo do avaliando
 * @param intensityPercentage - Percentual de intensidade (0-100)
 * @returns Distância de treino em metros
 */
export function calculateTrainingDistance(
  vo2Max: number,
  intensityPercentage: number
): number {
  // Fórmula base: 504.1 / 44.8 = distância base
  const baseDistance = 504.1 / 44.8;
  
  // Ajustar pela intensidade e VO2
  const adjustedDistance = (vo2Max * intensityPercentage / 100) * baseDistance;
  
  return Math.round(adjustedDistance);
}

/**
 * Calcula o VO2 máximo baseado na distância percorrida no teste de Cooper
 * Fórmula: VO2max = Distância Percorrida - 504.1 / 44.8
 * @param cooperDistance - Distância percorrida no teste de Cooper em metros
 * @returns VO2 máximo calculado
 */
export function calculateVO2Max(cooperDistance: number): number {
  const vo2Max = (cooperDistance - 504.1) / 44.8;
  return Math.round(vo2Max * 100) / 100; // Arredondar para 2 casas decimais
}

/**
 * Calcula a intensidade do treinamento baseada no VO2 máximo
 * @param vo2Max - VO2 máximo
 * @param intensityPercentage - Percentual de intensidade desejado
 * @returns Intensidade de treinamento
 */
export function calculateTrainingIntensity(
  vo2Max: number,
  intensityPercentage: number
): number {
  return (vo2Max * intensityPercentage) / 100;
}

/**
 * Calcula a velocidade do treino baseada na distância e tempo
 * @param distance - Distância em metros
 * @param timeMinutes - Tempo em minutos
 * @returns Velocidade em m/min
 */
export function calculateTrainingVelocity(
  distance: number,
  timeMinutes: number
): number {
  return distance / timeMinutes;
}

/**
 * Calcula o consumo de O2 total do treino
 * Fórmula: Cons. O2 x Duração do treino
 * @param vo2 - Consumo de O2 em L/min
 * @param durationMinutes - Duração do treino em minutos
 * @returns Consumo total de O2 em litros
 */
export function calculateTotalO2Consumption(
  vo2: number,
  durationMinutes: number
): number {
  return vo2 * durationMinutes;
}

/**
 * Calcula o gasto calórico baseado no consumo de O2 e peso corporal
 * Fórmula: Gasto Calórico = Cons.O2 total x 5 = 78.4 x 5 = 392 Cal.
 * @param totalO2Consumption - Consumo total de O2 em litros
 * @param bodyWeight - Peso corporal em kg
 * @returns Gasto calórico em calorias
 */
export function calculateCaloricExpenditure(
  totalO2Consumption: number,
  bodyWeight: number
): number {
  // Fórmula base: 1 litro de O2 = aproximadamente 5 kcal
  const baseCalories = totalO2Consumption * 5;
  
  // Ajustar pelo peso corporal (fator de correção)
  const weightFactor = bodyWeight / 70; // 70kg como peso de referência
  
  return Math.round(baseCalories * weightFactor);
}

/**
 * Calcula o peso perdido baseado no gasto calórico
 * Fórmula: Peso Perdido = Gasto Calórico x 1000 / 7730
 * @param caloricExpenditure - Gasto calórico em calorias
 * @returns Peso perdido em gramas
 */
export function calculateWeightLoss(caloricExpenditure: number): number {
  const weightLossGrams = (caloricExpenditure * 1000) / 7730;
  return Math.round(weightLossGrams * 100) / 100; // Arredondar para 2 casas decimais
}

/**
 * Calcula todos os valores da avaliação de desempenho
 * @param cooperDistance - Distância do teste de Cooper em metros
 * @param intensityPercentage - Percentual de intensidade (0-100)
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
  // 1. Calcular VO2 máximo
  const vo2Max = calculateVO2Max(cooperDistance);
  
  // 2. Calcular distância de treino
  const trainingDistance = calculateTrainingDistance(vo2Max, intensityPercentage);
  
  // 3. Calcular intensidade de treinamento
  const trainingIntensity = calculateTrainingIntensity(vo2Max, intensityPercentage);
  
  // 4. Calcular velocidade do treino
  const trainingVelocity = calculateTrainingVelocity(trainingDistance, trainingTime);
  
  // 5. Calcular consumo total de O2
  const totalO2Consumption = calculateTotalO2Consumption(trainingIntensity, trainingTime);
  
  // 6. Calcular gasto calórico
  const caloricExpenditure = calculateCaloricExpenditure(totalO2Consumption, bodyWeight);
  
  // 7. Calcular peso perdido
  const weightLoss = calculateWeightLoss(caloricExpenditure);
  
  return {
    vo2Max,
    trainingDistance,
    trainingIntensity,
    trainingVelocity,
    totalO2Consumption,
    caloricExpenditure,
    weightLoss
  };
}