import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/supabase";

export async function GET() {
  try {
    const users = await getLeaderboard();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
