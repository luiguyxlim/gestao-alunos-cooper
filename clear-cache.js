// Script para limpar cache e investigar problemas de cache
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function clearCacheAndTest() {
  console.log('🧹 Limpando cache e testando conexões...')
  
  try {
    // 1. Testar conexão básica com Supabase
    console.log('\n1. Testando conexão básica com Supabase:')
    const { data: healthCheck, error: healthError } = await supabase
      .from('performance_tests')
      .select('count')
      .limit(1)
    
    if (healthError) {
      console.log('❌ Erro na conexão:', healthError.message)
      console.log('📝 Código do erro:', healthError.code)
    } else {
      console.log('✅ Conexão com Supabase OK')
    }
    
    // 2. Verificar se a tabela 'tests' realmente não existe
    console.log('\n2. Verificando tabela "tests" (deve falhar):')
    const { data: testsData, error: testsError } = await supabase
      .from('tests')
      .select('*')
      .limit(1)
    
    if (testsError) {
      console.log('✅ Confirmado: tabela "tests" não existe')
      console.log('📝 Código do erro:', testsError.code)
      console.log('📝 Mensagem:', testsError.message)
    } else {
      console.log('⚠️ Inesperado: tabela "tests" existe!')
    }
    
    // 3. Verificar tabela performance_tests
    console.log('\n3. Verificando tabela "performance_tests":')
    const { data: perfData, error: perfError } = await supabase
      .from('performance_tests')
      .select('id, test_type, created_at')
      .limit(3)
    
    if (perfError) {
      console.log('❌ Erro ao acessar performance_tests:', perfError.message)
    } else {
      console.log('✅ Tabela performance_tests acessível')
      console.log('📊 Registros encontrados:', perfData?.length || 0)
    }
    
    // 4. Verificar se há algum problema de cache no PostgREST
    console.log('\n4. Verificando cache do PostgREST:')
    const { data: schemaData, error: schemaError } = await supabase.rpc('version')
    
    if (schemaError) {
      console.log('⚠️ Não foi possível verificar versão do PostgREST:', schemaError.message)
    } else {
      console.log('✅ PostgREST respondendo normalmente')
    }
    
    // 5. Instruções para limpar cache do browser
    console.log('\n🔧 INSTRUÇÕES PARA LIMPAR CACHE:')
    console.log('1. Abra o DevTools (F12)')
    console.log('2. Vá para Application > Storage')
    console.log('3. Clique em "Clear storage" ou "Limpar armazenamento"')
    console.log('4. Ou use Ctrl+Shift+R para hard refresh')
    console.log('5. Ou abra uma aba anônima/privada')
    
    console.log('\n📱 PARA LIMPAR SERVICE WORKER:')
    console.log('1. DevTools > Application > Service Workers')
    console.log('2. Clique em "Unregister" no service worker')
    console.log('3. Recarregue a página')
    
    console.log('\n🌐 TESTE EM NAVEGADOR LIMPO:')
    console.log('1. Abra uma aba anônima/privada')
    console.log('2. Acesse a aplicação')
    console.log('3. Verifique se o erro persiste')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

clearCacheAndTest()