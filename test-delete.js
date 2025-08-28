// Teste simples para verificar a função de exclusão
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDelete() {
  try {
    console.log('🔍 Verificando testes existentes...');
    
    // Listar todos os testes
    const { data: tests, error: listError } = await supabase
      .from('performance_tests')
      .select('id, test_date, test_type, user_id, evaluatees(name)')
      .limit(5);
    
    if (listError) {
      console.error('❌ Erro ao listar testes:', listError);
      return;
    }
    
    console.log('📋 Testes encontrados:', tests?.length || 0);
    
    if (tests && tests.length > 0) {
      console.log('\n📝 Primeiros testes:');
      tests.forEach((test, index) => {
        console.log(`${index + 1}. ID: ${test.id}`);
        console.log(`   Data: ${test.test_date}`);
        console.log(`   Tipo: ${test.test_type}`);
        console.log(`   User ID: ${test.user_id}`);
        console.log(`   Avaliando: ${test.evaluatees?.name || 'N/A'}`);
        console.log('');
      });
      
      // Tentar excluir o primeiro teste (simulando a função deleteTest)
      const testToDelete = tests[0];
      console.log(`🗑️ Tentando excluir teste: ${testToDelete.id}`);
      
      // Simular exclusão sem user_id (como cliente anônimo)
      const { error: deleteError } = await supabase
        .from('performance_tests')
        .delete()
        .eq('id', testToDelete.id);
      
      if (deleteError) {
        console.error('❌ Erro ao excluir teste (sem user_id):', deleteError);
        
        // Tentar com user_id específico
        console.log('🔄 Tentando excluir com user_id específico...');
        const { error: deleteError2 } = await supabase
          .from('performance_tests')
          .delete()
          .eq('id', testToDelete.id)
          .eq('user_id', testToDelete.user_id);
        
        if (deleteError2) {
          console.error('❌ Erro ao excluir teste (com user_id):', deleteError2);
        } else {
          console.log('✅ Teste excluído com sucesso!');
        }
      } else {
        console.log('✅ Teste excluído com sucesso (sem user_id)!');
      }
      
    } else {
      console.log('📭 Nenhum teste encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testDelete();