import { createClient } from "@supabase/supabase-js";
import { Todo, User, TodoLog, RankUser, DashboardStats } from "@/types";

function getClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase URL or Anon Key");
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

export function getAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase URL or Service Role Key");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export async function getUserByLineId(lineUserId: string): Promise<User | null> {
  const { data, error } = await getAdmin()
    .from("users")
    .select("*")
    .eq("line_user_id", lineUserId)
    .single();
  if (error) return null;
  return data as User;
}

export async function createUser(user: Partial<User>): Promise<User | null> {
  const { data, error } = await getAdmin()
    .from("users")
    .insert(user)
    .select()
    .single();
  if (error) {
    console.error("createUser error:", error);
    return null;
  }
  return data as User;
}

export async function getTodosByUser(userId: string): Promise<Todo[]> {
  const { data, error } = await getAdmin()
    .from("todos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getTodosByUser error:", error);
    return [];
  }
  return (data as Todo[]) ?? [];
}

export async function createTodo(todo: Partial<Todo>): Promise<Todo | null> {
  const { data, error } = await getAdmin()
    .from("todos")
    .insert(todo)
    .select()
    .single();
  if (error) {
    console.error("createTodo error:", error);
    return null;
  }
  return data as Todo;
}

export async function updateTodo(
  id: string,
  updates: Partial<Todo>
): Promise<Todo | null> {
  const { data, error } = await getAdmin()
    .from("todos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("updateTodo error:", error);
    return null;
  }
  return data as Todo;
}

export async function deleteTodo(id: string): Promise<boolean> {
  const { error } = await getAdmin().from("todos").delete().eq("id", id);
  if (error) {
    console.error("deleteTodo error:", error);
    return false;
  }
  return true;
}

export async function completeTodo(
  id: string,
  userId: string,
  points: number
): Promise<Todo | null> {
  const todo = await updateTodo(id, { status: "completed" });
  if (!todo) return null;

  await getAdmin()
    .from("users")
    .update({ total_points: getAdmin().rpc("increment_points", { amount: points }) })
    .eq("id", userId);

  await getAdmin().from("todo_logs").insert({
    todo_id: id,
    user_id: userId,
    action: `completed (+${points}pts)`,
  });

  return todo;
}

export async function getLeaderboard(): Promise<RankUser[]> {
  const { data, error } = await getAdmin()
    .from("users")
    .select("id, display_name, picture_url, total_points, todos(count)")
    .order("total_points", { ascending: false })
    .limit(50);
  if (error) {
    console.error("getLeaderboard error:", error);
    return [];
  }
  return (data as any[]).map((u) => ({
    id: u.id,
    display_name: u.display_name,
    picture_url: u.picture_url,
    total_points: u.total_points,
    completed_count: u.todos?.[0]?.count ?? 0,
  })) as RankUser[];
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const { data: todos, error } = await getAdmin()
    .from("todos")
    .select("status")
    .eq("user_id", userId);
  if (error || !todos) {
    return { total: 0, completed: 0, pending: 0, totalPoints: 0 };
  }
  const total = todos.length;
  const completed = todos.filter((t: { status: string }) => t.status === "completed").length;
  const pending = total - completed;

  const { data: user } = await getAdmin()
    .from("users")
    .select("total_points")
    .eq("id", userId)
    .single();

  return {
    total,
    completed,
    pending,
    totalPoints: user?.total_points ?? 0,
  };
}

export async function getUpcomingNotifications(): Promise<Todo[]> {
  const now = new Date();
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60000);

  const { data, error } = await getAdmin()
    .from("todos")
    .select("*, users!inner(line_user_id)")
    .eq("status", "pending")
    .eq("is_notified", false)
    .gte("due_date", now.toISOString())
    .lte("due_date", twentyFourHoursLater.toISOString());

  if (error) {
    console.error("getUpcomingNotifications error:", error);
    return [];
  }
  return (data as any[]).map((d) => ({
    ...d,
    user_line_id: d.users?.line_user_id,
  })) as any;
}

export async function markNotified(todoId: string): Promise<void> {
  await getAdmin().from("todos").update({ is_notified: true }).eq("id", todoId);
}
