// Script para verificar políticas RLS da tabela performance_tests
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

async function checkRLSPolicies() {
  console.log('🔍 Verificando políticas RLS da tabela performance_tests...')
  
  try {
    // Verificar políticas RLS
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'performance_tests' })
    
    if (policiesError) {
      console.log('⚠️ Não foi possível buscar políticas via RPC, tentando query direta...')
      
      // Tentar query SQL direta
      const { data: policiesSQL, error: policiesSQLError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'performance_tests')
      
      if (policiesSQLError) {
        console.error('❌ Erro ao buscar políticas SQL:', policiesSQLError)
      } else {
        console.log('✅ Políticas encontradas via SQL:', policiesSQL)
      }
    } else {
      console.log('✅ Políticas RLS encontradas:', policies)
    }
    
    // Verificar se RLS está habilitado
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'performance_tests')
      .eq('table_schema', 'public')
    
    if (tableError) {
      console.error('❌ Erro ao buscar informações da tabela:', tableError)
    } else {
      console.log('✅ Informações da tabela:', tableInfo)
    }
    
    // Testar exclusão com diferentes cenários
    console.log('\n🧪 Testando exclusão com diferentes cenários...')
    
    // 1. Buscar um teste para tentar excluir
    const { data: tests, error: testsError } = await supabase
      .from('performance_tests')
      .select('id, user_id, evaluatee_id')
      .limit(1)
    
    if (testsError) {
      console.error('❌ Erro ao buscar testes:', testsError)
      return
    }
    
    if (!tests || tests.length === 0) {
      console.log('📭 Nenhum teste encontrado para testar exclusão')
      return
    }
    
    const testToDelete = tests[0]
    console.log(`🎯 Teste selecionado para teste de exclusão: ${testToDelete.id}`)
    console.log(`   User ID: ${testToDelete.user_id}`)
    console.log(`   Evaluatee ID: ${testToDelete.evaluatee_id}`)
    
    // 2. Tentar exclusão sem autenticação (cliente anônimo)
    console.log('\n1️⃣ Testando exclusão sem autenticação...')
    const { error: deleteError1 } = await supabase
      .from('performance_tests')
      .delete()
      .eq('id', testToDelete.id)
    
    if (deleteError1) {
      console.log('❌ Exclusão falhou (esperado):', deleteError1.message)
    } else {
      console.log('⚠️ Exclusão funcionou sem autenticação (inesperado!)')
    }
    
    // 3. Verificar se há usuário autenticado
    console.log('\n2️⃣ Verificando usuário autenticado...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('❌ Erro ao verificar usuário:', userError.message)
    } else if (!user) {
      console.log('👤 Nenhum usuário autenticado (cliente anônimo)')
    } else {
      console.log('✅ Usuário autenticado:', user.id)
      
      // 4. Tentar exclusão com usuário autenticado
      console.log('\n3️⃣ Testando exclusão com usuário autenticado...')
      const { error: deleteError2 } = await supabase
        .from('performance_tests')
        .delete()
        .eq('id', testToDelete.id)
        .eq('user_id', user.id)
      
      if (deleteError2) {
        console.log('❌ Exclusão falhou com usuário autenticado:', deleteError2.message)
      } else {
        console.log('✅ Exclusão funcionou com usuário autenticado')
      }
    }
    
    // 5. Verificar permissões da tabela
    console.log('\n4️⃣ Verificando permissões da tabela...')
    const { data: permissions, error: permError } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_name', 'performance_tests')
      .eq('table_schema', 'public')
    
    if (permError) {
      console.error('❌ Erro ao buscar permissões:', permError)
    } else {
      console.log('✅ Permissões da tabela:', permissions)
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error)
  }
}

checkRLSPolicies()
  .then(() => {
    console.log('\n🏁 Verificação de políticas RLS concluída!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })