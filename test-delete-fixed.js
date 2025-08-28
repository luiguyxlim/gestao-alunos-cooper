// Teste da função deleteTest corrigida
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDeleteFunction() {
  console.log('🧪 Testando função deleteTest corrigida...')
  
  try {
    // Primeiro, vamos listar os testes existentes
    console.log('\n📋 Listando testes existentes...')
    const { data: tests, error: listError } = await supabase
      .from('performance_tests')
      .select('id, test_type, test_date, evaluatee_id')
      .limit(5)
    
    if (listError) {
      console.error('❌ Erro ao listar testes:', listError)
      return
    }
    
    if (!tests || tests.length === 0) {
      console.log('ℹ️ Nenhum teste encontrado para exclusão')
      return
    }
    
    console.log('✅ Testes encontrados:')
    tests.forEach((test, index) => {
      console.log(`  ${index + 1}. ID: ${test.id} | Tipo: ${test.test_type} | Data: ${test.test_date}`)
    })
    
    // Simular diferentes tipos de entrada para a função deleteTest
    const testId = tests[0].id
    
    console.log('\n🔧 Simulando diferentes tipos de entrada:')
    
    // Teste 1: FormData (como deveria ser)
    console.log('\n1️⃣ Testando com FormData:')
    const formData = new FormData()
    formData.append('id', testId)
    
    console.log('  - FormData criado:', {
      hasGetMethod: typeof formData.get === 'function',
      id: formData.get('id')
    })
    
    // Teste 2: Objeto simples (como pode estar chegando)
    console.log('\n2️⃣ Testando com objeto simples:')
    const objectData = { id: testId }
    
    console.log('  - Objeto criado:', {
      hasGetMethod: typeof objectData.get === 'function',
      id: objectData.id,
      type: typeof objectData
    })
    
    // Teste 3: Verificar instanceof
    console.log('\n3️⃣ Verificando instanceof:')
    console.log('  - formData instanceof FormData:', formData instanceof FormData)
    console.log('  - objectData instanceof FormData:', objectData instanceof FormData)
    
    // Simular a lógica da função corrigida
    console.log('\n🔄 Simulando lógica da função corrigida:')
    
    function simulateDeleteTest(input) {
      let id
      if (input instanceof FormData) {
        id = input.get('id')
        console.log('  ✅ Detectado como FormData, ID extraído:', id)
      } else if (typeof input === 'object' && input.id) {
        id = input.id
        console.log('  ✅ Detectado como objeto, ID extraído:', id)
      } else {
        console.log('  ❌ Tipo inválido:', typeof input)
        return false
      }
      return !!id
    }
    
    console.log('\n  Testando FormData:')
    const formDataResult = simulateDeleteTest(formData)
    console.log('  Resultado:', formDataResult ? '✅ Sucesso' : '❌ Falha')
    
    console.log('\n  Testando objeto:')
    const objectResult = simulateDeleteTest(objectData)
    console.log('  Resultado:', objectResult ? '✅ Sucesso' : '❌ Falha')
    
    console.log('\n🎉 Teste concluído! A função corrigida deve aceitar ambos os tipos.')
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

testDeleteFunction()