-- Adicionar coluna de peso corporal na tabela students
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna weight na tabela students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN public.students.weight IS 'Peso corporal em quilogramas (kg)';

