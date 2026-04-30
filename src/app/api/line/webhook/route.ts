import { NextRequest, NextResponse } from "next/server";
import { validateSignature } from "@line/bot-sdk";
import {
  getUserByLineId,
  createUser,
  getTodosByUser,
  createTodo,
  deleteTodo,
  updateTodo,
  getDashboardStats,
  getAdmin,
} from "@/lib/supabase";
import { getUserProfile, replyMessage, pushMessage, parseCommand } from "@/lib/line";
import { Todo } from "@/types";

type WebhookEvent = {
  type: string;
  source: { userId: string };
  replyToken?: string;
  message?: { type: string; text: string };
};

const channelSecret = process.env.LINE_CHANNEL_SECRET!;

async function handleEvent(event: WebhookEvent) {
  if (event.type !== "message" || !event.message || event.message.type !== "text") {
    if (event.type === "follow") {
      const profile = await getUserProfile(event.source.userId);
      if (!profile) return;
      let user = await getUserByLineId(event.source.userId);
      if (!user) {
        user = await createUser({
          line_user_id: event.source.userId,
          display_name: profile.displayName,
          picture_url: profile.pictureUrl,
          total_points: 0,
        });
      }
      await pushMessage(
        event.source.userId,
        `ยินดีต้อนรับ ${profile.displayName}! พิมพ์ "ช่วยเหลือ" เพื่อดูวิธีใช้งาน`
      );
    }
    return;
  }

  const userId = event.source.userId;
  const text = event.message.text;
  const replyToken = event.replyToken;

  if (!replyToken) return;

  let dbUser = await getUserByLineId(userId);

  if (!dbUser) {
    const profile = await getUserProfile(userId);
    if (!profile) return;
    dbUser = await createUser({
      line_user_id: userId,
      display_name: profile.displayName,
      picture_url: profile.pictureUrl,
      total_points: 0,
    });
  }

  if (!dbUser) return;

  const { command, args } = parseCommand(text);

  const reply = async (msg: string) => {
    await replyMessage(replyToken, msg);
  };

  switch (command) {
    case "เพิ่ม":
    case "add": {
      if (!args) {
        await reply("ใช้: เพิ่ม [ชื่อรายการ] หรือ add [ชื่อ]");
        return;
      }
      const priority = args.includes("!สูง")
        ? 3
        : args.includes("!กลาง")
        ? 2
        : 1;
      const title = args.replace(/ !สูง| !กลาง| !ต่ำ/g, "").trim();
      const points = priority * 5;
      const todo = await createTodo({
        user_id: dbUser.id,
        title,
        priority,
        points_reward: points,
      });
      if (todo) {
        await reply(`เพิ่มรายการ "${title}" เรียบร้อย (Priority: ${priority}, +${points}pts)`);
      } else {
        await reply("เพิ่มรายการไม่สำเร็จ กรุณาลองใหม่");
      }
      break;
    }

    case "ลบ":
    case "delete": {
      if (!args) {
        await reply("ใช้: ลบ [เลข] หรือ delete [id]");
        return;
      }
      const todos = await getTodosByUser(dbUser.id);
      const idx = parseInt(args, 10);
      if (isNaN(idx) || idx < 1 || idx > todos.length) {
        await reply(`ไม่พบรายการที่ ${idx} ในรายการของคุณ (มี ${todos.length} รายการ)`);
        return;
      }
      const target = todos[idx - 1];
      const success = await deleteTodo(target.id);
      if (success) {
        await reply(`ลบรายการ "${target.title}" เรียบร้อย`);
      } else {
        await reply("ลบรายการไม่สำเร็จ");
      }
      break;
    }

    case "รายการ":
    case "list": {
      const todos = await getTodosByUser(dbUser.id);
      if (todos.length === 0) {
        await reply("คุณยังไม่มีรายการที่ต้องทำ");
        return;
      }
      const list = todos
        .map((t: Todo, i: number) => {
          const status = t.status === "completed" ? "[x]" : "[ ]";
          const pri = "!".repeat(t.priority);
          return `${i + 1}. ${status} ${t.title} ${pri}`;
        })
        .join("\n");
      await reply(`รายการของคุณ:\n${list}`);
      break;
    }

    case "เช็ค":
    case "done": {
      if (!args) {
        await reply("ใช้: เช็ค [เลข] หรือ done [id]");
        return;
      }
      const todos = await getTodosByUser(dbUser.id);
      const idx = parseInt(args, 10);
      if (isNaN(idx) || idx < 1 || idx > todos.length) {
        await reply(`ไม่พบรายการที่ ${idx}`);
        return;
      }
      const target = todos[idx - 1];
      if (target.status === "completed") {
        await reply(`รายการ "${target.title}" เสร็จสิ้นไปแล้ว`);
        return;
      }
      await updateTodo(target.id, { status: "completed" });
      await getAdmin()
        .from("users")
        .update({ total_points: dbUser.total_points + target.points_reward })
        .eq("id", dbUser.id);
      await getAdmin().from("todo_logs").insert({
        todo_id: target.id,
        user_id: dbUser.id,
        action: `completed (+${target.points_reward}pts)`,
      });
      await reply(
        `เยี่ยมมาก! ทำ "${target.title}" เสร็จแล้ว\n+${target.points_reward} คะแนน (รวม ${dbUser.total_points + target.points_reward} pts)`
      );
      break;
    }

    case "คะแนน":
    case "point": {
      const stats = await getDashboardStats(dbUser.id);
      await reply(
        `คะแนนรวมของคุณ: ${stats.totalPoints} pts\nเสร็จแล้ว: ${stats.completed} / ${stats.total} รายการ`
      );
      break;
    }

    case "ช่วยเหลือ":
    case "help": {
      await reply(
        `คำสั่งที่ใช้ได้:\n` +
          `เพิ่ม [ชื่อ] - สร้าง Todo\n` +
          `ลบ [เลข] - ลบรายการ\n` +
          `รายการ - ดูรายการทั้งหมด\n` +
          `เช็ค [เลข] - ทำเครื่องหมายเสร็จ\n` +
          `คะแนน - ดูคะแนนรวม\n` +
          `ช่วยเหลือ - แสดงวิธีใช้`
      );
      break;
    }

    default: {
      await reply('ไม่เข้าใจคำสั่ง พิมพ์ "ช่วยเหลือ" เพื่อดูวิธีใช้');
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature") || "";

    if (!validateSignature(body, channelSecret, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const events = JSON.parse(body).events as WebhookEvent[];
    await Promise.all(events.map(handleEvent));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("LINE webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook error" },
      { status: 500 }
    );
  }
}
