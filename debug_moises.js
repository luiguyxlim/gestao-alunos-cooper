// Script para debugar o problema do Moisés Santa Rosa
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugMoisesIssue() {
  console.log('🔍 Iniciando diagnóstico do problema do Moisés Santa Rosa...\n')
  
  try {
    // 1. Buscar todos os avaliandos ativos
    console.log('1️⃣ Buscando todos os avaliandos ativos:')
    const { data: evaluatees, error: evaluateesError } = await supabase
      .from('evaluatees')
      .select('id, name, email, active, created_at')
      .eq('active', true)
      .order('name')
    
    if (evaluateesError) {
      console.error('❌ Erro ao buscar avaliandos:', evaluateesError)
    } else {
      console.log(`✅ Encontrados ${evaluatees.length} avaliandos ativos:`)
      evaluatees.forEach(e => {
        console.log(`   - ${e.name} (ID: ${e.id})`)
      })
    }
    
    // 2. Buscar especificamente por Moisés
    console.log('\n2️⃣ Buscando especificamente por Moisés Santa Rosa:')
    const { data: moises, error: moisesError } = await supabase
      .from('evaluatees')
      .select('id, name, email, active')
      .or('name.ilike.%mois%, name.ilike.%santa%, name.ilike.%rosa%')
    
    if (moisesError) {
      console.error('❌ Erro ao buscar Moisés:', moisesError)
    } else {
      console.log(`✅ Encontrados ${moises.length} registros para Moisés:`)
      moises.forEach(m => {
        console.log(`   - ${m.name} (ID: ${m.id}, Ativo: ${m.active})`)
      })
    }
    
    // 3. Buscar todos os testes de Cooper
    console.log('\n3️⃣ Buscando todos os testes de Cooper:')
    const { data: cooperTests, error: cooperError } = await supabase
      .from('performance_tests')
      .select(`
        id,
        test_date,
        cooper_test_distance,
        vo2_max,
        evaluatee_id,
        created_at,
        evaluatees!performance_tests_evaluatee_id_fkey (
          name,
          email
        )
      `)
      .eq('test_type', 'cooper_vo2')
      .order('created_at', { ascending: false })
    
    if (cooperError) {
      console.error('❌ Erro ao buscar testes de Cooper:', cooperError)
    } else {
      console.log(`✅ Encontrados ${cooperTests.length} testes de Cooper:`)
      cooperTests.forEach(test => {
        const evaluateeName = test.evaluatees?.name || 'Nome não encontrado'
        console.log(`   - ${evaluateeName} (ID: ${test.evaluatee_id}) - Distância: ${test.cooper_test_distance}m - Data: ${test.test_date}`)
      })
    }
    
    // 4. Verificar se há testes órfãos (sem avaliando)
    console.log('\n4️⃣ Verificando testes órfãos (sem avaliando):')
    const orphanTests = cooperTests?.filter(test => !test.evaluatees) || []
    if (orphanTests.length > 0) {
      console.log(`⚠️  Encontrados ${orphanTests.length} testes órfãos:`)
      orphanTests.forEach(test => {
        console.log(`   - Teste ID: ${test.id}, Evaluatee ID: ${test.evaluatee_id}, Distância: ${test.cooper_test_distance}m`)
      })
    } else {
      console.log('✅ Nenhum teste órfão encontrado')
    }
    
    // 5. Verificar se Moisés tem testes de Cooper
    if (moises && moises.length > 0) {
      console.log('\n5️⃣ Verificando testes de Cooper do Moisés:')
      const moisesId = moises[0].id
      const moisesTests = cooperTests?.filter(test => test.evaluatee_id === moisesId) || []
      
      if (moisesTests.length > 0) {
        console.log(`✅ Moisés tem ${moisesTests.length} teste(s) de Cooper:`)
        moisesTests.forEach(test => {
          console.log(`   - Distância: ${test.cooper_test_distance}m, VO2 Max: ${test.vo2_max}, Data: ${test.test_date}`)
        })
      } else {
        console.log('❌ Moisés NÃO tem testes de Cooper registrados')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugMoisesIssue()
  .then(() => {
    console.log('\n🏁 Diagnóstico concluído!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })