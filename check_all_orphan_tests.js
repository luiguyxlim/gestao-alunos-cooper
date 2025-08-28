// Script para verificar se há outros testes órfãos no sistema
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

async function checkAllOrphanTests() {
  console.log('🔍 Verificando todos os testes órfãos no sistema...')
  
  try {
    // 1. Buscar todos os testes com user_id null
    console.log('\n1️⃣ Buscando todos os testes órfãos:')
    const { data: orphanTests, error: orphanError } = await supabase
      .from('performance_tests')
      .select(`
        id,
        test_type,
        test_date,
        evaluatee_id,
        user_id,
        cooper_test_distance,
        vo2_max
      `)
      .is('user_id', null)
      .order('test_date', { ascending: false })
    
    if (orphanError) {
      console.error('❌ Erro ao buscar testes órfãos:', orphanError)
      return
    }
    
    console.log(`✅ Encontrados ${orphanTests?.length || 0} testes órfãos`)
    
    if (!orphanTests || orphanTests.length === 0) {
      console.log('🎉 Nenhum teste órfão encontrado! Todos os testes têm user_id válido.')
      
      // Verificar se há testes com user_id inválido (que não existe na tabela auth.users)
      console.log('\n2️⃣ Verificando testes com user_id inválido...')
      const { data: allTests, error: allTestsError } = await supabase
        .from('performance_tests')
        .select('user_id')
        .not('user_id', 'is', null)
      
      if (allTestsError) {
        console.error('❌ Erro ao buscar todos os testes:', allTestsError)
        return
      }
      
      const uniqueUserIds = [...new Set(allTests.map(test => test.user_id))]
      console.log(`✅ User IDs únicos encontrados nos testes: ${uniqueUserIds.length}`)
      uniqueUserIds.forEach(userId => {
        console.log(`   - ${userId}`)
      })
      
      return
    }
    
    // 2. Agrupar por evaluatee_id
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
      
      // Buscar nome do avaliando
      const { data: evaluatee, error: evaluateeError } = await supabase
        .from('evaluatees')
        .select('name, user_id')
        .eq('id', evaluateeId)
        .single()
      
      if (evaluateeError || !evaluatee) {
        console.log(`     ❌ Avaliando não encontrado ou erro: ${evaluateeError?.message}`)
      } else {
        console.log(`     📝 Nome: ${evaluatee.name}`)
        console.log(`     👤 User ID do avaliando: ${evaluatee.user_id}`)
      }
      
      // Listar os testes órfãos
      tests.forEach((test, index) => {
        console.log(`     ${index + 1}. Teste ${test.test_type} - ${test.test_date} (ID: ${test.id})`)
      })
    }
    
    // 3. Verificar se há inconsistências entre avaliandos e seus testes
    console.log('\n3️⃣ Verificando inconsistências entre avaliandos e testes:')
    
    const { data: allEvaluatees, error: evaluateesError } = await supabase
      .from('evaluatees')
      .select('id, name, user_id, active')
      .eq('active', true)
    
    if (evaluateesError) {
      console.error('❌ Erro ao buscar avaliandos:', evaluateesError)
      return
    }
    
    for (const evaluatee of allEvaluatees) {
      // Buscar testes deste avaliando
      const { data: evaluateeTests, error: testsError } = await supabase
        .from('performance_tests')
        .select('id, user_id, test_type')
        .eq('evaluatee_id', evaluatee.id)
      
      if (testsError) {
        console.error(`❌ Erro ao buscar testes do avaliando ${evaluatee.name}:`, testsError)
        continue
      }
      
      if (!evaluateeTests || evaluateeTests.length === 0) {
        continue // Avaliando sem testes, normal
      }
      
      // Verificar se todos os testes têm o mesmo user_id do avaliando
      const testUserIds = [...new Set(evaluateeTests.map(test => test.user_id))]
      
      if (testUserIds.length > 1 || (testUserIds.length === 1 && testUserIds[0] !== evaluatee.user_id)) {
        console.log(`⚠️  Inconsistência encontrada para ${evaluatee.name}:`)
        console.log(`     Avaliando user_id: ${evaluatee.user_id}`)
        console.log(`     Testes user_ids: ${testUserIds.join(', ')}`)
        console.log(`     Total de testes: ${evaluateeTests.length}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error)
  }
}

checkAllOrphanTests()
  .then(() => {
    console.log('\n🏁 Verificação de testes órfãos concluída!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })