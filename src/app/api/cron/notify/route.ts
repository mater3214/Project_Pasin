import { NextRequest, NextResponse } from "next/server";
import { getUpcomingNotifications, markNotified } from "@/lib/supabase";
import { pushMessage } from "@/lib/line";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const todos = await getUpcomingNotifications();
    let sent = 0;

    for (const todo of todos) {
      const lineUserId = (todo as any).users?.line_user_id || (todo as any).user_line_id;
      if (!lineUserId) continue;

      await pushMessage(
        lineUserId,
        `⏰ อีก 15 นาที ถึงเวลาทำ: ${(todo as any).title}`
      );
      await markNotified((todo as any).id);
      sent++;
    }

    return NextResponse.json({ success: true, sent });
  } catch (error: any) {
    console.error("Cron notify error:", error);
    return NextResponse.json(
      { error: error.message || "Cron failed" },
      { status: 500 }
    );
  }
}
