import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://lwscabmoibokzsvpaogm.supabase.co'
const supabaseKey = 'sb_publishable_wh-6cMRYyEz2zTtU4FTXFQ_W4gkudGW'

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
    console.error('Erro ao buscar testes de Cooper:', error)
    throw new Error('Erro ao buscar testes de Cooper')
  }

  return data || []
}

async function verifyFinalState() {
  console.log('🔍 Verificação final do estado da aplicação\n')
  
  try {
    // 1. Verificar avaliandos ativos
    console.log('1️⃣ Verificando avaliandos ativos:')
    const { data: activeEvaluatees, error: evaluateesError } = await supabase
      .from('evaluatees')
      .select('*')
      .eq('active', true)
      .order('name')

    if (evaluateesError) {
      console.error('❌ Erro ao buscar avaliandos:', evaluateesError)
      return
    }

    console.log(`✅ Total de avaliandos ativos: ${activeEvaluatees.length}`)
    activeEvaluatees.forEach(evaluatee => {
      console.log(`   - ${evaluatee.name} (ID: ${evaluatee.id}, User: ${evaluatee.user_id})`)
    })
    console.log('')

    // 2. Verificar se há duplicados de Moisés
    console.log('2️⃣ Verificando duplicados de Moisés:')
    const moisesEvaluatees = activeEvaluatees.filter(e => 
      e.name.toLowerCase().includes('mois') || 
      e.name.toLowerCase().includes('santa') || 
      e.name.toLowerCase().includes('rosa')
    )

    if (moisesEvaluatees.length > 1) {
      console.log(`⚠️  ATENÇÃO: Ainda existem ${moisesEvaluatees.length} avaliandos similares ao Moisés:`)
      moisesEvaluatees.forEach(evaluatee => {
        console.log(`   - ${evaluatee.name} (ID: ${evaluatee.id})`)
      })
    } else if (moisesEvaluatees.length === 1) {
      console.log(`✅ Apenas 1 avaliando Moisés encontrado: ${moisesEvaluatees[0].name}`)
    } else {
      console.log('⚠️  Nenhum avaliando Moisés encontrado')
    }
    console.log('')

    // 3. Verificar todos os testes de Cooper
    console.log('3️⃣ Verificando todos os testes de Cooper:')
    const { data: allCooperTests, error: cooperError } = await supabase
      .from('performance_tests')
      .select(`
        id,
        test_date,
        cooper_test_distance,
        user_id,
        evaluatee_id,
        evaluatees!performance_tests_evaluatee_id_fkey (
          name,
          active
        )
      `)
      .eq('test_type', 'cooper_vo2')
      .not('cooper_test_distance', 'is', null)
      .order('test_date', { ascending: false })

    if (cooperError) {
      console.error('❌ Erro ao buscar testes de Cooper:', cooperError)
      return
    }

    console.log(`✅ Total de testes de Cooper: ${allCooperTests.length}`)
    
    // Agrupar por avaliando
    const testsByEvaluatee = {}
    allCooperTests.forEach(test => {
      const evaluateeName = test.evaluatees?.name || 'Nome não encontrado'
      const isActive = test.evaluatees?.active || false
      
      if (!testsByEvaluatee[evaluateeName]) {
        testsByEvaluatee[evaluateeName] = {
          tests: [],
          isActive
        }
      }
      testsByEvaluatee[evaluateeName].tests.push(test)
    })

    Object.entries(testsByEvaluatee).forEach(([name, data]) => {
      const status = data.isActive ? '✅ ATIVO' : '❌ INATIVO'
      console.log(`   - ${name}: ${data.tests.length} teste(s) [${status}]`)
      data.tests.forEach(test => {
        console.log(`     • ${test.test_date} - ${test.cooper_test_distance}m (ID: ${test.id})`)
      })
    })
    console.log('')

    // 4. Testar função getCooperTestsByStudent para cada avaliando ativo
    console.log('4️⃣ Testando função getCooperTestsByStudent:')
    for (const evaluatee of activeEvaluatees) {
      console.log(`🔍 Testando para ${evaluatee.name}:`)
      
      try {
        const cooperTests = await getCooperTestsByStudent(evaluatee.user_id, evaluatee.id)
        
        if (cooperTests.length > 0) {
          console.log(`   ✅ Encontrados ${cooperTests.length} teste(s) de Cooper`)
          cooperTests.forEach(test => {
            console.log(`      - ${test.test_date}: ${test.cooper_test_distance}m`)
          })
        } else {
          console.log(`   ⚠️  Nenhum teste de Cooper encontrado`)
        }
      } catch (error) {
        console.error(`   ❌ Erro ao buscar testes para ${evaluatee.name}:`, error.message)
      }
      console.log('')
    }

    // 5. Verificar se há testes órfãos
    console.log('5️⃣ Verificando testes órfãos:')
    const orphanTests = allCooperTests.filter(test => !test.evaluatees || !test.evaluatees.active)
    
    if (orphanTests.length > 0) {
      console.log(`⚠️  Encontrados ${orphanTests.length} teste(s) órfão(s) ou de avaliandos inativos:`)
      orphanTests.forEach(test => {
        const evaluateeName = test.evaluatees?.name || 'Avaliando não encontrado'
        const status = test.evaluatees?.active ? 'ATIVO' : 'INATIVO/INEXISTENTE'
        console.log(`   - ${evaluateeName} [${status}]: ${test.test_date} - ${test.cooper_test_distance}m`)
      })
    } else {
      console.log('✅ Nenhum teste órfão encontrado')
    }
    console.log('')

    // 6. Resumo final
    console.log('6️⃣ Resumo final:')
    console.log(`   📊 Avaliandos ativos: ${activeEvaluatees.length}`)
    console.log(`   📊 Testes de Cooper totais: ${allCooperTests.length}`)
    console.log(`   📊 Testes órfãos: ${orphanTests.length}`)
    console.log(`   📊 Duplicados de Moisés: ${moisesEvaluatees.length > 1 ? 'SIM ⚠️' : 'NÃO ✅'}`)
    
    if (moisesEvaluatees.length === 1 && orphanTests.length === 0) {
      console.log('\n🎉 SUCESSO! A correção foi bem-sucedida:')
      console.log('   ✅ Apenas 1 avaliando Moisés ativo')
      console.log('   ✅ Nenhum teste órfão')
      console.log('   ✅ Todos os testes estão associados corretamente')
    } else {
      console.log('\n⚠️  ATENÇÃO: Ainda há problemas que precisam ser corrigidos')
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error)
  }
}

verifyFinalState().catch(console.error)