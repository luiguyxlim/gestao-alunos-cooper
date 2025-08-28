-- Script para corrigir o banco de dados
-- Execute este script no SQL Editor do Supabase Dashboard

-- Verificar se a coluna student_id ainda existe e renomeá-la
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'performance_tests' 
               AND column_name = 'student_id' 
               AND table_schema = 'public') THEN
        ALTER TABLE public.performance_tests RENAME COLUMN student_id TO evaluatee_id;
        RAISE NOTICE 'Coluna student_id renomeada para evaluatee_id';
    ELSE
        RAISE NOTICE 'Coluna student_id não encontrada, provavelmente já foi renomeada';
    END IF;
END $$;

-- Remover constraint antiga se existir
ALTER TABLE public.performance_tests 
DROP CONSTRAINT IF EXISTS performance_tests_student_id_fkey;

-- Adicionar nova constraint apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'performance_tests_evaluatee_id_fkey' 
                   AND table_name = 'performance_tests' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.performance_tests 
        ADD CONSTRAINT performance_tests_evaluatee_id_fkey 
        FOREIGN KEY (evaluatee_id) REFERENCES public.students(id) ON DELETE CASCADE;
        RAISE NOTICE 'Constraint performance_tests_evaluatee_id_fkey criada';
    ELSE
        RAISE NOTICE 'Constraint performance_tests_evaluatee_id_fkey já existe';
    END IF;
END $$;

-- Atualizar índices
DROP INDEX IF EXISTS idx_performance_tests_student_id;
CREATE INDEX IF NOT EXISTS idx_performance_tests_evaluatee_id ON public.performance_tests(evaluatee_id);

COMMIT;