import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://lwscabmoibokzsvpaogm.supabase.co'
const supabaseKey = 'sb_publishable_wh-6cMRYyEz2zTtU4FTXFQ_W4gkudGW'
const supabase = createClient(supabaseUrl, supabaseKey)

async function createSampleTests() {
  console.log('🏃‍♂️ Criando testes de exemplo para demonstração...\n')
  
  try {
    // IDs dos avaliandos encontrados
    const evaluatees = [
      {
        id: 'dee3a1d1-28da-4fc1-9a1a-6ff06e6fbe4f',
        name: 'Moisés Santa Rosa',
        user_id: '9f6db044-a0e9-4862-a25f-e50d0cdbb5ba'
      },
      {
        id: 'fa8493b0-f8e7-4404-9e9f-f380feda0bd7',
        name: 'Luiguy Xavier Lima',
        user_id: '9f6db044-a0e9-4862-a25f-e50d0cdbb5ba'
      }
    ]
    
    // Criar testes de exemplo para cada avaliando
    const sampleTests = []
    
    // Testes para Moisés Santa Rosa
    sampleTests.push(
      {
        user_id: evaluatees[0].user_id,
        evaluatee_id: evaluatees[0].id,
        test_date: '2025-01-20',
        test_type: 'cooper_vo2',
        cooper_test_distance: 2800,
        vo2_max: 48.2,
        notes: 'Excelente performance no teste de Cooper. Atleta demonstrou boa resistência cardiovascular.'
      },
      {
        user_id: evaluatees[0].user_id,
        evaluatee_id: evaluatees[0].id,
        test_date: '2025-01-15',
        test_type: 'strength',
        bench_press_1rm: 85.0,
        squat_1rm: 120.0,
        deadlift_1rm: 140.0,
        notes: 'Avaliação de força máxima. Bons resultados em todos os exercícios.'
      },
      {
        user_id: evaluatees[0].user_id,
        evaluatee_id: evaluatees[0].id,
        test_date: '2025-01-10',
        test_type: 'flexibility',
        sit_and_reach: 28.5,
        shoulder_flexibility: 'Boa',
        notes: 'Flexibilidade dentro da média esperada para a idade.'
      }
    )
    
    // Testes para Luiguy Xavier Lima
    sampleTests.push(
      {
        user_id: evaluatees[1].user_id,
        evaluatee_id: evaluatees[1].id,
        test_date: '2025-01-22',
        test_type: 'cooper_vo2',
        cooper_test_distance: 3200,
        vo2_max: 52.8,
        notes: 'Performance excepcional no teste de Cooper. Excelente condicionamento aeróbico.'
      },
      {
        user_id: evaluatees[1].user_id,
        evaluatee_id: evaluatees[1].id,
        test_date: '2025-01-18',
        test_type: 'strength',
        bench_press_1rm: 95.0,
        squat_1rm: 150.0,
        deadlift_1rm: 180.0,
        notes: 'Força superior à média. Técnica de execução excelente.'
      },
      {
        user_id: evaluatees[1].user_id,
        evaluatee_id: evaluatees[1].id,
        test_date: '2025-01-12',
        test_type: 'body_composition',
        weight: 78.5,
        height: 182.0,
        body_fat_percentage: 12.8,
        muscle_mass: 68.4,
        notes: 'Composição corporal excelente. Baixo percentual de gordura e boa massa muscular.'
      }
    )
    
    console.log(`📝 Inserindo ${sampleTests.length} testes de exemplo...\n`)
    
    // Inserir todos os testes
    for (let i = 0; i < sampleTests.length; i++) {
      const test = sampleTests[i]
      const evaluateeName = evaluatees.find(e => e.id === test.evaluatee_id)?.name
      
      console.log(`${i + 1}. Criando teste ${test.test_type} para ${evaluateeName}...`)
      
      const { data, error } = await supabase
        .from('performance_tests')
        .insert(test)
        .select()
      
      if (error) {
        console.error(`   ❌ Erro ao criar teste:`, error.message)
      } else {
        console.log(`   ✅ Teste criado com sucesso! ID: ${data[0].id}`)
      }
    }
    
    // Verificar quantos testes foram criados
    console.log('\n🔍 Verificando testes criados:')
    const { data: allTests, error: fetchError } = await supabase
      .from('performance_tests')
      .select(`
        *,
        evaluatees!inner(
          id,
          name,
          active
        )
      `)
      .eq('user_id', evaluatees[0].user_id)
      .eq('evaluatees.active', true)
      .order('test_date', { ascending: false })
    
    if (fetchError) {
      console.error('❌ Erro ao buscar testes:', fetchError)
    } else {
      console.log(`✅ Total de testes criados: ${allTests?.length || 0}\n`)
      
      if (allTests && allTests.length > 0) {
        console.log('📋 Resumo dos testes:')
        allTests.forEach((test, index) => {
          console.log(`   ${index + 1}. ${test.evaluatees.name} - ${test.test_type} (${test.test_date})`)
        })
        
        console.log('\n🎉 Sucesso! Agora você deve ver os testes na aplicação.')
        console.log('\n💡 Para testar:')
        console.log('   1. Acesse http://localhost:3000')
        console.log('   2. Faça login com sua conta')
        console.log('   3. Vá para a página de Testes')
        console.log('   4. Você deve ver os testes criados listados')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

createSampleTests()