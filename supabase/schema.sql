-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  picture_url TEXT,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  points_reward INTEGER NOT NULL DEFAULT 5,
  is_notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create todo_logs table
CREATE TABLE IF NOT EXISTS todo_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for users
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_service" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS policies for todos
CREATE POLICY "todos_select_own" ON todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "todos_insert_own" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "todos_update_own" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "todos_delete_own" ON todos
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for todo_logs
CREATE POLICY "logs_select_own" ON todo_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "logs_insert_own" ON todo_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to increment points
CREATE OR REPLACE FUNCTION increment_points(amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN amount;
END;
$$ LANGUAGE plpgsql;
