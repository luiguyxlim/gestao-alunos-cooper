// Script para testar exclusão de testes no servidor
// Este script simula o comportamento da função deleteTest

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Teste de Exclusão no Servidor ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key presente:', !!supabaseServiceKey);
console.log('Anon Key presente:', !!supabaseAnonKey);

async function testDeleteWithServiceRole() {
  console.log('\n--- Teste com Service Role Key ---');
  
  if (!supabaseServiceKey) {
    console.log('❌ Service Role Key não encontrada');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Primeiro, listar alguns testes
    console.log('Listando testes...');
    const { data: tests, error: listError } = await supabase
      .from('performance_tests')
      .select('id, user_id, test_date, test_type')
      .limit(5);
    
    if (listError) {
      console.error('❌ Erro ao listar testes:', listError);
      return;
    }
    
    console.log(`✅ Encontrados ${tests?.length || 0} testes`);
    
    if (tests && tests.length > 0) {
      const testToDelete = tests[0];
      console.log('Teste a ser excluído:', testToDelete);
      
      // Tentar excluir sem filtro de user_id (como service role)
      console.log('\nTentando excluir com Service Role (sem filtro user_id)...');
      const { error: deleteError1 } = await supabase
        .from('performance_tests')
        .delete()
        .eq('id', testToDelete.id);
      
      if (deleteError1) {
        console.error('❌ Erro ao excluir (sem user_id):', deleteError1);
      } else {
        console.log('✅ Teste excluído com sucesso (sem user_id)');
        return;
      }
      
      // Tentar excluir com filtro de user_id
      console.log('\nTentando excluir com Service Role (com filtro user_id)...');
      const { error: deleteError2 } = await supabase
        .from('performance_tests')
        .delete()
        .eq('id', testToDelete.id)
        .eq('user_id', testToDelete.user_id);
      
      if (deleteError2) {
        console.error('❌ Erro ao excluir (com user_id):', deleteError2);
      } else {
        console.log('✅ Teste excluído com sucesso (com user_id)');
      }
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function testDeleteWithAnonKey() {
  console.log('\n--- Teste com Anon Key (simulando cliente) ---');
  
  if (!supabaseAnonKey) {
    console.log('❌ Anon Key não encontrada');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Tentar listar testes sem autenticação
    console.log('Tentando listar testes sem autenticação...');
    const { data: tests, error: listError } = await supabase
      .from('performance_tests')
      .select('id, user_id, test_date, test_type')
      .limit(5);
    
    if (listError) {
      console.log('❌ Erro esperado ao listar sem auth:', listError.message);
    } else {
      console.log(`⚠️  Conseguiu listar ${tests?.length || 0} testes sem autenticação (possível problema de RLS)`);
    }
    
    // Tentar excluir sem autenticação
    if (tests && tests.length > 0) {
      const testToDelete = tests[0];
      console.log('\nTentando excluir sem autenticação...');
      const { error: deleteError } = await supabase
        .from('performance_tests')
        .delete()
        .eq('id', testToDelete.id);
      
      if (deleteError) {
        console.log('✅ Erro esperado ao excluir sem auth:', deleteError.message);
      } else {
        console.log('⚠️  Conseguiu excluir sem autenticação (PROBLEMA DE SEGURANÇA!)');
      }
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function checkRLSPolicies() {
  console.log('\n--- Verificando Políticas RLS ---');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Verificar se RLS está habilitado
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_rls_enabled', { table_name: 'performance_tests' })
      .single();
    
    if (rlsError) {
      console.log('❌ Erro ao verificar RLS (função não existe):', rlsError.message);
    } else {
      console.log('RLS habilitado:', rlsStatus);
    }
    
    // Tentar consulta direta às políticas
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'performance_tests');
    
    if (policiesError) {
      console.log('❌ Erro ao consultar políticas:', policiesError.message);
    } else {
      console.log('Políticas encontradas:', policies?.length || 0);
      policies?.forEach(policy => {
        console.log(`- ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar políticas:', error);
  }
}

async function runTests() {
  await testDeleteWithServiceRole();
  await testDeleteWithAnonKey();
  await checkRLSPolicies();
  
  console.log('\n=== Resumo ===');
  console.log('1. Se a exclusão funcionou com Service Role, o problema pode estar na autenticação do cliente');
  console.log('2. Se conseguiu listar/excluir sem autenticação, há problema nas políticas RLS');
  console.log('3. Verifique os logs do navegador para erros de autenticação');
  console.log('4. Execute o script test-web-delete.js no console do navegador');
}

runTests().catch(console.error);