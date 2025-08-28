// Script para corrigir testes órfãos (sem user_id)
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

async function fixOrphanTests() {
  console.log('🔧 Iniciando correção de testes órfãos...')
  
  try {
    // 1. Buscar todos os testes com user_id null
    console.log('\n1️⃣ Buscando testes órfãos (user_id null):')
    const { data: orphanTests, error: orphanError } = await supabase
      .from('performance_tests')
      .select('*')
      .is('user_id', null)
    
    if (orphanError) {
      console.error('❌ Erro ao buscar testes órfãos:', orphanError)
      return
    }
    
    console.log(`✅ Encontrados ${orphanTests?.length || 0} testes órfãos`)
    
    if (!orphanTests || orphanTests.length === 0) {
      console.log('✅ Nenhum teste órfão encontrado!')
      return
    }
    
    // 2. Agrupar por evaluatee_id para identificar o user_id correto
    const testsByEvaluatee = {}
    orphanTests.forEach(test => {
      if (!testsByEvaluatee[test.evaluatee_id]) {
        testsByEvaluatee[test.evaluatee_id] = []
      }
      testsByEvaluatee[test.evaluatee_id].push(test)
    })
    
    console.log('\n2️⃣ Testes órfãos agrupados por avaliando:')
    for (const [evaluateeId, tests] of Object.entries(testsByEvaluatee)) {
      console.log(`   Avaliando ${evaluateeId}: ${tests.length} teste(s) órfão(s)`)
    }
    
    // 3. Para cada avaliando, buscar um teste válido para obter o user_id correto
    console.log('\n3️⃣ Identificando user_id correto para cada avaliando:')
    
    for (const [evaluateeId, orphanTestsForEvaluatee] of Object.entries(testsByEvaluatee)) {
      // Buscar um teste válido (com user_id) para este avaliando
      const { data: validTest, error: validError } = await supabase
        .from('performance_tests')
        .select('user_id')
        .eq('evaluatee_id', evaluateeId)
        .not('user_id', 'is', null)
        .limit(1)
        .single()
      
      if (validError || !validTest) {
        console.log(`   ⚠️  Avaliando ${evaluateeId}: Nenhum teste válido encontrado para determinar user_id`)
        
        // Tentar buscar o user_id através da tabela evaluatees
        const { data: evaluatee, error: evaluateeError } = await supabase
          .from('evaluatees')
          .select('user_id')
          .eq('id', evaluateeId)
          .single()
        
        if (evaluateeError || !evaluatee || !evaluatee.user_id) {
          console.log(`   ❌ Avaliando ${evaluateeId}: Não foi possível determinar user_id`)
          continue
        }
        
        const correctUserId = evaluatee.user_id
        console.log(`   ✅ Avaliando ${evaluateeId}: user_id encontrado na tabela evaluatees: ${correctUserId}`)
        
        // Atualizar todos os testes órfãos deste avaliando
        const testIds = orphanTestsForEvaluatee.map(test => test.id)
        const { error: updateError } = await supabase
          .from('performance_tests')
          .update({ user_id: correctUserId })
          .in('id', testIds)
        
        if (updateError) {
          console.error(`   ❌ Erro ao atualizar testes do avaliando ${evaluateeId}:`, updateError)
        } else {
          console.log(`   ✅ Atualizados ${testIds.length} teste(s) do avaliando ${evaluateeId} com user_id: ${correctUserId}`)
        }
        
      } else {
        const correctUserId = validTest.user_id
        console.log(`   ✅ Avaliando ${evaluateeId}: user_id correto: ${correctUserId}`)
        
        // Atualizar todos os testes órfãos deste avaliando
        const testIds = orphanTestsForEvaluatee.map(test => test.id)
        const { error: updateError } = await supabase
          .from('performance_tests')
          .update({ user_id: correctUserId })
          .in('id', testIds)
        
        if (updateError) {
          console.error(`   ❌ Erro ao atualizar testes do avaliando ${evaluateeId}:`, updateError)
        } else {
          console.log(`   ✅ Atualizados ${testIds.length} teste(s) do avaliando ${evaluateeId} com user_id: ${correctUserId}`)
        }
      }
    }
    
    console.log('\n4️⃣ Verificando se ainda há testes órfãos:')
    const { data: remainingOrphans, error: remainingError } = await supabase
      .from('performance_tests')
      .select('id')
      .is('user_id', null)
    
    if (remainingError) {
      console.error('❌ Erro ao verificar testes órfãos restantes:', remainingError)
    } else {
      console.log(`✅ Testes órfãos restantes: ${remainingOrphans?.length || 0}`)
    }
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error)
  }
}

fixOrphanTests()
  .then(() => {
    console.log('\n🏁 Correção de testes órfãos concluída!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })