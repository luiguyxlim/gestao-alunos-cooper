// Script para testar exclusão direta e identificar o problema
// Execute este script no terminal para testar a exclusão

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== Teste de Exclusão Direta ===');

async function testDirectDelete() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Listar testes existentes
    console.log('\n1️⃣ Listando testes existentes...');
    const { data: tests, error: listError } = await supabase
      .from('performance_tests')
      .select('id, user_id, test_date, test_type, evaluatees(name)')
      .limit(5);
    
    if (listError) {
      console.error('❌ Erro ao listar testes:', listError);
      return;
    }
    
    console.log(`✅ Encontrados ${tests?.length || 0} testes`);
    
    if (!tests || tests.length === 0) {
      console.log('❌ Nenhum teste encontrado para testar exclusão');
      return;
    }
    
    // Mostrar os testes
    tests.forEach((test, index) => {
      console.log(`  ${index + 1}. ID: ${test.id}`);
      console.log(`     Avaliando: ${test.evaluatees?.name || 'N/A'}`);
      console.log(`     Tipo: ${test.test_type}`);
      console.log(`     Data: ${test.test_date}`);
      console.log(`     User ID: ${test.user_id}`);
      console.log('');
    });
    
    // 2. Criar um teste temporário para exclusão
    console.log('\n2️⃣ Criando teste temporário para exclusão...');
    
    // Primeiro, vamos pegar um avaliando existente
    const { data: evaluatees, error: evaluateesError } = await supabase
      .from('evaluatees')
      .select('id, user_id')
      .eq('active', true)
      .limit(1);
    
    if (evaluateesError || !evaluatees || evaluatees.length === 0) {
      console.error('❌ Erro ao buscar avaliandos ou nenhum avaliando encontrado:', evaluateesError);
      return;
    }
    
    const evaluatee = evaluatees[0];
    console.log('✅ Avaliando encontrado:', evaluatee.id);
    
    // Criar teste temporário
    const { data: newTest, error: createError } = await supabase
      .from('performance_tests')
      .insert({
        evaluatee_id: evaluatee.id,
        user_id: evaluatee.user_id,
        test_date: new Date().toISOString().split('T')[0],
        test_type: 'physical',
        notes: 'TESTE TEMPORÁRIO PARA DEBUG - PODE SER EXCLUÍDO',
        speed: 5.0
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Erro ao criar teste temporário:', createError);
      return;
    }
    
    console.log('✅ Teste temporário criado:', newTest.id);
    
    // 3. Testar exclusão direta
    console.log('\n3️⃣ Testando exclusão direta...');
    
    const { error: deleteError } = await supabase
      .from('performance_tests')
      .delete()
      .eq('id', newTest.id)
      .eq('user_id', newTest.user_id);
    
    if (deleteError) {
      console.error('❌ Erro na exclusão direta:', deleteError);
      
      // Tentar limpar o teste criado
      console.log('\n🧹 Tentando limpar teste temporário...');
      await supabase
        .from('performance_tests')
        .delete()
        .eq('id', newTest.id);
      
      return;
    }
    
    console.log('✅ Exclusão direta bem-sucedida!');
    
    // 4. Verificar se foi realmente excluído
    console.log('\n4️⃣ Verificando se o teste foi excluído...');
    
    const { data: checkTest, error: checkError } = await supabase
      .from('performance_tests')
      .select('id')
      .eq('id', newTest.id)
      .single();
    
    if (checkError && checkError.code === 'PGRST116') {
      console.log('✅ Teste foi excluído com sucesso (não encontrado)');
    } else if (checkTest) {
      console.log('❌ Teste ainda existe após exclusão!');
    } else {
      console.log('❓ Resultado inesperado:', checkError);
    }
    
    // 5. Simular o problema da Server Action
    console.log('\n5️⃣ Simulando o problema da Server Action...');
    
    // Simular FormData
    const mockFormData = {
      get: (key) => {
        if (key === 'id') return tests[0].id; // Usar um teste existente
        return null;
      }
    };
    
    console.log('FormData simulado criado');
    console.log('ID extraído:', mockFormData.get('id'));
    
    // Simular o que acontece na Server Action
    try {
      const id = mockFormData.get('id');
      
      if (!id) {
        throw new Error('ID do teste é obrigatório');
      }
      
      console.log('✅ Simulação da Server Action bem-sucedida');
      console.log('ID que seria usado para exclusão:', id);
      
    } catch (error) {
      console.error('❌ Erro na simulação da Server Action:', error);
    }
    
    // 6. Testar com objeto simples (que causaria o erro)
    console.log('\n6️⃣ Testando com objeto simples (que causaria erro)...');
    
    const wrongData = { id: tests[0].id };
    
    try {
      // Isso deveria causar o erro "formData.get is not a function"
      const id = wrongData.get('id');
      console.log('❓ Inesperado: objeto simples funcionou:', id);
    } catch (error) {
      console.log('✅ Erro esperado com objeto simples:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

console.log('\n🔍 Conclusões esperadas:');
console.log('1. Se a exclusão direta funcionar, o problema está na Server Action');
console.log('2. Se o FormData simulado funcionar, o problema está no frontend');
console.log('3. O erro "formData.get is not a function" indica que um objeto simples está sendo passado');

testDirectDelete();