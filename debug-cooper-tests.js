import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://lwscabmoibokzsvpaogm.supabase.co'
const supabaseKey = 'sb_publishable_wh-6cMRYyEz2zTtU4FTXFQ_W4gkudGW'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugCooperTests() {
  console.log('🔍 DEBUG: Investigando problema com testes de Cooper na avaliação de desempenho\n')
  
  // 1. Verificar todos os testes de Cooper
  console.log('1️⃣ Buscando TODOS os testes de Cooper:')
  const { data: allCooperTests, error: allError } = await supabase
    .from('performance_tests')
    .select('*')
    .eq('test_type', 'cooper_vo2')
    .not('cooper_test_distance', 'is', null)
    .order('test_date', { ascending: false })

  if (allError) {
    console.error('❌ Erro ao buscar todos os testes:', allError)
  } else {
    console.log(`✅ Encontrados ${allCooperTests.length} testes de Cooper no total:`)
    allCooperTests.forEach(test => {
      console.log(`   - ID: ${test.id}, Evaluatee: ${test.evaluatee_id}, User: ${test.user_id}, Distância: ${test.cooper_test_distance}m`)
    })
  }

  // 2. Verificar avaliandos ativos
  console.log('\n2️⃣ Buscando avaliandos ativos:')
  const { data: evaluatees, error: evaluateesError } = await supabase
    .from('evaluatees')
    .select('*')
    .eq('active', true)
    .order('name')

  if (evaluateesError) {
    console.error('❌ Erro ao buscar avaliandos:', evaluateesError)
  } else {
    console.log(`✅ Encontrados ${evaluatees.length} avaliandos ativos:`)
    evaluatees.forEach(evaluatee => {
      console.log(`   - ${evaluatee.name} (ID: ${evaluatee.id}, User: ${evaluatee.user_id})`)
    })
  }

  // 3. Testar função getCooperTestsByStudent simulada SEM filtro user_id
  console.log('\n3️⃣ Testando busca de testes SEM filtro user_id:')
  const moisesId = 'fd22aadc-80d1-4d03-8ac0-e2f19e293812'
  
  const { data: testsWithoutUserFilter, error: testError } = await supabase
    .from('performance_tests')
    .select('*')
    .eq('evaluatee_id', moisesId)
    .eq('test_type', 'cooper_vo2')
    .not('cooper_test_distance', 'is', null)
    .order('test_date', { ascending: false })

  if (testError) {
    console.error('❌ Erro ao buscar testes sem filtro user_id:', testError)
  } else {
    console.log(`✅ Encontrados ${testsWithoutUserFilter.length} testes para Moisés SEM filtro user_id:`)
    testsWithoutUserFilter.forEach(test => {
      console.log(`   - ID: ${test.id}, User: ${test.user_id}, Distância: ${test.cooper_test_distance}m, Data: ${test.test_date}`)
    })
  }

  // 4. Verificar se há incompatibilidade de user_id
  if (allCooperTests.length > 0 && evaluatees.length > 0) {
    console.log('\n4️⃣ Verificando compatibilidade de user_id:')
    
    const cooperTest = allCooperTests[0]
    const evaluatee = evaluatees.find(e => e.id === cooperTest.evaluatee_id)
    
    if (evaluatee) {
      console.log(`   - Teste user_id: ${cooperTest.user_id}`)
      console.log(`   - Avaliando user_id: ${evaluatee.user_id}`)
      console.log(`   - Compatível: ${cooperTest.user_id === evaluatee.user_id ? '✅ SIM' : '❌ NÃO'}`)
      
      if (cooperTest.user_id !== evaluatee.user_id) {
        console.log('\n⚠️  PROBLEMA IDENTIFICADO: user_id incompatível entre teste e avaliando!')
        console.log('   Isso explica por que a função getCooperTestsByStudent não retorna resultados.')
      }
    }
  }

  // 5. Testar com user_id correto
  if (allCooperTests.length > 0) {
    console.log('\n5️⃣ Testando com user_id do teste:')
    const testUserId = allCooperTests[0].user_id
    const testEvaluateeId = allCooperTests[0].evaluatee_id
    
    const { data: testsWithCorrectUser, error: correctUserError } = await supabase
      .from('performance_tests')
      .select('*')
      .eq('user_id', testUserId)
      .eq('evaluatee_id', testEvaluateeId)
      .eq('test_type', 'cooper_vo2')
      .not('cooper_test_distance', 'is', null)
      .order('test_date', { ascending: false })

    if (correctUserError) {
      console.error('❌ Erro ao buscar com user_id correto:', correctUserError)
    } else {
      console.log(`✅ Encontrados ${testsWithCorrectUser.length} testes com user_id correto (${testUserId}):`)
      testsWithCorrectUser.forEach(test => {
        console.log(`   - ID: ${test.id}, Distância: ${test.cooper_test_distance}m, Data: ${test.test_date}`)
      })
    }
  }
}

debugCooperTests().catch(console.error)