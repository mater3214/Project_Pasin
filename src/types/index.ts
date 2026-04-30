export interface User {
  id: string;
  line_user_id: string;
  display_name: string;
  picture_url?: string;
  total_points: number;
  created_at: string;
}

export type TodoStatus = 'pending' | 'completed';
export type TodoPriority = 1 | 2 | 3;

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: TodoPriority;
  status: TodoStatus;
  points_reward: number;
  is_notified: boolean;
  created_at: string;
}

export interface TodoLog {
  id: string;
  todo_id: string;
  user_id: string;
  action: string;
  created_at: string;
}

export interface RankUser {
  id: string;
  display_name: string;
  picture_url?: string;
  total_points: number;
  completed_count: number;
}

export interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  totalPoints: number;
}
