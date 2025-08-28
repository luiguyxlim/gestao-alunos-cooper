const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugTableCache() {
  console.log('🔍 Verificando cache da tabela performance_tests...')
  
  try {
    // Teste 1: Verificar se a tabela existe
    console.log('\n1. Testando acesso direto à tabela performance_tests:')
    const { data: tests, error: testsError } = await supabase
      .from('performance_tests')
      .select('id')
      .limit(1)
    
    if (testsError) {
      console.error('❌ Erro ao acessar performance_tests:', testsError)
    } else {
      console.log('✅ Tabela performance_tests acessível')
      console.log('📊 Dados encontrados:', tests?.length || 0, 'registros')
    }
    
    // Teste 2: Verificar se existe uma tabela 'tests'
    console.log('\n2. Testando acesso à tabela "tests" (que não deveria existir):')
    const { data: testsTable, error: testsTableError } = await supabase
      .from('tests')
      .select('id')
      .limit(1)
    
    if (testsTableError) {
      console.log('✅ Confirmado: tabela "tests" não existe (como esperado)')
      console.log('📝 Erro:', testsTableError.code, testsTableError.message)
    } else {
      console.log('⚠️ Inesperado: tabela "tests" existe!')
      console.log('📊 Dados:', testsTable)
    }
    
    // Teste 3: Listar todas as tabelas disponíveis
    console.log('\n3. Listando todas as tabelas disponíveis:')
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables')
    
    if (tablesError) {
      console.log('⚠️ Não foi possível listar tabelas via RPC')
      
      // Alternativa: tentar acessar information_schema
      const { data: schemaInfo, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
      
      if (schemaError) {
        console.log('⚠️ Também não foi possível acessar information_schema')
      } else {
        console.log('📋 Tabelas encontradas via information_schema:')
        schemaInfo?.forEach(table => console.log('  -', table.table_name))
      }
    } else {
      console.log('📋 Tabelas encontradas via RPC:')
      tables?.forEach(table => console.log('  -', table))
    }
    
    // Teste 4: Verificar configuração do PostgREST
    console.log('\n4. Verificando configuração do PostgREST:')
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    
    if (response.ok) {
      console.log('✅ PostgREST respondendo normalmente')
      console.log('📡 Status:', response.status)
    } else {
      console.error('❌ Problema com PostgREST:', response.status, response.statusText)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugTableCache()
  .then(() => {
    console.log('\n🏁 Diagnóstico concluído')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })