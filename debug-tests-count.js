import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://lwscabmoibokzsvpaogm.supabase.co'
const supabaseKey = 'sb_publishable_wh-6cMRYyEz2zTtU4FTXFQ_W4gkudGW'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugTestsCount() {
  console.log('🔍 Investigando estrutura da tabela performance_tests...\n')
  
  try {
    // 1. Verificar estrutura da tabela usando uma query SQL
    console.log('1️⃣ Verificando estrutura da tabela performance_tests:')
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'performance_tests' })
    
    if (columnsError) {
      console.log('ℹ️  Não foi possível usar RPC, tentando inserção de teste simples...')
      
      // Tentar inserir um teste com apenas as colunas básicas
      console.log('🧪 Testando inserção com colunas básicas...')
      
      const basicTestData = {
        user_id: '9f6db044-a0e9-4862-a25f-e50d0cdbb5ba',
        evaluatee_id: 'dee3a1d1-28da-4fc1-9a1a-6ff06e6fbe4f', // Moisés
        test_date: new Date().toISOString().split('T')[0],
        test_type: 'cooper_vo2',
        cooper_test_distance: 2500,
        vo2_max: 45.5
      }
      
      const { data: insertResult, error: insertError } = await supabase
        .from('performance_tests')
        .insert(basicTestData)
        .select()
      
      if (insertError) {
        console.error('❌ Erro ao inserir teste básico:', insertError)
        console.log('   Código:', insertError.code)
        console.log('   Mensagem:', insertError.message)
        
        // Tentar com ainda menos colunas
        console.log('\n🧪 Tentando com colunas mínimas...')
        const minimalTestData = {
          user_id: '9f6db044-a0e9-4862-a25f-e50d0cdbb5ba',
          evaluatee_id: 'dee3a1d1-28da-4fc1-9a1a-6ff06e6fbe4f',
          test_date: new Date().toISOString().split('T')[0],
          test_type: 'cooper_vo2'
        }
        
        const { data: minimalResult, error: minimalError } = await supabase
          .from('performance_tests')
          .insert(minimalTestData)
          .select()
        
        if (minimalError) {
          console.error('❌ Erro com colunas mínimas:', minimalError)
        } else {
          console.log('✅ Inserção com colunas mínimas funcionou!')
          console.log('   ID do teste:', minimalResult[0]?.id)
          
          // Buscar o teste inserido
          const { data: fetchedTest, error: fetchError } = await supabase
            .from('performance_tests')
            .select('*')
            .eq('id', minimalResult[0].id)
            .single()
          
          if (fetchError) {
            console.error('❌ Erro ao buscar teste:', fetchError)
          } else {
            console.log('✅ Teste encontrado:')
            console.log('   Estrutura do registro:', Object.keys(fetchedTest))
            console.log('   Dados:', fetchedTest)
          }
          
          // Limpar o teste
          await supabase
            .from('performance_tests')
            .delete()
            .eq('id', minimalResult[0].id)
          
          console.log('🧹 Teste de debug removido')
        }
      } else {
        console.log('✅ Inserção básica funcionou!')
        console.log('   ID do teste:', insertResult[0]?.id)
        
        // Limpar o teste
        await supabase
          .from('performance_tests')
          .delete()
          .eq('id', insertResult[0].id)
        
        console.log('🧹 Teste de debug removido')
      }
    } else {
      console.log('✅ Colunas da tabela:', columns)
    }
    
    // 2. Verificar se há dados existentes
    console.log('\n2️⃣ Verificando dados existentes:')
    const { data: existingTests, error: existingError } = await supabase
      .from('performance_tests')
      .select('*')
      .limit(5)
    
    if (existingError) {
      console.error('❌ Erro ao buscar dados existentes:', existingError)
    } else {
      console.log(`✅ Testes existentes: ${existingTests?.length || 0}`)
      if (existingTests && existingTests.length > 0) {
        console.log('📋 Estrutura dos dados existentes:')
        console.log('   Colunas:', Object.keys(existingTests[0]))
        existingTests.forEach((test, index) => {
          console.log(`   ${index + 1}. ID: ${test.id} | Tipo: ${test.test_type} | Data: ${test.test_date}`)
        })
      }
    }
    
    // 3. Verificar avaliandos
    console.log('\n3️⃣ Verificando avaliandos:')
    const { data: evaluatees, error: evaluateesError } = await supabase
      .from('evaluatees')
      .select('id, name, user_id, active')
      .eq('active', true)
    
    if (evaluateesError) {
      console.error('❌ Erro ao buscar avaliandos:', evaluateesError)
    } else {
      console.log(`✅ Avaliandos ativos: ${evaluatees?.length || 0}`)
      evaluatees?.forEach((evaluatee, index) => {
        console.log(`   ${index + 1}. ${evaluatee.name} (ID: ${evaluatee.id}) - User: ${evaluatee.user_id}`)
      })
    }
    
    // 4. Testar a função getTests do código
    console.log('\n4️⃣ Simulando função getTests:')
    const userId = '9f6db044-a0e9-4862-a25f-e50d0cdbb5ba'
    
    const { data: userTests, error: userTestsError } = await supabase
      .from('performance_tests')
      .select(`
        *,
        evaluatees!inner(
          id,
          name,
          active
        )
      `)
      .eq('user_id', userId)
      .eq('evaluatees.active', true)
      .order('test_date', { ascending: false })
    
    if (userTestsError) {
      console.error('❌ Erro na simulação getTests:', userTestsError)
    } else {
      console.log(`✅ Testes do usuário: ${userTests?.length || 0}`)
      if (userTests && userTests.length > 0) {
        userTests.forEach((test, index) => {
          console.log(`   ${index + 1}. ${test.evaluatees.name} - ${test.test_type} (${test.test_date})`)
        })
      }
    }
    
    // 5. Conclusão
    console.log('\n5️⃣ Conclusão:')
    if ((existingTests?.length || 0) === 0) {
      console.log('🔍 DIAGNÓSTICO: A tabela performance_tests está vazia')
      console.log('\n💡 Próximos passos:')
      console.log('   1. A tabela existe e funciona para inserção')
      console.log('   2. Precisamos criar alguns testes de exemplo')
      console.log('   3. Verificar se o formulário de criação está funcionando')
      console.log('   4. Confirmar se os dados estão sendo salvos corretamente')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugTestsCount()