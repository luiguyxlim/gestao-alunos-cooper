-- Diagnóstico do problema com testes de Cooper
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se as tabelas existem
SELECT 'Tabelas existentes:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('evaluatees', 'students', 'performance_tests')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela performance_tests
SELECT 'Colunas da tabela performance_tests:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'performance_tests'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Buscar Moisés Santa Rosa
SELECT 'Buscando Moisés Santa Rosa:' as info;
SELECT 
    id,
    name,
    email,
    active,
    created_at
FROM evaluatees 
WHERE LOWER(name) LIKE '%mois%' 
   OR LOWER(name) LIKE '%santa%' 
   OR LOWER(name) LIKE '%rosa%'
ORDER BY name;

-- 4. Verificar todos os testes de Cooper
SELECT 'Todos os testes de Cooper:' as info;
SELECT 
    pt.id,
    pt.test_date,
    pt.cooper_test_distance,
    pt.vo2_max,
    pt.evaluatee_id,
    pt.created_at,
    e.name as evaluatee_name
FROM performance_tests pt
LEFT JOIN evaluatees e ON pt.evaluatee_id = e.id
WHERE pt.test_type = 'cooper_vo2'
ORDER BY pt.created_at DESC;

-- 5. Verificar se existe coluna student_id ainda
SELECT 'Verificando se ainda existe student_id:' as info;
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'performance_tests'
AND table_schema = 'public'
AND column_name IN ('student_id', 'evaluatee_id');

-- 6. Verificar foreign keys
SELECT 'Foreign keys da tabela performance_tests:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'performance_tests';

-- 7. Contar registros por avaliando
SELECT 'Contagem de testes por avaliando:' as info;
SELECT 
    e.name,
    COUNT(pt.id) as total_tests,
    COUNT(CASE WHEN pt.test_type = 'cooper_vo2' THEN 1 END) as cooper_tests
FROM evaluatees e
LEFT JOIN performance_tests pt ON e.id = pt.evaluatee_id
WHERE e.active = true
GROUP BY e.id, e.name
HAVING COUNT(pt.id) > 0
ORDER BY cooper_tests DESC, total_tests DESC;