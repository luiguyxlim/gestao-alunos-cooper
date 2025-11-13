/**
 * Metadados de colunas para relatórios de Performance
 * Define a estrutura de dados das colunas para geração automática de tabelas
 */

export interface ColumnMetadata {
  key: string
  label: string
  unit?: string
  formatter?: (value: number | string | null) => string
}

/**
 * Colunas do Teste de Cooper
 * Inclui apenas as variáveis essenciais do teste de desempenho aeróbio
 */
export const cooperColumns: ColumnMetadata[] = [
  {
    key: 'test_date',
    label: 'Data',
    formatter: (value) => {
      if (!value) return 'N/A'
      if (typeof value === 'string') {
        return new Date(value).toLocaleDateString('pt-BR')
      }
      return 'N/A'
    }
  },
  {
    key: 'cooper_test_distance',
    label: 'Distância Cooper',
    unit: 'm',
    formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(0)} m`
    }
  },
  {
    key: 'vo2_max',
    label: 'VO₂ Máximo',
    unit: 'ml/kg/min',
    formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(2)} ml/kg/min`
    }
  }
]

/**
 * Colunas da Prescrição de Treinamento
 * Inclui todas as variáveis calculadas a partir do teste de Cooper
 */
export const prescriptionColumns: ColumnMetadata[] = [
  {
    key: 'test_date',
    label: 'Data',
    formatter: (value) => {
      if (!value) return 'N/A'
      if (typeof value === 'string') {
        return new Date(value).toLocaleDateString('pt-BR')
      }
      return 'N/A'
    }
  },
  {
    key: 'intensity_percentage',
    label: '% Intensidade',
    unit: '%',
    formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(0)}%`
    }
  },
  {
    key: 'training_time',
    label: 'Tempo de Treino',
    unit: 'min',
    formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(0)} min`
    }
  },
  {
    key: 'training_velocity',
    label: 'Velocidade',
    unit: 'm/min',
    formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(2)} m/min`
    }
  },
  {
    key: 'training_distance',
    label: 'Distância',
    unit: 'm',
    formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)} km`
      }
      return `${value.toFixed(0)} m`
    }
  },
  {
    key: 'training_intensity',
    label: 'MET',
    unit: 'ml/kg/min',
    formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(2)} ml/kg/min`
    }
  },
  {
    key: 'total_o2_consumption',
    label: 'Consumo Total de O₂',
    unit: 'L',
    formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(2)} L`
    }
  },
  {
    key: 'caloric_expenditure',
    label: 'Gasto Calórico',
    unit: 'kcal',
    formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(0)} kcal`
    }
  },
  {
    key: 'weight_loss',
    label: 'Peso Perdido',
    unit: 'g',
    formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(1)} g`
    }
  },
  {
    key: 'body_weight',
    label: 'Peso Corporal',
    unit: 'kg',
    formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(1)} kg`
    }
  }
]

/**
 * Colunas dos Intervalos de Treino Intervalado
 * Cada linha representa um intervalo de um teste intervalado
 */
export const intervalColumns: ColumnMetadata[] = [
  { key: 'order_index', label: '#', formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value}`
    }
  },
  { key: 'mode', label: 'Modo', formatter: (value) => {
      if (typeof value !== 'string') return 'N/A'
      return value === 'distance_intensity' ? 'Distância + Intensidade' : 'Distância + Tempo'
    }
  },
  { key: 'distance_meters', label: 'Distância', unit: 'm', formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(0)} m`
    }
  },
  { key: 'intensity_percentage', label: '% Intensidade', unit: '%', formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(0)}%`
    }
  },
  { key: 'time_minutes', label: 'Tempo', unit: 'min', formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(2)} min`
    }
  },
  { key: 'velocity_m_per_min', label: 'Velocidade', unit: 'm/min', formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(2)} m/min`
    }
  },
  { key: 'o2_consumption_l', label: 'Consumo O₂', unit: 'L', formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(2)} L`
    }
  },
  { key: 'kcal', label: 'Kcal', unit: 'kcal', formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(0)} kcal`
    }
  },
  { key: 'weight_loss_grams', label: 'Perda de Peso', unit: 'g', formatter: (value) => {
      if (typeof value !== 'number' || isNaN(value)) return 'N/A'
      return `${value.toFixed(1)} g`
    }
  }
]

/**
 * Obtém um formatador por padrão baseado na chave da coluna
 */
export function getDefaultFormatter(): (value: unknown) => string {
  return (value) => {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'number') {
      if (isNaN(value)) return 'N/A'
      return value.toFixed(2).toString()
    }
    return String(value)
  }
}

/**
 * Obtém todas as colunas combinadas para CSV
 * Inclui identificação do tipo de teste
 */
export const allReportColumns: (ColumnMetadata & { group: 'cooper' | 'prescription' })[] = [
  ...cooperColumns.map(col => ({ ...col, group: 'cooper' as const })),
  ...prescriptionColumns.filter(col => col.key !== 'test_date').map(col => ({ ...col, group: 'prescription' as const }))
]

/**
 * Obtém apenas as chaves únicas de todas as colunas
 */
export function getAllUniqueKeys(): string[] {
  const keys = new Set<string>()
  cooperColumns.forEach(col => keys.add(col.key))
  prescriptionColumns.forEach(col => keys.add(col.key))
  intervalColumns.forEach(col => keys.add(col.key))
  return Array.from(keys)
}

