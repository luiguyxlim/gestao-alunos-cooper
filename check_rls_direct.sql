-- Script SQL para verificar políticas RLS da tabela performance_tests

-- 1. Verificar se RLS está habilitado na tabela
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'performance_tests' AND schemaname = 'public';

-- 2. Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'performance_tests' AND schemaname = 'public';

-- 3. Verificar se a função auth.uid() está disponível
SELECT auth.uid() as current_user_id;

-- 4. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'performance_tests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Contar registros na tabela
SELECT COUNT(*) as total_records FROM performance_tests;

-- 6. Verificar alguns registros de exemplo
SELECT 
    id,
    user_id,
    evaluatee_id,
    test_type,
    test_date
FROM performance_tests 
LIMIT 5;