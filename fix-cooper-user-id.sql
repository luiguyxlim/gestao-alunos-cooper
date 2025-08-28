-- Script para corrigir incompatibilidade de user_id entre testes de Cooper e avaliandos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o problema atual
SELECT 
    'PROBLEMA IDENTIFICADO:' as status,
    pt.id as test_id,
    pt.user_id as test_user_id,
    pt.evaluatee_id,
    e.user_id as evaluatee_user_id,
    e.name as evaluatee_name,
    pt.cooper_test_distance,
    pt.test_date,
    CASE 
        WHEN pt.user_id = e.user_id THEN 'COMPATÍVEL' 
        ELSE 'INCOMPATÍVEL' 
    END as compatibility
FROM performance_tests pt
LEFT JOIN evaluatees e ON pt.evaluatee_id = e.id
WHERE pt.test_type = 'cooper_vo2'
ORDER BY pt.created_at DESC;

-- 2. Atualizar user_id dos testes para corresponder ao user_id do avaliando
UPDATE performance_tests 
SET user_id = (
    SELECT e.user_id 
    FROM evaluatees e 
    WHERE e.id = performance_tests.evaluatee_id
)
WHERE test_type = 'cooper_vo2'
AND user_id != (
    SELECT e.user_id 
    FROM evaluatees e 
    WHERE e.id = performance_tests.evaluatee_id
);

-- 3. Verificar se a correção foi aplicada
SELECT 
    'APÓS CORREÇÃO:' as status,
    pt.id as test_id,
    pt.user_id as test_user_id,
    pt.evaluatee_id,
    e.user_id as evaluatee_user_id,
    e.name as evaluatee_name,
    pt.cooper_test_distance,
    pt.test_date,
    CASE 
        WHEN pt.user_id = e.user_id THEN 'COMPATÍVEL' 
        ELSE 'INCOMPATÍVEL' 
    END as compatibility
FROM performance_tests pt
LEFT JOIN evaluatees e ON pt.evaluatee_id = e.id
WHERE pt.test_type = 'cooper_vo2'
ORDER BY pt.created_at DESC;

-- 4. Verificar se há outros tipos de teste com o mesmo problema
SELECT 
    'OUTROS TESTES COM PROBLEMA:' as status,
    pt.test_type,
    COUNT(*) as total_tests,
    COUNT(CASE WHEN pt.user_id != e.user_id THEN 1 END) as incompatible_tests
FROM performance_tests pt
LEFT JOIN evaluatees e ON pt.evaluatee_id = e.id
GROUP BY pt.test_type
HAVING COUNT(CASE WHEN pt.user_id != e.user_id THEN 1 END) > 0
ORDER BY pt.test_type;

-- 5. Corrigir TODOS os testes com user_id incompatível (se necessário)
-- Descomente as linhas abaixo se houver outros tipos de teste com o mesmo problema
/*
UPDATE performance_tests 
SET user_id = (
    SELECT e.user_id 
    FROM evaluatees e 
    WHERE e.id = performance_tests.evaluatee_id
)
WHERE user_id != (
    SELECT e.user_id 
    FROM evaluatees e 
    WHERE e.id = performance_tests.evaluatee_id
);
*/

-- 6. Verificação final
SELECT 
    'VERIFICAÇÃO FINAL:' as status,
    test_type,
    COUNT(*) as total_tests,
    COUNT(CASE WHEN pt.user_id = e.user_id THEN 1 END) as compatible_tests,
    COUNT(CASE WHEN pt.user_id != e.user_id THEN 1 END) as incompatible_tests
FROM performance_tests pt
LEFT JOIN evaluatees e ON pt.evaluatee_id = e.id
GROUP BY test_type
ORDER BY test_type;