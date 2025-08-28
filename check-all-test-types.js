// Script para verificar todos os tipos de teste com user_id incompatível
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllTestTypes() {
  console.log('🔍 Verificando todos os tipos de teste com user_id incompatível\n')
  
  try {
    // Buscar todos os testes com informações do avaliando
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
      console.error('❌ Erro ao buscar testes:', allTestsError)
      return
    }

    // Agrupar por tipo de teste e contar incompatibilidades
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
    let hasIncompatibleTests = false
    
    Object.entries(testTypeStats).forEach(([testType, stats]) => {
      const status = stats.incompatible > 0 ? '⚠️' : '✅'
      console.log(`   ${status} ${testType}: ${stats.incompatible}/${stats.total} incompatíveis`)
      
      if (stats.incompatible > 0) {
        hasIncompatibleTests = true
      }
    })

    if (!hasIncompatibleTests) {
      console.log('\n✅ Excelente! Todos os tipos de teste têm user_id compatível.')
    } else {
      console.log('\n⚠️  Há tipos de teste com user_id incompatível que precisam ser corrigidos.')
      
      // Mostrar detalhes dos testes incompatíveis
      console.log('\n🔍 Detalhes dos testes incompatíveis:')
      
      for (const [testType, stats] of Object.entries(testTypeStats)) {
        if (stats.incompatible > 0) {
          console.log(`\n📋 Tipo: ${testType}`)
          
          const { data: incompatibleTests, error: incompatibleError } = await supabase
            .from('performance_tests')
            .select(`
              id,
              user_id,
              evaluatee_id,
              test_date,
              evaluatees!performance_tests_evaluatee_id_fkey (
                user_id,
                name
              )
            `)
            .eq('test_type', testType)
          
          if (incompatibleError) {
            console.error(`❌ Erro ao buscar testes ${testType}:`, incompatibleError)
            continue
          }
          
          const incompatible = incompatibleTests.filter(test => 
            test.user_id !== test.evaluatees?.user_id
          )
          
          incompatible.forEach(test => {
            console.log(`   - Teste ID: ${test.id}`)
            console.log(`     Avaliando: ${test.evaluatees?.name || 'N/A'}`)
            console.log(`     Teste user_id: ${test.user_id}`)
            console.log(`     Avaliando user_id: ${test.evaluatees?.user_id || 'N/A'}`)
            console.log(`     Data: ${test.test_date}`)
            console.log('')
          })
        }
      }
    }

    console.log('\n🎉 Verificação concluída!')
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error)
  }
}

checkAllTestTypes().catch(console.error)