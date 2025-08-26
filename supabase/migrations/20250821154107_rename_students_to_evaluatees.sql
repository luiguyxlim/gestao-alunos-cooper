-- Migration: Rename students table to evaluatees
-- This script renames the students table to evaluatees and updates all related constraints and indexes

BEGIN;

-- Rename the table
ALTER TABLE students RENAME TO evaluatees;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view all students" ON evaluatees;
DROP POLICY IF EXISTS "Users can insert students" ON evaluatees;
DROP POLICY IF EXISTS "Users can update students" ON evaluatees;
DROP POLICY IF EXISTS "Users can delete students" ON evaluatees;

-- Recreate RLS policies with new names
CREATE POLICY "Users can view all evaluatees" ON evaluatees
    FOR SELECT USING (true);

CREATE POLICY "Users can insert evaluatees" ON evaluatees
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update evaluatees" ON evaluatees
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete evaluatees" ON evaluatees
    FOR DELETE USING (true);

-- Update the performance_tests table foreign key constraint
ALTER TABLE performance_tests 
DROP CONSTRAINT IF EXISTS performance_tests_student_id_fkey;

ALTER TABLE performance_tests 
ADD CONSTRAINT performance_tests_evaluatee_id_fkey 
FOREIGN KEY (student_id) REFERENCES evaluatees(id) ON DELETE CASCADE;

-- Note: We keep the column name as student_id for now to avoid breaking the application
-- This will be updated in the code refactoring phase

COMMIT;