import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("todolish_user_id")?.value || null;
}

// GET — list user's templates
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ templates: [] });
    }
    const { data, error } = await getAdmin()
      .from("todo_templates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ templates: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — save a new template
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    const body = await req.json();
    const { title, description, location, priority, points_reward } = body;
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const { data, error } = await getAdmin()
      .from("todo_templates")
      .insert({
        user_id: userId,
        title,
        description: description || null,
        location: location || null,
        priority: priority ?? 1,
        points_reward: Math.min(100, Math.max(1, points_reward ?? 5)),
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ template: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove a template
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const { error } = await getAdmin()
      .from("todo_templates")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
