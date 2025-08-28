import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthAndTests() {
  console.log('🔐 Testando autenticação e carregamento de testes...');
  
  try {
    // 1. Verificar se há usuário autenticado
    console.log('\n1️⃣ Verificando usuário autenticado:');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erro na autenticação:', authError);
      return;
    }
    
    if (!user) {
      console.log('❌ Nenhum usuário autenticado');
      console.log('💡 Isso explicaria por que os testes não aparecem na página');
      return;
    }
    
    console.log('✅ Usuário autenticado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    
    // 2. Testar a função getTests com o usuário autenticado
    console.log('\n2️⃣ Testando getTests com usuário autenticado:');
    const { data: tests, error: testsError } = await supabase
      .from('performance_tests')
      .select(`
        *,
        evaluatees (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .order('test_date', { ascending: false });

    if (testsError) {
      console.error('❌ Erro ao buscar testes:', testsError);
      return;
    }

    console.log(`✅ Testes encontrados para o usuário: ${tests?.length || 0}`);
    
    if (tests && tests.length > 0) {
      console.log('\n📋 Testes do usuário autenticado:');
      tests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.evaluatees?.name || 'Nome não encontrado'} - ${test.test_type} (${test.test_date})`);
      });
    } else {
      console.log('❌ Nenhum teste encontrado para este usuário');
      console.log('💡 Isso explicaria por que a página mostra "Nenhum teste encontrado"');
    }
    
    // 3. Verificar se existem testes no banco mas com user_id diferente
    console.log('\n3️⃣ Verificando todos os testes no banco:');
    const { data: allTests, error: allTestsError } = await supabase
      .from('performance_tests')
      .select('id, user_id, test_type, test_date')
      .order('test_date', { ascending: false });
      
    if (allTestsError) {
      console.error('❌ Erro ao buscar todos os testes:', allTestsError);
      return;
    }
    
    console.log(`✅ Total de testes no banco: ${allTests?.length || 0}`);
    
    if (allTests && allTests.length > 0) {
      const userTests = allTests.filter(test => test.user_id === user.id);
      const otherTests = allTests.filter(test => test.user_id !== user.id);
      
      console.log(`   - Testes do usuário atual: ${userTests.length}`);
      console.log(`   - Testes de outros usuários: ${otherTests.length}`);
      
      if (otherTests.length > 0) {
        console.log('\n📋 User IDs dos outros testes:');
        const uniqueUserIds = [...new Set(otherTests.map(test => test.user_id))];
        uniqueUserIds.forEach(userId => {
          const count = otherTests.filter(test => test.user_id === userId).length;
          console.log(`   - ${userId}: ${count} testes`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar teste
testAuthAndTests();