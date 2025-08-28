'use client'

import { useState, memo } from 'react'

interface Student {
  id: string
  name: string
  birth_date: string
  gender: 'masculino' | 'feminino' | 'outro'
}

interface CooperCalculatorProps {
  students: Student[]
}

function CooperCalculator({ students }: CooperCalculatorProps) {
  const [results, setResults] = useState<{
    vo2Max: number
    classification: string
    distanceKm: number
  } | null>(null)

  const calculateVO2 = () => {
    const distanceInput = document.getElementById('cooper_distance') as HTMLInputElement
    const studentSelect = document.getElementById('evaluatee_id') as HTMLSelectElement
    const vo2Input = document.getElementById('vo2_max') as HTMLInputElement
    
    if (!distanceInput || !studentSelect || !vo2Input) {
      alert('Erro: Elementos do formulário não encontrados.')
      return
    }

    const distance = parseFloat(distanceInput.value)
    const selectedStudentId = studentSelect.value

    if (!distance || isNaN(distance)) {
      alert('Por favor, preencha a distância percorrida.')
      return
    }

    if (!selectedStudentId) {
      alert('Por favor, selecione um avaliando.')
      return
    }

    if (distance < 500 || distance > 5000) {
      alert('Distância deve estar entre 500 e 5000 metros.')
      return
    }

    // Buscar dados do estudante selecionado
    const selectedStudent = students.find(s => s.id === selectedStudentId)

    if (!selectedStudent || !selectedStudent.birth_date || !selectedStudent.gender) {
      alert('O avaliando selecionado não possui data de nascimento ou sexo cadastrados. Por favor, complete o cadastro do avaliando antes de realizar o teste.')
      return
    }

    // Calcular idade
    const birthDate = new Date(selectedStudent.birth_date)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    const gender = selectedStudent.gender

    // Fórmula do Cooper: VO2max = (distância em metros - 504.9) / 44.73
    const vo2Max = Math.max(0, Math.round(((distance - 504.9) / 44.73) * 100) / 100)

    // Classificação baseada na idade e gênero
    const classifications = {
      masculino: {
        '20-29': { excellent: 52, good: 46, fair: 42, poor: 37 },
        '30-39': { excellent: 50, good: 44, fair: 40, poor: 35 },
        '40-49': { excellent: 48, good: 42, fair: 38, poor: 33 },
        '50-59': { excellent: 45, good: 39, fair: 35, poor: 30 },
        '60+': { excellent: 42, good: 36, fair: 32, poor: 28 }
      },
      feminino: {
        '20-29': { excellent: 44, good: 39, fair: 35, poor: 31 },
        '30-39': { excellent: 42, good: 37, fair: 33, poor: 29 },
        '40-49': { excellent: 40, good: 35, fair: 31, poor: 27 },
        '50-59': { excellent: 37, good: 32, fair: 28, poor: 24 },
        '60+': { excellent: 35, good: 30, fair: 26, poor: 22 }
      }
    }

    const ageGroup = age < 30 ? '20-29' : 
                     age < 40 ? '30-39' : 
                     age < 50 ? '40-49' : 
                     age < 60 ? '50-59' : '60+'

    const classification = classifications[gender as 'masculino' | 'feminino']?.[ageGroup] || 
                          classifications['masculino']['20-29'] // fallback

    let classificationText = 'Muito Fraco'

    if (vo2Max >= classification.excellent) classificationText = 'Excelente'
    else if (vo2Max >= classification.good) classificationText = 'Bom'
    else if (vo2Max >= classification.fair) classificationText = 'Regular'
    else if (vo2Max >= classification.poor) classificationText = 'Fraco'

    // Preencher campo VO2 Max
    vo2Input.value = vo2Max.toString()

    // Preencher campos ocultos para envio do formulário
    const ageHidden = document.getElementById('cooper_age_hidden') as HTMLInputElement
    const genderHidden = document.getElementById('cooper_gender_hidden') as HTMLInputElement

    if (ageHidden) ageHidden.value = age.toString()
    if (genderHidden) genderHidden.value = gender

    // Atualizar estado para mostrar resultados
    setResults({
      vo2Max,
      classification: classificationText,
      distanceKm: distance / 1000
    })
  }

  return (
    <>
      <div className="mt-4">
        <button
          type="button"
          onClick={calculateVO2}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Calcular VO2 Máximo
        </button>
      </div>

      {results && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Resultados do Teste de Cooper</h4>
          <div className="text-sm text-blue-800">
            <p><strong>VO2 Máximo:</strong> {results.vo2Max} ml/kg/min</p>
            <p><strong>Classificação:</strong> {results.classification}</p>
            <p><strong>Distância:</strong> {results.distanceKm.toFixed(2)} km</p>
          </div>
        </div>
      )}
    </>
  )
}

export default memo(CooperCalculator)