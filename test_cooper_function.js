// Script para testar especificamente a função getCooperTestsByStudent
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Simular a função getCooperTestsByStudent
async function testGetCooperTestsByStudent(studentId, userId) {
  console.log(`🔍 Testando getCooperTestsByStudent com studentId: ${studentId} e userId: ${userId}`)
  
  const { data, error } = await supabase
    .from('performance_tests')
    .select('*')
    .eq('user_id', userId)
    .eq('evaluatee_id', studentId)
    .eq('test_type', 'cooper_vo2')
    .not('cooper_test_distance', 'is', null)
    .order('test_date', { ascending: false })

  if (error) {
    console.error('❌ Erro na consulta:', error)
    return []
  }

  console.log(`✅ Resultado: ${data?.length || 0} testes encontrados`)
  if (data && data.length > 0) {
    data.forEach((test, index) => {
      console.log(`   ${index + 1}. ID: ${test.id}, Distância: ${test.cooper_test_distance}m, Data: ${test.test_date}, User ID: ${test.user_id}`)
    })
  }
  
  return data || []
}

async function main() {
  console.log('🧪 Testando a função getCooperTestsByStudent com diferentes user_ids...')
  
  const moisesId = 'fd22aadc-80d1-4d03-8ac0-e2f19e293812'
  
  try {
    // 1. Primeiro, vamos ver todos os testes do Moisés sem filtro de user_id
    console.log('\n1️⃣ Buscando TODOS os testes do Moisés (sem filtro de user_id):')
    const { data: allTests, error: allError } = await supabase
      .from('performance_tests')
      .select('*')
      .eq('evaluatee_id', moisesId)
      .eq('test_type', 'cooper_vo2')
      .not('cooper_test_distance', 'is', null)
      .order('test_date', { ascending: false })
    
    if (allError) {
      console.error('❌ Erro:', allError)
    } else {
      console.log(`✅ Encontrados ${allTests?.length || 0} testes do Moisés (todos os user_ids):`)
      if (allTests && allTests.length > 0) {
        allTests.forEach((test, index) => {
          console.log(`   ${index + 1}. ID: ${test.id}, User ID: ${test.user_id}, Distância: ${test.cooper_test_distance}m, Data: ${test.test_date}`)
        })
      }
    }
    
    // 2. Agora vamos testar com diferentes user_ids
    const userIds = [
      '9f6db044-a0e9-4862-a25f-e50d0cdbb5ba', // User ID que aparece nos logs
      'fa8493b0-f8e7-4404-9e9f-f380feda0bd7', // ID do LUIGUY
      'fd22aadc-80d1-4d03-8ac0-e2f19e293812', // ID do próprio Moisés
      '7cd5f092-36c6-4838-aa16-5be4069b7fd4'  // ID do outro Moisés
    ]
    
    for (const userId of userIds) {
      console.log(`\n2️⃣ Testando com user_id: ${userId}`)
      await testGetCooperTestsByStudent(moisesId, userId)
    }
    
    // 3. Verificar qual é o user_id correto dos testes do Moisés
    console.log('\n3️⃣ Verificando user_ids únicos nos testes do Moisés:')
    if (allTests && allTests.length > 0) {
      const uniqueUserIds = [...new Set(allTests.map(test => test.user_id))]
      console.log(`✅ User IDs únicos encontrados: ${uniqueUserIds.join(', ')}`)
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

main().catch(console.error)