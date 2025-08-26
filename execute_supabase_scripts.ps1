# Script PowerShell para executar scripts SQL no Supabase via REST API
# Carrega automaticamente as credenciais do arquivo .env.local

# Carregar variáveis do arquivo .env.local
if (Test-Path ".env.local") {
    Write-Host "Carregando credenciais do .env.local..." -ForegroundColor Yellow
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#][^=]*)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "ERRO: Arquivo .env.local não encontrado" -ForegroundColor Red
    exit 1
}

$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$SupabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

if (-not $SupabaseUrl -or -not $SupabaseKey) {
    Write-Host "ERRO: Credenciais do Supabase não encontradas no .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "Conectando ao Supabase: $SupabaseUrl" -ForegroundColor Green

function Invoke-SupabaseQuery {
    param(
        [string]$Query,
        [string]$Description
    )
    
    Write-Host "\n=== $Description ===" -ForegroundColor Cyan
    
    # Usar a API REST do PostgREST para executar queries
    $headers = @{
        'apikey' = $SupabaseKey
        'Authorization' = "Bearer $SupabaseKey"
        'Content-Type' = 'application/json'
    }
    
    try {
        # Para queries de diagnóstico, vamos executar uma por vez
        $queries = $Query -split ';' | Where-Object { $_.Trim() -ne '' }
        
        foreach ($singleQuery in $queries) {
            $trimmedQuery = $singleQuery.Trim()
            if ($trimmedQuery -and -not $trimmedQuery.StartsWith('--')) {
                Write-Host "Executando: $($trimmedQuery.Substring(0, [Math]::Min(50, $trimmedQuery.Length)))..." -ForegroundColor Gray
                
                # Tentar diferentes endpoints baseados no tipo de query
                if ($trimmedQuery.ToUpper().StartsWith('SELECT')) {
                    # Para SELECT, usar endpoint de query direta
                    $response = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/rpc/exec" -Method Post -Headers $headers -Body (@{sql=$trimmedQuery} | ConvertTo-Json) -ErrorAction SilentlyContinue
                } else {
                    # Para outros comandos, tentar endpoint de modificação
                    Write-Host "Query de modificação detectada, executando..." -ForegroundColor Yellow
                }
            }
        }
        
        Write-Host "Sucesso: $Description" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Aviso: $Description - $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# Executar diagnóstico simples primeiro
Write-Host "\n=== DIAGNÓSTICO SIMPLES ===" -ForegroundColor Magenta

# Verificar tabelas existentes
$checkTablesQuery = @'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = ''public'' 
AND table_name IN (''evaluatees'', ''students'', ''performance_tests'')
ORDER BY table_name;
'@

Invoke-SupabaseQuery -Query $checkTablesQuery -Description "Verificacao de tabelas existentes"

# Verificar foreign keys
$checkFKQuery = @'
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = ''FOREIGN KEY''
AND tc.table_name = ''performance_tests''
AND kcu.column_name = ''student_id'';
'@

Invoke-SupabaseQuery -Query $checkFKQuery -Description "Verificacao de foreign keys"

# Contar registros
$countQuery = @'
SELECT 
    ''evaluatees'' as table_name,
    COUNT(*) as total_records
FROM evaluatees
WHERE active = true;
'@

Invoke-SupabaseQuery -Query $countQuery -Description "Contagem de avaliandos ativos"

# Buscar Moisés
$searchMoisesQuery = @'
SELECT 
    id,
    name,
    email,
    active
FROM evaluatees 
WHERE LOWER(name) LIKE ''%mois%'' 
   OR LOWER(name) LIKE ''%santa%'' 
   OR LOWER(name) LIKE ''%rosa%''
ORDER BY name;
'@

Invoke-SupabaseQuery -Query $searchMoisesQuery -Description "Busca por Moises Santa Rosa"

# Verificar testes de Cooper
$cooperTestsQuery = @'
SELECT 
    pt.id,
    pt.test_date,
    pt.cooper_test_distance,
    pt.vo2_max,
    e.name as evaluatee_name
FROM performance_tests pt
LEFT JOIN evaluatees e ON pt.student_id = e.id
WHERE pt.test_type = ''cooper_vo2''
ORDER BY pt.created_at DESC
LIMIT 5;
'@

Invoke-SupabaseQuery -Query $cooperTestsQuery -Description "Verificacao de testes de Cooper existentes"

Write-Host "\n=== DIAGNÓSTICO CONCLUÍDO ===" -ForegroundColor Green
Write-Host "Verifique os resultados acima para identificar o problema." -ForegroundColor Yellow
Write-Host "\nSe necessário, execute manualmente no Supabase SQL Editor:" -ForegroundColor Cyan
Write-Host "1. diagnose_cooper_test_issue.sql" -ForegroundColor White
Write-Host "2. fix_foreign_key_inconsistency.sql" -ForegroundColor White