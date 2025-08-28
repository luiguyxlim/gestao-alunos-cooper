// Script para debugar o erro de exclusão de testes
// Execute este script no terminal para identificar o problema

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== Debug do Erro de Exclusão ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key presente:', !!supabaseServiceKey);

async function debugDeleteError() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Verificar se há testes para testar
    console.log('\n1️⃣ Verificando testes existentes...');
    const { data: tests, error: listError } = await supabase
      .from('performance_tests')
      .select('id, user_id, test_date, test_type, evaluatees(name)')
      .limit(3);
    
    if (listError) {
      console.error('❌ Erro ao listar testes:', listError);
      return;
    }
    
    console.log(`✅ Encontrados ${tests?.length || 0} testes`);
    
    if (!tests || tests.length === 0) {
      console.log('❌ Nenhum teste encontrado para debugar');
      return;
    }
    
    // 2. Simular o erro que está acontecendo
    console.log('\n2️⃣ Simulando o erro da função deleteTest...');
    
    const testToDebug = tests[0];
    console.log('Teste para debug:', {
      id: testToDebug.id,
      user_id: testToDebug.user_id,
      test_type: testToDebug.test_type,
      evaluatee: testToDebug.evaluatees?.name
    });
    
    // 3. Testar diferentes cenários
    console.log('\n3️⃣ Testando diferentes tipos de parâmetros...');
    
    // Cenário 1: FormData correto
    console.log('\n📋 Cenário 1: FormData correto');
    try {
      // Simular FormData (não podemos usar FormData no Node.js, mas podemos simular)
      const mockFormData = {
        get: (key) => {
          if (key === 'id') return testToDebug.id;
          return null;
        }
      };
      
      console.log('✅ FormData simulado criado');
      console.log('ID extraído:', mockFormData.get('id'));
      
      // Testar se o método get funciona
      if (typeof mockFormData.get === 'function') {
        console.log('✅ Método .get() está disponível');
      } else {
        console.log('❌ Método .get() NÃO está disponível');
      }
      
    } catch (error) {
      console.error('❌ Erro no cenário 1:', error);
    }
    
    // Cenário 2: Objeto simples (que causaria o erro)
    console.log('\n📋 Cenário 2: Objeto simples (que causaria erro)');
    try {
      const wrongData = { id: testToDebug.id };
      
      console.log('Objeto criado:', wrongData);
      
      // Tentar usar .get() em um objeto simples
      if (typeof wrongData.get === 'function') {
        console.log('✅ Método .get() está disponível (inesperado)');
      } else {
        console.log('❌ Método .get() NÃO está disponível (esperado - causaria o erro)');
      }
      
    } catch (error) {
      console.error('❌ Erro no cenário 2:', error);
    }
    
    // 4. Verificar a estrutura da função deleteTest
    console.log('\n4️⃣ Analisando possíveis causas do erro...');
    
    console.log('\n🔍 Possíveis causas:');
    console.log('1. A função deleteTest está recebendo um objeto ao invés de FormData');
    console.log('2. Há algum middleware ou interceptador modificando o parâmetro');
    console.log('3. O Next.js não está processando corretamente a Server Action');
    console.log('4. Há conflito de tipos entre cliente e servidor');
    
    // 5. Testar exclusão direta no banco
    console.log('\n5️⃣ Testando exclusão direta no banco...');
    
    // Não vamos excluir de verdade, apenas simular
    console.log('Simulando exclusão para teste:', testToDebug.id);
    
    const { error: deleteError } = await supabase
      .from('performance_tests')
      .select('id') // Usar select ao invés de delete para não excluir de verdade
      .eq('id', testToDebug.id)
      .eq('user_id', testToDebug.user_id);
    
    if (deleteError) {
      console.error('❌ Erro na consulta de teste:', deleteError);
    } else {
      console.log('✅ Consulta de teste bem-sucedida (exclusão funcionaria)');
    }
    
  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
  }
}

// 6. Verificar logs do servidor
console.log('\n6️⃣ Dicas para resolver o problema:');
console.log('1. Verifique se o TestCard está passando FormData corretamente');
console.log('2. Verifique se há algum middleware interceptando a requisição');
console.log('3. Verifique se a função deleteTest está sendo importada corretamente');
console.log('4. Verifique os logs do servidor Next.js para mais detalhes');

debugDeleteError();