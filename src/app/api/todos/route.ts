import { NextRequest, NextResponse } from "next/server";
import {
  getTodosByUser,
  createTodo,
  updateTodo,
  deleteTodo,
  getDashboardStats,
  getAdmin,
} from "@/lib/supabase";
import { TodoPriority } from "@/types";

// Helper: resolve "demo-user" to a real UUID from the database
async function resolveUserId(rawId: string | null): Promise<string | null> {
  if (!rawId) return null;
  if (rawId === "demo-user") {
    const admin = getAdmin();
    // Try to find existing demo user
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("line_user_id", "demo-user")
      .single();
    if (existing) return existing.id;
    // Create demo user if not exists
    const { data: created, error } = await admin
      .from("users")
      .insert({
        line_user_id: "demo-user",
        display_name: "Demo User",
        total_points: 0,
      })
      .select("id")
      .single();
    if (error) {
      console.error("Failed to create demo user:", error);
      return null;
    }
    return created?.id ?? null;
  }
  return rawId;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUserId = searchParams.get("userId");
  const stats = searchParams.get("stats");

  try {
    if (stats === "true") {
      // Global stats for home page
      if (!rawUserId) {
        const { data, error } = await getAdmin()
          .from("todos")
          .select("status");
        if (error) throw error;
        const completed = (data || []).filter(
          (t: { status: string }) => t.status === "completed"
        ).length;
        return NextResponse.json({ totalCompleted: completed });
      }
      const userId = await resolveUserId(rawUserId);
      if (!userId) {
        return NextResponse.json(
          { error: "Could not resolve user" },
          { status: 400 }
        );
      }
      const dashboardStats = await getDashboardStats(userId);
      return NextResponse.json(dashboardStats);
    }

    const userId = await resolveUserId(rawUserId);
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const todos = await getTodosByUser(userId);
    return NextResponse.json({ todos });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch todos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, title, description, location, priority, due_date, points_reward } =
      body;

    if (!user_id || !title) {
      return NextResponse.json(
        { error: "user_id and title are required" },
        { status: 400 }
      );
    }

    const resolvedUserId = await resolveUserId(user_id);
    if (!resolvedUserId) {
      return NextResponse.json(
        { error: "Could not resolve user" },
        { status: 400 }
      );
    }

    const insertData: any = {
      user_id: resolvedUserId,
      title,
      description,
      priority: (priority as TodoPriority) ?? 1,
      due_date: due_date ? new Date(due_date).toISOString() : undefined,
      points_reward: Math.max(1, points_reward ?? 25),
    };
    if (location) insertData.location = location;

    const todo = await createTodo(insertData);

    return NextResponse.json({ todo });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create todo" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status, title, description, priority, due_date } = body;

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date;

    // If status is changing, handle points
    if (status !== undefined) {
      // Get current todo to check old status and get points_reward
      const { data: currentTodo } = await getAdmin()
        .from("todos")
        .select("status, points_reward, user_id")
        .eq("id", id)
        .single();

      if (currentTodo && currentTodo.status !== status) {
        // Get user's current points
        const { data: userData } = await getAdmin()
          .from("users")
          .select("total_points")
          .eq("id", currentTodo.user_id)
          .single();

        if (userData) {
          let newPoints = userData.total_points;
          if (status === "completed") {
            newPoints += currentTodo.points_reward;
          } else if (status === "pending" && currentTodo.status === "completed") {
            newPoints = Math.max(0, newPoints - currentTodo.points_reward);
          }

          await getAdmin()
            .from("users")
            .update({ total_points: newPoints })
            .eq("id", currentTodo.user_id);

          // Log the action
          if (status === "completed") {
            await getAdmin().from("todo_logs").insert({
              todo_id: id,
              user_id: currentTodo.user_id,
              action: `completed (+${currentTodo.points_reward}pts)`,
            });
          }
        }
      }
    }

    const todo = await updateTodo(id, updates);
    return NextResponse.json({ todo });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update todo" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const success = await deleteTodo(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete todo" },
      { status: 500 }
    );
  }
}
