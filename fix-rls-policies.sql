-- Script para verificar e corrigir políticas RLS da tabela performance_tests
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se RLS está habilitado
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

-- 3. Habilitar RLS se não estiver habilitado
ALTER TABLE public.performance_tests ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Users can view own performance tests" ON public.performance_tests;
DROP POLICY IF EXISTS "Users can insert own performance tests" ON public.performance_tests;
DROP POLICY IF EXISTS "Users can update own performance tests" ON public.performance_tests;
DROP POLICY IF EXISTS "Users can delete own performance tests" ON public.performance_tests;

-- 5. Recriar políticas RLS corretamente
CREATE POLICY "Users can view own performance tests" ON public.performance_tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance tests" ON public.performance_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance tests" ON public.performance_tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own performance tests" ON public.performance_tests
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Verificar se as políticas foram criadas corretamente
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

-- 7. Testar se RLS está funcionando
-- Esta consulta deve retornar 0 registros se RLS estiver funcionando
-- (porque não há usuário autenticado neste contexto)
SELECT COUNT(*) as total_tests_without_auth
FROM public.performance_tests;

-- 8. Verificar se a função auth.uid() está disponível
SELECT auth.uid() as current_user_id;

-- 9. Verificar estrutura da tabela
\d public.performance_tests;

-- 10. Verificar se há registros na tabela
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users
FROM public.performance_tests;