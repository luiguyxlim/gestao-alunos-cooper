const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function forceSchemaReload() {
  console.log('🔄 Tentando forçar reload do cache do PostgREST...')
  
  try {
    // Método 1: Fazer uma requisição direta ao PostgREST para recarregar o cache
    console.log('\n1. Tentando recarregar cache via requisição HTTP:')
    
    const reloadResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    })
    
    console.log('📡 Status da requisição de reload:', reloadResponse.status)
    
    // Método 2: Tentar acessar uma tabela que sabemos que existe
    console.log('\n2. Testando acesso à tabela performance_tests:')
    const { data: tests, error: testsError } = await supabase
      .from('performance_tests')
      .select('id, test_type, created_at')
      .limit(5)
    
    if (testsError) {
      console.error('❌ Erro ao acessar performance_tests:', testsError)
    } else {
      console.log('✅ Tabela performance_tests acessível')
      console.log('📊 Registros encontrados:', tests?.length || 0)
      if (tests && tests.length > 0) {
        console.log('📝 Primeiro registro:', tests[0])
      }
    }
    
    // Método 3: Tentar acessar outras tabelas para verificar se o cache está funcionando
    console.log('\n3. Testando acesso à tabela evaluatees:')
    const { data: evaluatees, error: evaluateesError } = await supabase
      .from('evaluatees')
      .select('id, name')
      .limit(3)
    
    if (evaluateesError) {
      console.error('❌ Erro ao acessar evaluatees:', evaluateesError)
    } else {
      console.log('✅ Tabela evaluatees acessível')
      console.log('📊 Registros encontrados:', evaluatees?.length || 0)
    }
    
    // Método 4: Verificar se o problema persiste com a tabela 'tests'
    console.log('\n4. Testando acesso à tabela "tests" (deve falhar):')
    const { data: testsTable, error: testsTableError } = await supabase
      .from('tests')
      .select('id')
      .limit(1)
    
    if (testsTableError) {
      console.log('✅ Confirmado: erro PGRST205 ainda ocorre para tabela "tests"')
      console.log('📝 Código do erro:', testsTableError.code)
      console.log('📝 Mensagem:', testsTableError.message)
    } else {
      console.log('⚠️ Inesperado: tabela "tests" agora é acessível!')
    }
    
    // Método 5: Tentar uma operação que force o PostgREST a recarregar
    console.log('\n5. Tentando operação que force reload do esquema:')
    
    // Fazer uma consulta complexa que pode forçar o reload
    const { data: complexQuery, error: complexError } = await supabase
      .rpc('version') // Função built-in do PostgreSQL
    
    if (complexError) {
      console.log('⚠️ Erro na consulta complexa:', complexError.message)
    } else {
      console.log('✅ Consulta complexa executada com sucesso')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

forceSchemaReload()
  .then(() => {
    console.log('\n🏁 Tentativa de reload do cache concluída')
    console.log('\n💡 Sugestões:')
    console.log('1. Aguarde alguns minutos para o cache do PostgREST se atualizar automaticamente')
    console.log('2. Se o problema persistir, pode ser necessário reiniciar o serviço PostgREST no Supabase')
    console.log('3. Verifique se há alguma migração pendente que precisa ser aplicada')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })