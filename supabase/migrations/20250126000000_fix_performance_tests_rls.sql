-- Fix RLS policies for performance_tests table
-- This migration ensures proper Row Level Security is enforced

-- First, ensure RLS is enabled
ALTER TABLE public.performance_tests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own performance tests" ON public.performance_tests;
DROP POLICY IF EXISTS "Users can insert own performance tests" ON public.performance_tests;
DROP POLICY IF EXISTS "Users can update own performance tests" ON public.performance_tests;
DROP POLICY IF EXISTS "Users can delete own performance tests" ON public.performance_tests;

-- Create proper RLS policies
CREATE POLICY "Users can view own performance tests" ON public.performance_tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance tests" ON public.performance_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance tests" ON public.performance_tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own performance tests" ON public.performance_tests
  FOR DELETE USING (auth.uid() = user_id);

-- Verify RLS is working by checking if policies exist
DO $$
BEGIN
  -- Check if all required policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'performance_tests' 
    AND schemaname = 'public'
    AND policyname IN (
      'Users can view own performance tests',
      'Users can insert own performance tests', 
      'Users can update own performance tests',
      'Users can delete own performance tests'
    )
    GROUP BY tablename
    HAVING COUNT(*) = 4
  ) THEN
    RAISE EXCEPTION 'RLS policies were not created correctly for performance_tests table';
  END IF;
  
  RAISE NOTICE 'RLS policies for performance_tests table have been successfully created';
END $$;