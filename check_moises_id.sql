-- Script para identificar o ID do Moisés Santa Rosa e verificar seus testes

-- 1. Buscar todos os avaliandos para identificar o Moisés
SELECT 
    id,
    name,
    email,
    active,
    created_at
FROM evaluatees 
WHERE active = true
ORDER BY name;

-- 2. Buscar especificamente por Moisés
SELECT 
    id,
    name,
    email,
    active
FROM evaluatees 
WHERE LOWER(name) LIKE '%mois%' 
   OR LOWER(name) LIKE '%santa%' 
   OR LOWER(name) LIKE '%rosa%'
ORDER BY name;

-- 3. Verificar todos os testes de Cooper com nomes dos avaliandos
SELECT 
    pt.id as test_id,
    pt.test_date,
    pt.cooper_test_distance,
    pt.vo2_max,
    pt.evaluatee_id,
    e.name as evaluatee_name,
    e.email,
    pt.created_at
FROM performance_tests pt
LEFT JOIN evaluatees e ON pt.evaluatee_id = e.id
WHERE pt.test_type = 'cooper_vo2'
ORDER BY e.name, pt.created_at DESC;

-- 4. Verificar se há algum teste com os IDs que vimos nos logs
SELECT 
    pt.id as test_id,
    pt.evaluatee_id,
    e.name as evaluatee_name,
    pt.cooper_test_distance,
    pt.test_date
FROM performance_tests pt
LEFT JOIN evaluatees e ON pt.evaluatee_id = e.id
WHERE pt.evaluatee_id IN (
    'fd22aadc-80d1-4d03-8ac0-e2f19e293812',
    '7cd5f092-36c6-4838-aa16-5be4069b7fd4',
    'fa8493b0-f8e7-4404-9e9f-f380feda0bd7'
)
AND pt.test_type = 'cooper_vo2'
ORDER BY e.name, pt.created_at DESC;