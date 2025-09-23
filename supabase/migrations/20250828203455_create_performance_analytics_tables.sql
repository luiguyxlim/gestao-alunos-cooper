-- Criar tabelas para estatísticas de performance por faixa etária
CREATE TABLE performance_age_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age_group TEXT NOT NULL CHECK (age_group IN ('18-25', '26-35', '36-45', '46-55', '56-65', '65+')),
  total_evaluations INTEGER DEFAULT 0,
  total_evaluatees INTEGER DEFAULT 0,
  avg_vo2_max DECIMAL(5,2),
  avg_cooper_distance DECIMAL(8,2),
  avg_body_fat_percentage DECIMAL(5,2),
  avg_muscle_mass DECIMAL(5,2),
  avg_resting_heart_rate DECIMAL(5,2),
  total_cooper_distance DECIMAL(10,2) DEFAULT 0,
  total_vo2_max DECIMAL(8,2) DEFAULT 0,
  vo2_max_p25 DECIMAL(5,2),
  vo2_max_p50 DECIMAL(5,2),
  vo2_max_p75 DECIMAL(5,2),
  vo2_max_p90 DECIMAL(5,2),
  cooper_distance_p25 DECIMAL(8,2),
  cooper_distance_p50 DECIMAL(8,2),
  cooper_distance_p75 DECIMAL(8,2),
  cooper_distance_p90 DECIMAL(8,2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, age_group)
);

-- Criar tabela para estatísticas globais de performance
CREATE TABLE performance_global_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_evaluations INTEGER DEFAULT 0,
  total_evaluatees INTEGER DEFAULT 0,
  total_active_evaluatees INTEGER DEFAULT 0,
  global_avg_vo2_max DECIMAL(5,2),
  global_avg_cooper_distance DECIMAL(8,2),
  global_avg_body_fat_percentage DECIMAL(5,2),
  global_avg_muscle_mass DECIMAL(5,2),
  global_avg_age DECIMAL(5,2),
  male_count INTEGER DEFAULT 0,
  female_count INTEGER DEFAULT 0,
  other_gender_count INTEGER DEFAULT 0,
  best_vo2_max DECIMAL(5,2),
  best_cooper_distance DECIMAL(8,2),
  best_vo2_max_evaluatee_id UUID REFERENCES evaluatees(id),
  best_cooper_distance_evaluatee_id UUID REFERENCES evaluatees(id),
  recent_evaluations_count INTEGER DEFAULT 0,
  recent_avg_vo2_max DECIMAL(5,2),
  recent_avg_cooper_distance DECIMAL(8,2),
  last_calculation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para calcular faixa etária baseada na data de nascimento
CREATE OR REPLACE FUNCTION calculate_age_group(birth_date DATE)
RETURNS TEXT AS $$
DECLARE
  age INTEGER;
BEGIN
  age := EXTRACT(YEAR FROM AGE(birth_date));
  
  CASE
    WHEN age BETWEEN 18 AND 25 THEN RETURN '18-25';
    WHEN age BETWEEN 26 AND 35 THEN RETURN '26-35';
    WHEN age BETWEEN 36 AND 45 THEN RETURN '36-45';
    WHEN age BETWEEN 46 AND 55 THEN RETURN '46-55';
    WHEN age BETWEEN 56 AND 65 THEN RETURN '56-65';
    WHEN age > 65 THEN RETURN '65+';
    ELSE RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Função para recalcular estatísticas por faixa etária
CREATE OR REPLACE FUNCTION recalculate_age_group_stats(p_user_id UUID, p_age_group TEXT)
RETURNS VOID AS $$
DECLARE
  stats_record RECORD;
BEGIN
  -- Calcular estatísticas para a faixa etária específica
  SELECT 
    COUNT(DISTINCT pt.id) as total_evaluations,
    COUNT(DISTINCT e.id) as total_evaluatees,
    AVG(pt.vo2_max) as avg_vo2_max,
    AVG(pt.cooper_distance) as avg_cooper_distance,
    AVG(pt.body_fat_percentage) as avg_body_fat_percentage,
    AVG(pt.muscle_mass) as avg_muscle_mass,
    AVG(pt.resting_heart_rate) as avg_resting_heart_rate,
    SUM(pt.cooper_distance) as total_cooper_distance,
    SUM(pt.vo2_max) as total_vo2_max,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY pt.vo2_max) as vo2_max_p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY pt.vo2_max) as vo2_max_p50,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY pt.vo2_max) as vo2_max_p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY pt.vo2_max) as vo2_max_p90,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY pt.cooper_distance) as cooper_distance_p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY pt.cooper_distance) as cooper_distance_p50,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY pt.cooper_distance) as cooper_distance_p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY pt.cooper_distance) as cooper_distance_p90
  INTO stats_record
  FROM performance_tests pt
  JOIN evaluatees e ON pt.evaluatee_id = e.id
  WHERE e.user_id = p_user_id 
    AND calculate_age_group(e.birth_date) = p_age_group
    AND pt.vo2_max IS NOT NULL;

  -- Inserir ou atualizar as estatísticas
  INSERT INTO performance_age_groups (
    user_id, age_group, total_evaluations, total_evaluatees,
    avg_vo2_max, avg_cooper_distance, avg_body_fat_percentage,
    avg_muscle_mass, avg_resting_heart_rate, total_cooper_distance,
    total_vo2_max, vo2_max_p25, vo2_max_p50, vo2_max_p75, vo2_max_p90,
    cooper_distance_p25, cooper_distance_p50, cooper_distance_p75,
    cooper_distance_p90, last_updated
  )
  VALUES (
    p_user_id, p_age_group, stats_record.total_evaluations, stats_record.total_evaluatees,
    stats_record.avg_vo2_max, stats_record.avg_cooper_distance, stats_record.avg_body_fat_percentage,
    stats_record.avg_muscle_mass, stats_record.avg_resting_heart_rate, stats_record.total_cooper_distance,
    stats_record.total_vo2_max, stats_record.vo2_max_p25, stats_record.vo2_max_p50, 
    stats_record.vo2_max_p75, stats_record.vo2_max_p90, stats_record.cooper_distance_p25,
    stats_record.cooper_distance_p50, stats_record.cooper_distance_p75, stats_record.cooper_distance_p90,
    NOW()
  )
  ON CONFLICT (user_id, age_group)
  DO UPDATE SET
    total_evaluations = EXCLUDED.total_evaluations,
    total_evaluatees = EXCLUDED.total_evaluatees,
    avg_vo2_max = EXCLUDED.avg_vo2_max,
    avg_cooper_distance = EXCLUDED.avg_cooper_distance,
    avg_body_fat_percentage = EXCLUDED.avg_body_fat_percentage,
    avg_muscle_mass = EXCLUDED.avg_muscle_mass,
    avg_resting_heart_rate = EXCLUDED.avg_resting_heart_rate,
    total_cooper_distance = EXCLUDED.total_cooper_distance,
    total_vo2_max = EXCLUDED.total_vo2_max,
    vo2_max_p25 = EXCLUDED.vo2_max_p25,
    vo2_max_p50 = EXCLUDED.vo2_max_p50,
    vo2_max_p75 = EXCLUDED.vo2_max_p75,
    vo2_max_p90 = EXCLUDED.vo2_max_p90,
    cooper_distance_p25 = EXCLUDED.cooper_distance_p25,
    cooper_distance_p50 = EXCLUDED.cooper_distance_p50,
    cooper_distance_p75 = EXCLUDED.cooper_distance_p75,
    cooper_distance_p90 = EXCLUDED.cooper_distance_p90,
    last_updated = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para recalcular estatísticas globais
CREATE OR REPLACE FUNCTION recalculate_global_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  global_stats RECORD;
  best_vo2_record RECORD;
  best_cooper_record RECORD;
BEGIN
  -- Calcular estatísticas globais
  SELECT 
    COUNT(DISTINCT pt.id) as total_evaluations,
    COUNT(DISTINCT e.id) as total_evaluatees,
    COUNT(DISTINCT CASE WHEN pt.created_at >= NOW() - INTERVAL '30 days' THEN e.id END) as total_active_evaluatees,
    AVG(pt.vo2_max) as global_avg_vo2_max,
    AVG(pt.cooper_distance) as global_avg_cooper_distance,
    AVG(pt.body_fat_percentage) as global_avg_body_fat_percentage,
    AVG(pt.muscle_mass) as global_avg_muscle_mass,
    AVG(EXTRACT(YEAR FROM AGE(e.birth_date))) as global_avg_age,
    COUNT(CASE WHEN e.gender = 'masculino' THEN 1 END) as male_count,
    COUNT(CASE WHEN e.gender = 'feminino' THEN 1 END) as female_count,
    COUNT(CASE WHEN e.gender NOT IN ('masculino', 'feminino') THEN 1 END) as other_gender_count,
    COUNT(CASE WHEN pt.created_at >= NOW() - INTERVAL '30 days' THEN pt.id END) as recent_evaluations_count,
    AVG(CASE WHEN pt.created_at >= NOW() - INTERVAL '30 days' THEN pt.vo2_max END) as recent_avg_vo2_max,
    AVG(CASE WHEN pt.created_at >= NOW() - INTERVAL '30 days' THEN pt.cooper_distance END) as recent_avg_cooper_distance
  INTO global_stats
  FROM performance_tests pt
  JOIN evaluatees e ON pt.evaluatee_id = e.id
  WHERE e.user_id = p_user_id;

  -- Encontrar melhor VO2 Max
  SELECT pt.vo2_max, e.id as evaluatee_id
  INTO best_vo2_record
  FROM performance_tests pt
  JOIN evaluatees e ON pt.evaluatee_id = e.id
  WHERE e.user_id = p_user_id AND pt.vo2_max IS NOT NULL
  ORDER BY pt.vo2_max DESC
  LIMIT 1;

  -- Encontrar melhor distância Cooper
  SELECT pt.cooper_distance, e.id as evaluatee_id
  INTO best_cooper_record
  FROM performance_tests pt
  JOIN evaluatees e ON pt.evaluatee_id = e.id
  WHERE e.user_id = p_user_id AND pt.cooper_distance IS NOT NULL
  ORDER BY pt.cooper_distance DESC
  LIMIT 1;

  -- Inserir ou atualizar estatísticas globais
  INSERT INTO performance_global_stats (
    user_id, total_evaluations, total_evaluatees, total_active_evaluatees,
    global_avg_vo2_max, global_avg_cooper_distance, global_avg_body_fat_percentage,
    global_avg_muscle_mass, global_avg_age, male_count, female_count, other_gender_count,
    best_vo2_max, best_cooper_distance, best_vo2_max_evaluatee_id, best_cooper_distance_evaluatee_id,
    recent_evaluations_count, recent_avg_vo2_max, recent_avg_cooper_distance, last_calculation
  )
  VALUES (
    p_user_id, global_stats.total_evaluations, global_stats.total_evaluatees, global_stats.total_active_evaluatees,
    global_stats.global_avg_vo2_max, global_stats.global_avg_cooper_distance, global_stats.global_avg_body_fat_percentage,
    global_stats.global_avg_muscle_mass, global_stats.global_avg_age, global_stats.male_count, 
    global_stats.female_count, global_stats.other_gender_count, best_vo2_record.vo2_max, 
    best_cooper_record.cooper_distance, best_vo2_record.evaluatee_id, best_cooper_record.evaluatee_id,
    global_stats.recent_evaluations_count, global_stats.recent_avg_vo2_max, global_stats.recent_avg_cooper_distance,
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_evaluations = EXCLUDED.total_evaluations,
    total_evaluatees = EXCLUDED.total_evaluatees,
    total_active_evaluatees = EXCLUDED.total_active_evaluatees,
    global_avg_vo2_max = EXCLUDED.global_avg_vo2_max,
    global_avg_cooper_distance = EXCLUDED.global_avg_cooper_distance,
    global_avg_body_fat_percentage = EXCLUDED.global_avg_body_fat_percentage,
    global_avg_muscle_mass = EXCLUDED.global_avg_muscle_mass,
    global_avg_age = EXCLUDED.global_avg_age,
    male_count = EXCLUDED.male_count,
    female_count = EXCLUDED.female_count,
    other_gender_count = EXCLUDED.other_gender_count,
    best_vo2_max = EXCLUDED.best_vo2_max,
    best_cooper_distance = EXCLUDED.best_cooper_distance,
    best_vo2_max_evaluatee_id = EXCLUDED.best_vo2_max_evaluatee_id,
    best_cooper_distance_evaluatee_id = EXCLUDED.best_cooper_distance_evaluatee_id,
    recent_evaluations_count = EXCLUDED.recent_evaluations_count,
    recent_avg_vo2_max = EXCLUDED.recent_avg_vo2_max,
    recent_avg_cooper_distance = EXCLUDED.recent_avg_cooper_distance,
    last_calculation = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas quando um teste é inserido/atualizado
CREATE OR REPLACE FUNCTION update_performance_stats()
RETURNS TRIGGER AS $$
DECLARE
  evaluatee_record RECORD;
  age_group_val TEXT;
BEGIN
  -- Buscar informações do avaliando
  SELECT e.user_id, e.birth_date
  INTO evaluatee_record
  FROM evaluatees e
  WHERE e.id = COALESCE(NEW.evaluatee_id, OLD.evaluatee_id);

  -- Calcular faixa etária
  age_group_val := calculate_age_group(evaluatee_record.birth_date);

  -- Recalcular estatísticas por faixa etária
  IF age_group_val IS NOT NULL THEN
    PERFORM recalculate_age_group_stats(evaluatee_record.user_id, age_group_val);
  END IF;

  -- Recalcular estatísticas globais
  PERFORM recalculate_global_stats(evaluatee_record.user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualização automática
CREATE TRIGGER trigger_update_performance_stats_insert
  AFTER INSERT ON performance_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_performance_stats();

CREATE TRIGGER trigger_update_performance_stats_update
  AFTER UPDATE ON performance_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_performance_stats();

CREATE TRIGGER trigger_update_performance_stats_delete
  AFTER DELETE ON performance_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_performance_stats();

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_performance_age_groups_updated_at
  BEFORE UPDATE ON performance_age_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_performance_global_stats_updated_at
  BEFORE UPDATE ON performance_global_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Configurar Row Level Security (RLS)
ALTER TABLE performance_age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_global_stats ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para performance_age_groups
CREATE POLICY "Users can view their own age group stats" ON performance_age_groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own age group stats" ON performance_age_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own age group stats" ON performance_age_groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own age group stats" ON performance_age_groups
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para performance_global_stats
CREATE POLICY "Users can view their own global stats" ON performance_global_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own global stats" ON performance_global_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own global stats" ON performance_global_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own global stats" ON performance_global_stats
  FOR DELETE USING (auth.uid() = user_id);

-- Criar índices para otimização
CREATE INDEX idx_performance_age_groups_user_id ON performance_age_groups(user_id);
CREATE INDEX idx_performance_age_groups_age_group ON performance_age_groups(age_group);
CREATE INDEX idx_performance_age_groups_last_updated ON performance_age_groups(last_updated);

CREATE INDEX idx_performance_global_stats_user_id ON performance_global_stats(user_id);
CREATE INDEX idx_performance_global_stats_last_calculation ON performance_global_stats(last_calculation);

-- Índices para otimizar consultas de performance_tests
CREATE INDEX IF NOT EXISTS idx_performance_tests_evaluatee_id ON performance_tests(evaluatee_id);
CREATE INDEX IF NOT EXISTS idx_performance_tests_created_at ON performance_tests(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_tests_vo2_max ON performance_tests(vo2_max) WHERE vo2_max IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_performance_tests_cooper_distance ON performance_tests(cooper_distance) WHERE cooper_distance IS NOT NULL;

-- Índices para otimizar consultas de evaluatees
CREATE INDEX IF NOT EXISTS idx_evaluatees_user_id ON evaluatees(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluatees_birth_date ON evaluatees(birth_date);
CREATE INDEX IF NOT EXISTS idx_evaluatees_gender ON evaluatees(gender);