import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://lwscabmoibokzsvpaogm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3c2NhYm1vaWJva3pzdnBhb2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5ODE0MCwiZXhwIjoyMDcwODc0MTQwfQ.VmBhMD22-7zPvVXJULcnoplMF-0QnA8EbOC4Y0ophK4'

const supabase = createClient(supabaseUrl, supabaseKey)

// Simular a função getCooperTestsByStudent
async function getCooperTestsByStudent(userId, evaluateeId) {
  const { data, error } = await supabase
    .from('performance_tests')
    .select('*')
    .eq('user_id', userId)
    .eq('evaluatee_id', evaluateeId)
    .eq('test_type', 'cooper_vo2')
    .not('cooper_test_distance', 'is', null)
    .order('test_date', { ascending: false })

  if (error) {
    console.error('Erro ao buscar testes:', error)
    return []
  }

  return data || []
}

async function testCooperFunctionality() {
  console.log('🧪 Testando funcionalidade de testes de Cooper após correção\n')
  
  try {
    // 1. Buscar avaliandos ativos
    console.log('1️⃣ Buscando avaliandos ativos:')
    const { data: evaluatees, error: evaluateesError } = await supabase
      .from('evaluatees')
      .select('*')
      .eq('active', true)
      .order('name')

    if (evaluateesError) {
      console.error('❌ Erro ao buscar avaliandos:', evaluateesError)
      return
    }

    console.log(`✅ Encontrados ${evaluatees.length} avaliandos ativos:`)
    evaluatees.forEach(evaluatee => {
      console.log(`   - ${evaluatee.name} (ID: ${evaluatee.id}, User ID: ${evaluatee.user_id})`)
    })
    console.log('')

    // 2. Testar a função getCooperTestsByStudent para cada avaliando
    console.log('2️⃣ Testando função getCooperTestsByStudent:')
    
    for (const evaluatee of evaluatees) {
      console.log(`🔍 Testando para ${evaluatee.name}:`)
      
      const cooperTests = await getCooperTestsByStudent(evaluatee.user_id, evaluatee.id)
      
      if (cooperTests.length > 0) {
        console.log(`   ✅ Encontrados ${cooperTests.length} testes de Cooper:`)
        cooperTests.forEach(test => {
          console.log(`      - Teste ID: ${test.id}`)
          console.log(`        Data: ${test.test_date}`)
          console.log(`        Distância: ${test.cooper_test_distance}m`)
          console.log(`        User ID: ${test.user_id}`)
          console.log(`        Evaluatee ID: ${test.evaluatee_id}`)
          console.log('')
        })
      } else {
        console.log(`   ⚠️  Nenhum teste de Cooper encontrado`)
      }
      console.log('')
    }

    // 3. Verificar especificamente o caso do Moisés
    console.log('3️⃣ Verificação específica para MOISES SANTA ROSA:')
    const moises = evaluatees.find(e => e.name.includes('MOISES'))
    
    if (moises) {
      console.log(`🎯 Testando para ${moises.name}:`)
      console.log(`   User ID: ${moises.user_id}`)
      console.log(`   Evaluatee ID: ${moises.id}`)
      
      const moisesTests = await getCooperTestsByStudent(moises.user_id, moises.id)
      
      if (moisesTests.length > 0) {
        console.log(`   ✅ SUCESSO! Encontrados ${moisesTests.length} testes de Cooper para Moisés`)
        console.log('   📊 Detalhes dos testes:')
        moisesTests.forEach((test, index) => {
          console.log(`      Teste ${index + 1}:`)
          console.log(`        - ID: ${test.id}`)
          console.log(`        - Data: ${test.test_date}`)
          console.log(`        - Distância: ${test.cooper_test_distance}m`)
          console.log(`        - VO2 Max: ${test.cooper_vo2_max || 'N/A'}`)
        })
      } else {
        console.log(`   ❌ PROBLEMA! Nenhum teste encontrado para Moisés`)
      }
    } else {
      console.log('   ⚠️  Avaliando Moisés não encontrado')
    }

    console.log('\n🎉 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

testCooperFunctionality().catch(console.error)