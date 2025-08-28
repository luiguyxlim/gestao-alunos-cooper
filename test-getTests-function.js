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

async function testGetTestsFunction() {
  console.log('🧪 Testando função getTests...');
  
  try {
    // Simular a query exata da função getTests
    const { data: tests, error } = await supabase
      .from('performance_tests')
      .select(`
        *,
        evaluatees (
          id,
          name
        )
      `)
      .eq('user_id', '9f6db044-a0e9-4862-a25f-e50d0cdbb5ba') // User ID do debug
      .order('test_date', { ascending: false });

    if (error) {
      console.error('❌ Erro na query:', error);
      console.error('   Código:', error.code);
      console.error('   Mensagem:', error.message);
      console.error('   Detalhes:', error.details);
      return;
    }

    console.log('✅ Query executada com sucesso!');
    console.log(`📊 Testes encontrados: ${tests?.length || 0}`);
    
    if (tests && tests.length > 0) {
      console.log('\n📋 Primeiros 3 testes:');
      tests.slice(0, 3).forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.evaluatees?.name || 'Nome não encontrado'} - ${test.test_type} (${test.test_date})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar teste
testGetTestsFunction();