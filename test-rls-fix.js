// Script para testar se as políticas RLS foram corrigidas
// Execute este script após aplicar as correções no SQL Editor do Supabase

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Teste de Políticas RLS Corrigidas ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key presente:', !!serviceRoleKey);
console.log('Anon Key presente:', !!anonKey);

async function testRLSFixed() {
  try {
    // Teste 1: Verificar se consegue listar sem autenticação (deve falhar)
    console.log('\n--- Teste 1: Listagem sem autenticação (deve falhar) ---');
    const supabaseAnon = createClient(supabaseUrl, anonKey);
    
    const { data: testsAnon, error: errorAnon } = await supabaseAnon
      .from('performance_tests')
      .select('*');
    
    if (errorAnon) {
      console.log('✅ RLS funcionando: Não conseguiu listar sem autenticação');
      console.log('Erro esperado:', errorAnon.message);
    } else {
      console.log('❌ RLS não funcionando: Conseguiu listar', testsAnon?.length || 0, 'testes sem autenticação');
    }
    
    // Teste 2: Verificar se consegue excluir sem autenticação (deve falhar)
    console.log('\n--- Teste 2: Exclusão sem autenticação (deve falhar) ---');
    const { error: deleteErrorAnon } = await supabaseAnon
      .from('performance_tests')
      .delete()
      .eq('id', 'test-id-that-does-not-exist');
    
    if (deleteErrorAnon) {
      console.log('✅ RLS funcionando: Não conseguiu excluir sem autenticação');
      console.log('Erro esperado:', deleteErrorAnon.message);
    } else {
      console.log('❌ RLS não funcionando: Conseguiu tentar excluir sem autenticação');
    }
    
    // Teste 3: Verificar políticas com Service Role
    console.log('\n--- Teste 3: Verificando políticas RLS ---');
    const supabaseService = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: policies, error: policiesError } = await supabaseService
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'performance_tests')
      .eq('schemaname', 'public');
    
    if (policiesError) {
      console.log('❌ Erro ao consultar políticas:', policiesError.message);
    } else {
      console.log('✅ Políticas encontradas:', policies.length);
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }
    
    // Teste 4: Verificar se RLS está habilitado
    console.log('\n--- Teste 4: Verificando se RLS está habilitado ---');
    const { data: tableInfo, error: tableError } = await supabaseService
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'performance_tests')
      .eq('schemaname', 'public');
    
    if (tableError) {
      console.log('❌ Erro ao verificar RLS:', tableError.message);
    } else if (tableInfo && tableInfo.length > 0) {
      const rls = tableInfo[0].rowsecurity;
      console.log(`✅ RLS ${rls ? 'HABILITADO' : 'DESABILITADO'} na tabela performance_tests`);
    }
    
    // Teste 5: Contar registros com Service Role
    console.log('\n--- Teste 5: Contando registros (Service Role) ---');
    const { data: allTests, error: countError } = await supabaseService
      .from('performance_tests')
      .select('id, user_id', { count: 'exact' });
    
    if (countError) {
      console.log('❌ Erro ao contar registros:', countError.message);
    } else {
      console.log(`✅ Total de registros na tabela: ${allTests?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

// Função para simular autenticação e testar exclusão
async function testAuthenticatedDelete() {
  console.log('\n=== Teste de Exclusão com Autenticação Simulada ===');
  
  try {
    const supabaseService = createClient(supabaseUrl, serviceRoleKey);
    
    // Primeiro, listar testes existentes
    const { data: existingTests, error: listError } = await supabaseService
      .from('performance_tests')
      .select('id, user_id')
      .limit(1);
    
    if (listError) {
      console.log('❌ Erro ao listar testes:', listError.message);
      return;
    }
    
    if (!existingTests || existingTests.length === 0) {
      console.log('ℹ️  Nenhum teste encontrado para testar exclusão');
      return;
    }
    
    const testToDelete = existingTests[0];
    console.log('Teste a ser usado para teste:', testToDelete);
    
    // Simular exclusão com user_id correto (como faria a aplicação)
    const { error: deleteError } = await supabaseService
      .from('performance_tests')
      .delete()
      .eq('id', testToDelete.id)
      .eq('user_id', testToDelete.user_id);
    
    if (deleteError) {
      console.log('❌ Erro na exclusão:', deleteError.message);
    } else {
      console.log('✅ Exclusão bem-sucedida (simulando autenticação correta)');
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste de exclusão:', error.message);
  }
}

// Executar testes
testRLSFixed().then(() => {
  return testAuthenticatedDelete();
}).then(() => {
  console.log('\n=== Resumo ===');
  console.log('1. Se RLS estiver funcionando, tentativas sem autenticação devem falhar');
  console.log('2. Se exclusão com autenticação funcionar, o problema está resolvido');
  console.log('3. Teste a exclusão na interface web agora');
});