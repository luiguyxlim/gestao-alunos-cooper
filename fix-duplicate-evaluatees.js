import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://lwscabmoibokzsvpaogm.supabase.co'
const supabaseKey = 'sb_publishable_wh-6cMRYyEz2zTtU4FTXFQ_W4gkudGW'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDuplicateEvaluatees() {
  console.log('🔧 Corrigindo avaliandos duplicados do Moisés Santa Rosa\n')
  
  try {
    // 1. Identificar todos os avaliandos com nomes similares ao Moisés
    console.log('1️⃣ Identificando avaliandos duplicados:')
    const { data: allEvaluatees, error: allError } = await supabase
      .from('evaluatees')
      .select('*')
      .or('name.ilike.%mois%,name.ilike.%santa%,name.ilike.%rosa%')
      .order('created_at')

    if (allError) {
      console.error('❌ Erro ao buscar avaliandos:', allError)
      return
    }

    console.log(`✅ Encontrados ${allEvaluatees.length} avaliandos com nomes similares:`)    
    allEvaluatees.forEach((evaluatee, index) => {
      console.log(`   ${index + 1}. ${evaluatee.name}`)      
      console.log(`      ID: ${evaluatee.id}`)
      console.log(`      User ID: ${evaluatee.user_id}`)
      console.log(`      Email: ${evaluatee.email || 'N/A'}`)
      console.log(`      Ativo: ${evaluatee.active ? 'Sim' : 'Não'}`)
      console.log(`      Criado em: ${evaluatee.created_at}`)
      console.log('')
    })

    // 2. Verificar testes de cada avaliando
    console.log('2️⃣ Verificando testes de cada avaliando:')
    const evaluateesWithTests = []
    
    for (const evaluatee of allEvaluatees) {
      const { data: tests, error: testsError } = await supabase
        .from('performance_tests')
        .select('id, test_type, test_date, cooper_test_distance')
        .eq('evaluatee_id', evaluatee.id)
        .order('created_at')

      if (testsError) {
        console.error(`❌ Erro ao buscar testes para ${evaluatee.name}:`, testsError)
        continue
      }

      console.log(`   📊 ${evaluatee.name}: ${tests.length} teste(s)`)
      if (tests.length > 0) {
        evaluateesWithTests.push({ evaluatee, tests })
        tests.forEach(test => {
          console.log(`      - ${test.test_type} (${test.test_date}) ${test.cooper_test_distance ? `- ${test.cooper_test_distance}m` : ''}`)
        })
      }
      console.log('')
    }

    // 3. Identificar o avaliando principal (com mais testes ou mais antigo)
    console.log('3️⃣ Identificando avaliando principal:')
    if (evaluateesWithTests.length === 0) {
      console.log('⚠️  Nenhum avaliando tem testes. Mantendo o mais antigo ativo.')
      const mainEvaluatee = allEvaluatees[0] // O mais antigo
      console.log(`✅ Avaliando principal: ${mainEvaluatee.name} (ID: ${mainEvaluatee.id})`)
      
      // Desativar os outros
      const duplicates = allEvaluatees.slice(1)
      for (const duplicate of duplicates) {
        console.log(`🔄 Desativando: ${duplicate.name} (ID: ${duplicate.id})`)
        const { error: updateError } = await supabase
          .from('evaluatees')
          .update({ active: false })
          .eq('id', duplicate.id)

        if (updateError) {
          console.error(`❌ Erro ao desativar ${duplicate.name}:`, updateError)
        } else {
          console.log(`✅ ${duplicate.name} desativado com sucesso`)
        }
      }
    } else {
      // Encontrar o avaliando com mais testes
      const mainEvaluateeData = evaluateesWithTests.reduce((prev, current) => {
        return prev.tests.length > current.tests.length ? prev : current
      })
      
      const mainEvaluatee = mainEvaluateeData.evaluatee
      console.log(`✅ Avaliando principal: ${mainEvaluatee.name} (ID: ${mainEvaluatee.id}) - ${mainEvaluateeData.tests.length} teste(s)`)
      
      // 4. Migrar testes dos duplicados para o principal
      console.log('\n4️⃣ Migrando testes para o avaliando principal:')
      const duplicates = allEvaluatees.filter(e => e.id !== mainEvaluatee.id)
      
      for (const duplicate of duplicates) {
        console.log(`🔄 Processando: ${duplicate.name} (ID: ${duplicate.id})`)
        
        // Buscar testes do duplicado
        const { data: duplicateTests, error: duplicateTestsError } = await supabase
          .from('performance_tests')
          .select('*')
          .eq('evaluatee_id', duplicate.id)

        if (duplicateTestsError) {
          console.error(`❌ Erro ao buscar testes de ${duplicate.name}:`, duplicateTestsError)
          continue
        }

        if (duplicateTests.length > 0) {
          console.log(`   📊 Migrando ${duplicateTests.length} teste(s)...`)
          
          // Atualizar evaluatee_id dos testes para o principal
          const { error: updateTestsError } = await supabase
            .from('performance_tests')
            .update({ 
              evaluatee_id: mainEvaluatee.id,
              user_id: mainEvaluatee.user_id // Garantir que o user_id também seja correto
            })
            .eq('evaluatee_id', duplicate.id)

          if (updateTestsError) {
            console.error(`❌ Erro ao migrar testes de ${duplicate.name}:`, updateTestsError)
          } else {
            console.log(`   ✅ Testes migrados com sucesso`)
          }
        }
        
        // Desativar o duplicado
        console.log(`   🔄 Desativando ${duplicate.name}...`)
        const { error: deactivateError } = await supabase
          .from('evaluatees')
          .update({ active: false })
          .eq('id', duplicate.id)

        if (deactivateError) {
          console.error(`❌ Erro ao desativar ${duplicate.name}:`, deactivateError)
        } else {
          console.log(`   ✅ ${duplicate.name} desativado com sucesso`)
        }
        console.log('')
      }
    }

    // 5. Verificar resultado final
    console.log('5️⃣ Verificando resultado final:')
    const { data: finalEvaluatees, error: finalError } = await supabase
      .from('evaluatees')
      .select('*')
      .eq('active', true)
      .or('name.ilike.%mois%,name.ilike.%santa%,name.ilike.%rosa%')

    if (finalError) {
      console.error('❌ Erro ao verificar resultado final:', finalError)
    } else {
      console.log(`✅ Avaliandos ativos restantes: ${finalEvaluatees.length}`)
      finalEvaluatees.forEach(evaluatee => {
        console.log(`   - ${evaluatee.name} (ID: ${evaluatee.id})`)
      })
    }

    // 6. Verificar testes do avaliando principal
    if (finalEvaluatees.length === 1) {
      const mainEvaluatee = finalEvaluatees[0]
      const { data: finalTests, error: finalTestsError } = await supabase
        .from('performance_tests')
        .select('id, test_type, test_date, cooper_test_distance')
        .eq('evaluatee_id', mainEvaluatee.id)
        .order('test_date', { ascending: false })

      if (finalTestsError) {
        console.error('❌ Erro ao verificar testes finais:', finalTestsError)
      } else {
        console.log(`\n📊 Testes do avaliando principal (${mainEvaluatee.name}): ${finalTests.length}`)
        finalTests.forEach(test => {
          console.log(`   - ${test.test_type} (${test.test_date}) ${test.cooper_test_distance ? `- ${test.cooper_test_distance}m` : ''}`)
        })
      }
    }

    console.log('\n🎉 Correção de duplicados concluída!')
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error)
  }
}

fixDuplicateEvaluatees().catch(console.error)