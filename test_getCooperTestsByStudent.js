import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Simular a função getCooperTestsByStudent
async function testGetCooperTestsByStudent(studentId) {
  console.log('🔍 DEBUG: Buscando testes de Cooper para studentId:', studentId)

  const { data, error } = await supabase
    .from('performance_tests')
    .select('*')
    .eq('evaluatee_id', studentId)
    .eq('test_type', 'cooper_vo2')
    .not('cooper_test_distance', 'is', null)
    .order('test_date', { ascending: false })

  console.log('🔍 DEBUG: Resultado da busca de testes de Cooper:', { data, error })

  if (error) {
    console.error('Erro ao buscar testes de Cooper:', error)
    throw new Error('Erro ao buscar testes de Cooper')
  }

  // Buscar TODOS os testes de Cooper para comparação
  const { data: allCooperTests } = await supabase
    .from('performance_tests')
    .select('id, evaluatee_id, cooper_test_distance, test_date')
    .eq('test_type', 'cooper_vo2')
    .not('cooper_test_distance', 'is', null)
    .order('test_date', { ascending: false })

  console.log('🔍 DEBUG: TODOS os testes de Cooper no banco:', allCooperTests)

  return data || []
}

async function main() {
  console.log('🧪 Testando a função getCooperTestsByStudent...')
  
  const moisesId = 'fd22aadc-80d1-4d03-8ac0-e2f19e293812'
  
  try {
    console.log(`\n1️⃣ Testando com ID do Moisés: ${moisesId}`)
    const result = await testGetCooperTestsByStudent(moisesId)
    
    console.log('\n📊 Resultado final:')
    console.log(`✅ Encontrados ${result.length} teste(s) de Cooper para o Moisés`)
    
    if (result.length > 0) {
      result.forEach((test, index) => {
        console.log(`   ${index + 1}. ID: ${test.id}, Distância: ${test.cooper_test_distance}m, Data: ${test.test_date}, VO2: ${test.vo2_max}`)
      })
    } else {
      console.log('❌ Nenhum teste encontrado!')
    }
    
    // Testar também com outros IDs do Moisés
    const otherMoisesIds = [
      '7cd5f092-36c6-4838-aa16-5be4069b7fd4', // Moisés Simão Santa Rosa de Sousa
      'dee3a1d1-28da-4fc1-9a1a-6ff06e6fbe4f'  // mosies santa rosa
    ]
    
    for (const id of otherMoisesIds) {
      console.log(`\n2️⃣ Testando com outro ID do Moisés: ${id}`)
      const otherResult = await testGetCooperTestsByStudent(id)
      console.log(`✅ Encontrados ${otherResult.length} teste(s) para este ID`)
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

main().catch(console.error)