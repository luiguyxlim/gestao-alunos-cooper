const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

// Usar service role key para ter acesso completo
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugDatabaseSchema() {
  console.log('🔍 Verificando esquema do banco de dados...')
  
  try {
    // Verificar se existe algum view chamado 'tests'
    console.log('\n1. Verificando views:')
    const { data: views, error: viewsError } = await supabase
      .from('information_schema.views')
      .select('table_name, view_definition')
      .eq('table_schema', 'public')
      .ilike('table_name', '%test%')
    
    if (viewsError) {
      console.log('⚠️ Erro ao verificar views:', viewsError.message)
    } else {
      console.log('📋 Views encontradas:')
      views?.forEach(view => {
        console.log(`  - ${view.table_name}`)
        if (view.table_name === 'tests') {
          console.log(`    Definição: ${view.view_definition}`)
        }
      })
      if (views?.length === 0) {
        console.log('  Nenhuma view relacionada a testes encontrada')
      }
    }
    
    // Verificar todas as tabelas
    console.log('\n2. Verificando todas as tabelas:')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name')
    
    if (tablesError) {
      console.log('⚠️ Erro ao verificar tabelas:', tablesError.message)
    } else {
      console.log('📋 Tabelas encontradas:')
      tables?.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`)
      })
    }
    
    // Verificar se existe algum alias ou sinônimo
    console.log('\n3. Verificando sinônimos/aliases:')
    const { data: synonyms, error: synonymsError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            tableowner
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename;
        `
      })
    
    if (synonymsError) {
      console.log('⚠️ Erro ao verificar sinônimos:', synonymsError.message)
    } else {
      console.log('📋 Tabelas via pg_tables:')
      synonyms?.forEach(table => {
        console.log(`  - ${table.tablename} (owner: ${table.tableowner})`)
      })
    }
    
    // Verificar triggers que possam estar interferindo
    console.log('\n4. Verificando triggers:')
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table, action_statement')
      .eq('trigger_schema', 'public')
      .ilike('event_object_table', '%test%')
    
    if (triggersError) {
      console.log('⚠️ Erro ao verificar triggers:', triggersError.message)
    } else {
      console.log('📋 Triggers encontrados:')
      triggers?.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name} em ${trigger.event_object_table}`)
      })
      if (triggers?.length === 0) {
        console.log('  Nenhum trigger relacionado a testes encontrado')
      }
    }
    
    // Verificar se há alguma função que possa estar mapeando
    console.log('\n5. Verificando funções relacionadas a testes:')
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .eq('routine_schema', 'public')
      .ilike('routine_name', '%test%')
    
    if (functionsError) {
      console.log('⚠️ Erro ao verificar funções:', functionsError.message)
    } else {
      console.log('📋 Funções encontradas:')
      functions?.forEach(func => {
        console.log(`  - ${func.routine_name}`)
      })
      if (functions?.length === 0) {
        console.log('  Nenhuma função relacionada a testes encontrada')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugDatabaseSchema()
  .then(() => {
    console.log('\n🏁 Diagnóstico do esquema concluído')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })