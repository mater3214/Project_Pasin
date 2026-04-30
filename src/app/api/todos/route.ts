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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const stats = searchParams.get("stats");

  try {
    if (stats === "true") {
      // Global stats for home page
      if (!userId) {
        const { data, error } = await getAdmin()
          .from("todos")
          .select("status");
        if (error) throw error;
        const completed = (data || []).filter(
          (t: { status: string }) => t.status === "completed"
        ).length;
        return NextResponse.json({ totalCompleted: completed });
      }
      const dashboardStats = await getDashboardStats(userId);
      return NextResponse.json(dashboardStats);
    }

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
    const { user_id, title, description, priority, due_date, points_reward } =
      body;

    if (!user_id || !title) {
      return NextResponse.json(
        { error: "user_id and title are required" },
        { status: 400 }
      );
    }

    const todo = await createTodo({
      user_id,
      title,
      description,
      priority: (priority as TodoPriority) ?? 1,
      due_date: due_date ? new Date(due_date).toISOString() : undefined,
      points_reward: points_reward ?? (priority ?? 1) * 5,
    });

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
