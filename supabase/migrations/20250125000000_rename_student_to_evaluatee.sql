-- Migração para renomear student_id para evaluatee_id e students para evaluatees
-- Execute este script no SQL Editor do Supabase

-- 1. Renomear tabela students para evaluatees
ALTER TABLE IF EXISTS public.students RENAME TO evaluatees;

-- 2. Renomear coluna student_id para evaluatee_id na tabela performance_tests (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'performance_tests' 
        AND column_name = 'student_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.performance_tests 
        RENAME COLUMN student_id TO evaluatee_id;
        RAISE NOTICE 'Coluna student_id renomeada para evaluatee_id';
    ELSE
        RAISE NOTICE 'Coluna student_id não existe ou já foi renomeada';
    END IF;
END $$;

-- 3. Atualizar foreign key constraint
ALTER TABLE public.performance_tests 
DROP CONSTRAINT IF EXISTS performance_tests_student_id_fkey;

-- Adicionar constraint apenas se a coluna evaluatee_id existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'performance_tests' 
        AND column_name = 'evaluatee_id' 
        AND table_schema = 'public'
    ) THEN
        -- Verificar se a constraint já existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'performance_tests_evaluatee_id_fkey'
            AND table_name = 'performance_tests'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.performance_tests 
            ADD CONSTRAINT performance_tests_evaluatee_id_fkey 
            FOREIGN KEY (evaluatee_id) REFERENCES public.evaluatees(id) ON DELETE CASCADE;
            RAISE NOTICE 'Foreign key constraint adicionada';
        ELSE
            RAISE NOTICE 'Foreign key constraint já existe';
        END IF;
    ELSE
        RAISE NOTICE 'Coluna evaluatee_id não encontrada';
    END IF;
END $$;

-- 4. Renomear índices
DROP INDEX IF EXISTS idx_students_user_id;
DROP INDEX IF EXISTS idx_students_active;
DROP INDEX IF EXISTS idx_performance_tests_student_id;

CREATE INDEX IF NOT EXISTS idx_evaluatees_user_id ON public.evaluatees(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluatees_active ON public.evaluatees(active);
CREATE INDEX IF NOT EXISTS idx_performance_tests_evaluatee_id ON public.performance_tests(evaluatee_id);

-- 5. Atualizar políticas RLS para a nova tabela evaluatees
DROP POLICY IF EXISTS "Users can view own students" ON public.evaluatees;
DROP POLICY IF EXISTS "Users can insert own students" ON public.evaluatees;
DROP POLICY IF EXISTS "Users can update own students" ON public.evaluatees;
DROP POLICY IF EXISTS "Users can delete own students" ON public.evaluatees;
DROP POLICY IF EXISTS "Users can view own evaluatees" ON public.evaluatees;
DROP POLICY IF EXISTS "Users can insert own evaluatees" ON public.evaluatees;
DROP POLICY IF EXISTS "Users can update own evaluatees" ON public.evaluatees;
DROP POLICY IF EXISTS "Users can delete own evaluatees" ON public.evaluatees;

CREATE POLICY "Users can view own evaluatees" ON public.evaluatees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evaluatees" ON public.evaluatees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evaluatees" ON public.evaluatees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own evaluatees" ON public.evaluatees
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Atualizar trigger para a nova tabela
DROP TRIGGER IF EXISTS update_students_updated_at ON public.evaluatees;

-- Criar trigger apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_evaluatees_updated_at'
        AND event_object_table = 'evaluatees'
        AND event_object_schema = 'public'
    ) THEN
        CREATE TRIGGER update_evaluatees_updated_at
          BEFORE UPDATE ON public.evaluatees
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_evaluatees_updated_at criado';
    ELSE
        RAISE NOTICE 'Trigger update_evaluatees_updated_at já existe';
    END IF;
END $$;

-- 7. Adicionar colunas que podem estar faltando na tabela performance_tests
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS speed DECIMAL(5,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS agility DECIMAL(5,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS strength DECIMAL(5,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS endurance DECIMAL(5,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS flexibility DECIMAL(5,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS coordination DECIMAL(5,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS balance DECIMAL(5,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS power DECIMAL(5,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS reaction_time DECIMAL(5,2);

-- 8. Adicionar colunas específicas para avaliação de desempenho
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS intensity_percentage DECIMAL(5,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS training_time DECIMAL(5,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS body_weight DECIMAL(5,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS training_distance DECIMAL(8,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS training_intensity DECIMAL(8,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS training_velocity DECIMAL(8,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS total_o2_consumption DECIMAL(8,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS caloric_expenditure DECIMAL(8,2);
ALTER TABLE public.performance_tests ADD COLUMN IF NOT EXISTS weight_loss DECIMAL(8,4);

COMMIT;