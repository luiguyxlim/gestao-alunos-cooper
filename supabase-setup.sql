-- Configuração inicial do banco de dados Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de alunos
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro')),
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  medical_notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de testes de performance
CREATE TABLE IF NOT EXISTS public.performance_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_date DATE NOT NULL,
  test_type TEXT NOT NULL,
  
  -- Medidas corporais
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  body_fat_percentage DECIMAL(5,2),
  muscle_mass DECIMAL(5,2),
  
  -- Testes cardiovasculares
  resting_heart_rate INTEGER,
  max_heart_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  
  -- Testes de força
  bench_press_1rm DECIMAL(5,2),
  squat_1rm DECIMAL(5,2),
  deadlift_1rm DECIMAL(5,2),
  
  -- Testes de resistência
  vo2_max DECIMAL(5,2),
  cooper_test_distance INTEGER, -- em metros
  plank_time INTEGER, -- em segundos
  
  -- Testes de flexibilidade
  sit_and_reach DECIMAL(5,2), -- em centímetros
  shoulder_flexibility TEXT,
  
  -- Observações gerais
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Criar triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_tests_updated_at
  BEFORE UPDATE ON public.performance_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Criar função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 7. Criar trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Configurar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_tests ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas de segurança para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 10. Criar políticas de segurança para students
CREATE POLICY "Users can view own students" ON public.students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own students" ON public.students
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own students" ON public.students
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own students" ON public.students
  FOR DELETE USING (auth.uid() = user_id);

-- 11. Criar políticas de segurança para performance_tests
CREATE POLICY "Users can view own performance tests" ON public.performance_tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance tests" ON public.performance_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance tests" ON public.performance_tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own performance tests" ON public.performance_tests
  FOR DELETE USING (auth.uid() = user_id);

-- 12. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON public.students(active);
CREATE INDEX IF NOT EXISTS idx_performance_tests_student_id ON public.performance_tests(student_id);
CREATE INDEX IF NOT EXISTS idx_performance_tests_user_id ON public.performance_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_tests_test_date ON public.performance_tests(test_date);

-- 13. Inserir dados de exemplo (opcional)
-- Descomente as linhas abaixo se quiser dados de exemplo

/*
-- Exemplo de aluno
INSERT INTO public.students (user_id, name, email, phone, birth_date, gender, address, emergency_contact, emergency_phone)
VALUES (
  auth.uid(),
  'João Silva',
  'joao.silva@email.com',
  '(11) 99999-9999',
  '1995-05-15',
  'masculino',
  'Rua das Flores, 123 - São Paulo, SP',
  'Maria Silva',
  '(11) 88888-8888'
);

-- Exemplo de teste de performance
INSERT INTO public.performance_tests (
  student_id,
  user_id,
  test_date,
  test_type,
  weight,
  height,
  body_fat_percentage,
  resting_heart_rate,
  bench_press_1rm,
  squat_1rm,
  vo2_max,
  notes
)
VALUES (
  (SELECT id FROM public.students WHERE name = 'João Silva' LIMIT 1),
  auth.uid(),
  CURRENT_DATE,
  'Avaliação Inicial',
  75.5,
  175.0,
  12.5,
  65,
  80.0,
  100.0,
  45.2,
  'Primeira avaliação do aluno. Bom condicionamento geral.'
);
*/