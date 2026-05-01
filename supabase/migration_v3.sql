-- Todolish v3.0 Migration
-- Run this in Supabase SQL Editor

-- 1) Add location column to todos
ALTER TABLE todos ADD COLUMN IF NOT EXISTS location TEXT;

-- 2) Remove the CHECK constraint on points_reward if exists, allow custom points 1-100
-- (The old default was 5, now users can set 1-100)
ALTER TABLE todos ALTER COLUMN points_reward SET DEFAULT 5;

-- 3) Create todo_templates table for saved templates
CREATE TABLE IF NOT EXISTS todo_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
  points_reward INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for todo_templates
ALTER TABLE todo_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for todo_templates (using service role key, so these are mainly for direct access)
CREATE POLICY "templates_select_own" ON todo_templates FOR SELECT USING (true);
CREATE POLICY "templates_insert_own" ON todo_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "templates_delete_own" ON todo_templates FOR DELETE USING (true);
