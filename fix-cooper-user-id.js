import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://lwscabmoibokzsvpaogm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3c2NhYm1vaWJva3pzdnBhb2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5ODE0MCwiZXhwIjoyMDcwODc0MTQwfQ.VmBhMD22-7zPvVXJULcnoplMF-0QnA8EbOC4Y0ophK4' // Service role key para operações administrativas

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixCooperUserIdIssue() {
  console.log('🔧 Corrigindo incompatibilidade de user_id entre testes de Cooper e avaliandos\n')
  
  try {
    // 1. Verificar o problema atual
    console.log('1️⃣ Verificando problema atual:')
    const { data: problemTests, error: problemError } = await supabase
      .from('performance_tests')
      .select(`
        id,
        user_id,
        evaluatee_id,
        cooper_test_distance,
        test_date,
        evaluatees!performance_tests_evaluatee_id_fkey (
          user_id,
          name
        )
      `)
      .eq('test_type', 'cooper_vo2')
      .order('created_at', { ascending: false })

    if (problemError) {
      console.error('❌ Erro ao verificar problema:', problemError)
      return
    }

    console.log(`✅ Encontrados ${problemTests.length} testes de Cooper:`)
    let incompatibleCount = 0
    
    problemTests.forEach(test => {
      const evaluatee = test.evaluatees
      const isCompatible = test.user_id === evaluatee?.user_id
      const status = isCompatible ? '✅ COMPATÍVEL' : '❌ INCOMPATÍVEL'
      
      if (!isCompatible) incompatibleCount++
      
      console.log(`   - ${evaluatee?.name || 'Nome não encontrado'}`)
      console.log(`     Teste ID: ${test.id}`)
      console.log(`     Teste user_id: ${test.user_id}`)
      console.log(`     Avaliando user_id: ${evaluatee?.user_id || 'N/A'}`)
      console.log(`     Status: ${status}`)
      console.log('')
    })

    console.log(`📊 Resumo: ${incompatibleCount} de ${problemTests.length} testes têm user_id incompatível\n`)

    if (incompatibleCount === 0) {
      console.log('✅ Nenhum problema encontrado! Todos os testes têm user_id compatível.')
      return
    }

    // 2. Corrigir os testes incompatíveis
    console.log('2️⃣ Corrigindo testes incompatíveis:')
    
    for (const test of problemTests) {
      const evaluatee = test.evaluatees
      
      if (test.user_id !== evaluatee?.user_id && evaluatee?.user_id) {
        console.log(`🔧 Corrigindo teste ${test.id} (${evaluatee.name})...`)
        
        const { error: updateError } = await supabase
          .from('performance_tests')
          .update({ user_id: evaluatee.user_id })
          .eq('id', test.id)

        if (updateError) {
          console.error(`❌ Erro ao atualizar teste ${test.id}:`, updateError)
        } else {
          console.log(`✅ Teste ${test.id} atualizado com sucesso`)
        }
      }
    }

    // 3. Verificar se a correção foi aplicada
    console.log('\n3️⃣ Verificando se a correção foi aplicada:')
    const { data: fixedTests, error: fixedError } = await supabase
      .from('performance_tests')
      .select(`
        id,
        user_id,
        evaluatee_id,
        cooper_test_distance,
        test_date,
        evaluatees!performance_tests_evaluatee_id_fkey (
          user_id,
          name
        )
      `)
      .eq('test_type', 'cooper_vo2')
      .order('created_at', { ascending: false })

    if (fixedError) {
      console.error('❌ Erro ao verificar correção:', fixedError)
      return
    }

    let remainingIncompatible = 0
    fixedTests.forEach(test => {
      const evaluatee = test.evaluatees
      const isCompatible = test.user_id === evaluatee?.user_id
      
      if (!isCompatible) remainingIncompatible++
    })

    if (remainingIncompatible === 0) {
      console.log('✅ Correção aplicada com sucesso! Todos os testes agora têm user_id compatível.')
    } else {
      console.log(`⚠️  Ainda há ${remainingIncompatible} testes com user_id incompatível.`)
    }

    // 4. Verificar outros tipos de teste
    console.log('\n4️⃣ Verificando outros tipos de teste:')
    const { data: allTests, error: allTestsError } = await supabase
      .from('performance_tests')
      .select(`
        test_type,
        user_id,
        evaluatees!performance_tests_evaluatee_id_fkey (
          user_id
        )
      `)

    if (allTestsError) {
      console.error('❌ Erro ao verificar outros testes:', allTestsError)
      return
    }

    const testTypeStats = {}
    allTests.forEach(test => {
      const testType = test.test_type
      if (!testTypeStats[testType]) {
        testTypeStats[testType] = { total: 0, incompatible: 0 }
      }
      
      testTypeStats[testType].total++
      
      if (test.user_id !== test.evaluatees?.user_id) {
        testTypeStats[testType].incompatible++
      }
    })

    console.log('📊 Estatísticas por tipo de teste:')
    Object.entries(testTypeStats).forEach(([testType, stats]) => {
      const status = stats.incompatible > 0 ? '⚠️' : '✅'
      console.log(`   ${status} ${testType}: ${stats.incompatible}/${stats.total} incompatíveis`)
    })

    console.log('\n🎉 Correção concluída!')
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error)
  }
}

fixCooperUserIdIssue().catch(console.error)