-- Migração para reverter de evaluatees para students
-- Execute este script no SQL Editor do Supabase

-- 1. Renomear tabela evaluatees para students
ALTER TABLE IF EXISTS public.evaluatees RENAME TO students;

-- 2. Renomear coluna evaluatee_id para student_id na tabela performance_tests (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'performance_tests' 
        AND column_name = 'evaluatee_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.performance_tests 
        RENAME COLUMN evaluatee_id TO student_id;
        RAISE NOTICE 'Coluna evaluatee_id renomeada para student_id';
    ELSE
        RAISE NOTICE 'Coluna evaluatee_id não existe ou já foi renomeada';
    END IF;
END $$;

-- 3. Atualizar foreign key constraint
ALTER TABLE public.performance_tests 
DROP CONSTRAINT IF EXISTS performance_tests_evaluatee_id_fkey;

-- Adicionar constraint apenas se a coluna student_id existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'performance_tests' 
        AND column_name = 'student_id' 
        AND table_schema = 'public'
    ) THEN
        -- Verificar se a constraint já existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'performance_tests_student_id_fkey'
            AND table_name = 'performance_tests'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.performance_tests 
            ADD CONSTRAINT performance_tests_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
            RAISE NOTICE 'Foreign key constraint adicionada';
        ELSE
            RAISE NOTICE 'Foreign key constraint já existe';
        END IF;
    ELSE
        RAISE NOTICE 'Coluna student_id não encontrada';
    END IF;
END $$;

-- 4. Renomear índices
DROP INDEX IF EXISTS idx_evaluatees_user_id;
DROP INDEX IF EXISTS idx_evaluatees_active;
DROP INDEX IF EXISTS idx_performance_tests_evaluatee_id;

CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON public.students(active);
CREATE INDEX IF NOT EXISTS idx_performance_tests_student_id ON public.performance_tests(student_id);

-- 5. Atualizar políticas RLS para a nova tabela students
DROP POLICY IF EXISTS "Users can view own evaluatees" ON public.students;
DROP POLICY IF EXISTS "Users can insert own evaluatees" ON public.students;
DROP POLICY IF EXISTS "Users can update own evaluatees" ON public.students;
DROP POLICY IF EXISTS "Users can delete own evaluatees" ON public.students;
DROP POLICY IF EXISTS "Users can view own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert own students" ON public.students;
DROP POLICY IF EXISTS "Users can update own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete own students" ON public.students;

CREATE POLICY "Users can view own students" ON public.students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own students" ON public.students
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own students" ON public.students
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own students" ON public.students
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Atualizar trigger para a nova tabela
DROP TRIGGER IF EXISTS update_evaluatees_updated_at ON public.students;

-- Criar trigger apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_students_updated_at'
        AND event_object_table = 'students'
        AND event_object_schema = 'public'
    ) THEN
        CREATE TRIGGER update_students_updated_at
          BEFORE UPDATE ON public.students
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_students_updated_at criado';
    ELSE
        RAISE NOTICE 'Trigger update_students_updated_at já existe';
    END IF;
END $$;

-- 7. Atualizar views e tabelas de estatísticas para usar 'students'
DROP VIEW IF EXISTS performance_age_groups;
DROP VIEW IF EXISTS performance_global_stats;

-- Recriar view performance_age_groups
CREATE OR REPLACE VIEW performance_age_groups AS
SELECT 
    CASE 
        WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 6 AND 12 THEN '6-12'
        WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 13 AND 17 THEN '13-17'
        WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 18 AND 25 THEN '18-25'
        WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 26 AND 35 THEN '26-35'
        WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 36 AND 45 THEN '36-45'
        WHEN EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 46 AND 55 THEN '46-55'
        ELSE '56+'
    END as age_group,
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT CASE WHEN s.active = true THEN s.id END) as total_active_students,
    COUNT(pt.id) as total_tests,
    ROUND(AVG(pt.vo2_max), 2) as avg_vo2_max,
    ROUND(AVG(pt.cooper_distance), 2) as avg_cooper_distance,
    MAX(pt.vo2_max) as max_vo2_max,
    MAX(pt.cooper_distance) as max_cooper_distance,
    (SELECT s2.id FROM students s2 
     JOIN performance_tests pt2 ON s2.id = pt2.student_id 
     WHERE CASE 
        WHEN EXTRACT(YEAR FROM AGE(s2.birth_date)) BETWEEN 6 AND 12 THEN '6-12'
        WHEN EXTRACT(YEAR FROM AGE(s2.birth_date)) BETWEEN 13 AND 17 THEN '13-17'
        WHEN EXTRACT(YEAR FROM AGE(s2.birth_date)) BETWEEN 18 AND 25 THEN '18-25'
        WHEN EXTRACT(YEAR FROM AGE(s2.birth_date)) BETWEEN 26 AND 35 THEN '26-35'
        WHEN EXTRACT(YEAR FROM AGE(s2.birth_date)) BETWEEN 36 AND 45 THEN '36-45'
        WHEN EXTRACT(YEAR FROM AGE(s2.birth_date)) BETWEEN 46 AND 55 THEN '46-55'
        ELSE '56+'
     END = CASE 
        WHEN EXTRACT(YEAR FROM AGE(s.birth_date)) BETWEEN 6 AND 12 THEN '6-12'
        WHEN EXTRACT(YEAR FROM AGE(s.birth_date)) BETWEEN 13 AND 17 THEN '13-17'
        WHEN EXTRACT(YEAR FROM AGE(s.birth_date)) BETWEEN 18 AND 25 THEN '18-25'
        WHEN EXTRACT(YEAR FROM AGE(s.birth_date)) BETWEEN 26 AND 35 THEN '26-35'
        WHEN EXTRACT(YEAR FROM AGE(s.birth_date)) BETWEEN 36 AND 45 THEN '36-45'
        WHEN EXTRACT(YEAR FROM AGE(s.birth_date)) BETWEEN 46 AND 55 THEN '46-55'
        ELSE '56+'
     END
     AND pt2.vo2_max = MAX(pt.vo2_max)
     LIMIT 1) as best_vo2_max_student_id,
    (SELECT s2.id FROM students s2 
     JOIN performance_tests pt2 ON s2.id = pt2.student_id 
     WHERE CASE 
        WHEN EXTRACT(YEAR FROM AGE(s2.birth_date)) BETWEEN 6 AND 12 THEN '6-12'
        WHEN EXTRACT(YEAR FROM AGE(s2.birth_date)) BETWEEN 13 AND 17 THEN '13-17'
        WHEN EXTRACT(YEAR FROM AGE(s2.birth_date)) BETWEEN 18 AND 25 THEN '18-25'
        WHEN EXTRACT(YEAR FROM AGE(s2.birth_date)) BETWEEN 26 AND 35 THEN '26-35'
        WHEN EXTRACT(YEAR FROM AGE(s2.birth_date)) BETWEEN 36 AND 45 THEN '36-45'
        WHEN EXTRACT(YEAR FROM AGE(s2.birth_date)) BETWEEN 46 AND 55 THEN '46-55'
        ELSE '56+'
     END = CASE 
        WHEN EXTRACT(YEAR FROM AGE(s.birth_date)) BETWEEN 6 AND 12 THEN '6-12'
        WHEN EXTRACT(YEAR FROM AGE(s.birth_date)) BETWEEN 13 AND 17 THEN '13-17'
        WHEN EXTRACT(YEAR FROM AGE(s.birth_date)) BETWEEN 18 AND 25 THEN '18-25'
        WHEN EXTRACT(YEAR FROM AGE(s.birth_date)) BETWEEN 26 AND 35 THEN '26-35'
        WHEN EXTRACT(YEAR FROM AGE(s.birth_date)) BETWEEN 36 AND 45 THEN '36-45'
        WHEN EXTRACT(YEAR FROM AGE(s.birth_date)) BETWEEN 46 AND 55 THEN '46-55'
        ELSE '56+'
     END
     AND pt2.cooper_distance = MAX(pt.cooper_distance)
     LIMIT 1) as best_cooper_distance_student_id
FROM students s
LEFT JOIN performance_tests pt ON s.id = pt.student_id
GROUP BY age_group;

-- Recriar view performance_global_stats
CREATE OR REPLACE VIEW performance_global_stats AS
SELECT 
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT CASE WHEN s.active = true THEN s.id END) as total_active_students,
    COUNT(pt.id) as total_tests,
    ROUND(AVG(pt.vo2_max), 2) as avg_vo2_max,
    ROUND(AVG(pt.cooper_distance), 2) as avg_cooper_distance,
    MAX(pt.vo2_max) as max_vo2_max,
    MAX(pt.cooper_distance) as max_cooper_distance,
    (SELECT s2.id FROM students s2 
     JOIN performance_tests pt2 ON s2.id = pt2.student_id 
     WHERE pt2.vo2_max = (SELECT MAX(vo2_max) FROM performance_tests)
     LIMIT 1) as best_vo2_max_student_id,
    (SELECT s2.id FROM students s2 
     JOIN performance_tests pt2 ON s2.id = pt2.student_id 
     WHERE pt2.cooper_distance = (SELECT MAX(cooper_distance) FROM performance_tests)
     LIMIT 1) as best_cooper_distance_student_id
FROM students s
LEFT JOIN performance_tests pt ON s.id = pt.student_id;

COMMIT;

-- Verificar se as tabelas foram criadas corretamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela students criada com sucesso';
    ELSE
        RAISE EXCEPTION 'Erro: Tabela students não foi criada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_tests' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela performance_tests existe';
    ELSE
        RAISE EXCEPTION 'Erro: Tabela performance_tests não existe';
    END IF;
END $$;