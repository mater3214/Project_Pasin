-- Todolish v2.0 Migration
-- Run this in Supabase SQL Editor

-- Add registration & profile fields to users table
ALTER TABLE users ALTER COLUMN line_user_id DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS web_user_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Make line_user_id nullable (web-only users won't have it initially)
-- Already done above with DROP NOT NULL

-- Update the unique constraint to allow null line_user_id
-- (Supabase/Postgres allows multiple NULLs in UNIQUE columns by default)
