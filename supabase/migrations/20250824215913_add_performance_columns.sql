-- Adicionar colunas faltantes na tabela performance_tests

-- Adicionar colunas de métricas de performance
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS speed DECIMAL;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS agility DECIMAL;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS strength DECIMAL;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS endurance DECIMAL;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS flexibility DECIMAL;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS coordination DECIMAL;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS balance DECIMAL;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS power DECIMAL;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS reaction_time DECIMAL;

-- Adicionar colunas de medidas corporais se não existirem
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS weight DECIMAL;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS height DECIMAL;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS body_fat_percentage DECIMAL;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS muscle_mass DECIMAL;

-- Adicionar colunas cardiovasculares se não existirem
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS max_heart_rate INTEGER;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS blood_pressure_systolic INTEGER;
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS blood_pressure_diastolic INTEGER;

-- Adicionar colunas de flexibilidade se não existirem
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS shoulder_flexibility TEXT;

-- Adicionar coluna test_type se não existir
ALTER TABLE performance_tests ADD COLUMN IF NOT EXISTS test_type TEXT;

-- Comentários para documentação
COMMENT ON COLUMN performance_tests.speed IS 'Métrica de velocidade do atleta';
COMMENT ON COLUMN performance_tests.agility IS 'Métrica de agilidade do atleta';
COMMENT ON COLUMN performance_tests.strength IS 'Métrica de força do atleta';
COMMENT ON COLUMN performance_tests.endurance IS 'Métrica de resistência do atleta';
COMMENT ON COLUMN performance_tests.flexibility IS 'Métrica de flexibilidade do atleta';
COMMENT ON COLUMN performance_tests.coordination IS 'Métrica de coordenação do atleta';
COMMENT ON COLUMN performance_tests.balance IS 'Métrica de equilíbrio do atleta';
COMMENT ON COLUMN performance_tests.power IS 'Métrica de potência do atleta';
COMMENT ON COLUMN performance_tests.reaction_time IS 'Tempo de reação do atleta em milissegundos';
COMMENT ON COLUMN performance_tests.test_type IS 'Tipo do teste realizado (cooper, strength, flexibility, etc.)';