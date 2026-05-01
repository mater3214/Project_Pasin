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
  registerWebUser,
  linkLineAccount,
} from "@/lib/supabase";
import {
  getUserProfile,
  replyMessage,
  replyFlexMessage,
  pushFlexMessage,
  parseCommand,
  buildWelcomeFlex,
  buildCredentialsFlex,
  buildMenuFlex,
  buildNeedRegisterFlex,
} from "@/lib/line";
import { Todo } from "@/types";

type WebhookEvent = {
  type: string;
  source: { userId: string };
  replyToken?: string;
  message?: { type: string; text: string };
};

const channelSecret = process.env.LINE_CHANNEL_SECRET!;

async function handleEvent(event: WebhookEvent) {
  // ─── Follow Event: Welcome + prompt registration ───
  if (event.type === "follow") {
    const profile = await getUserProfile(event.source.userId);
    if (!profile) return;

    // Create a basic user record (without web credentials)
    let user = await getUserByLineId(event.source.userId);
    if (!user) {
      user = await createUser({
        line_user_id: event.source.userId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl,
        total_points: 0,
      });
    }

    // Send Flex welcome message prompting registration
    await pushFlexMessage(
      event.source.userId,
      "ยินดีต้อนรับสู่ Todolish!",
      buildWelcomeFlex(profile.displayName)
    );
    return;
  }

  // Only handle text messages
  if (event.type !== "message" || !event.message || event.message.type !== "text") {
    return;
  }

  const lineUserId = event.source.userId;
  const text = event.message.text;
  const replyToken = event.replyToken;

  if (!replyToken) return;

  // Get or create basic user
  let dbUser = await getUserByLineId(lineUserId);

  if (!dbUser) {
    const profile = await getUserProfile(lineUserId);
    if (!profile) return;
    dbUser = await createUser({
      line_user_id: lineUserId,
      display_name: profile.displayName,
      picture_url: profile.pictureUrl,
      total_points: 0,
    });
  }

  if (!dbUser) return;

  const { command, args } = parseCommand(text);

  // ─── Registration command (always available) ───
  if (command === "สมัคร" || command === "register") {
    const parts = args.split(/\s+/);
    const name = parts[0];
    const phone = parts[1];

    if (!name || !phone) {
      await replyMessage(replyToken, "ใช้: สมัคร [ชื่อ] [เบอร์โทร]\nตัวอย่าง: สมัคร สมชาย 0891234567");
      return;
    }

    // Already registered?
    if (dbUser.web_user_id) {
      await replyFlexMessage(replyToken, "คุณมีบัญชีแล้ว", buildCredentialsFlex(
        dbUser.display_name,
        dbUser.web_user_id,
        "(ใช้ password เดิม)"
      ));
      return;
    }

    const result = await registerWebUser(name, phone);
    if (result) {
      // Link LINE account to new web user
      await linkLineAccount(result.user.id, lineUserId);
      // Remove old orphan record if different
      if (dbUser.id !== result.user.id) {
        await getAdmin()
          .from("users")
          .delete()
          .eq("id", dbUser.id)
          .neq("id", result.user.id);
      }

      // Send beautiful Flex Message with credentials
      await replyFlexMessage(
        replyToken,
        "สมัครสำเร็จ!",
        buildCredentialsFlex(name, result.webUserId, result.password)
      );
    } else {
      await replyMessage(replyToken, "สมัครไม่สำเร็จ กรุณาลองใหม่");
    }
    return;
  }

  // ─── Block all other commands if not registered ───
  if (!dbUser.web_user_id) {
    await replyFlexMessage(replyToken, "กรุณาสมัครสมาชิกก่อน", buildNeedRegisterFlex());
    return;
  }

  // ─── Registered user commands ───
  switch (command) {
    case "เพิ่ม":
    case "add": {
      if (!args) {
        await replyMessage(replyToken, "ใช้: เพิ่ม [ชื่อรายการ]\nตัวอย่าง: เพิ่ม ซื้อของ !สูง");
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
        await replyMessage(
          replyToken,
          `✅ เพิ่มรายการ "${title}" เรียบร้อย\nPriority: ${"⭐".repeat(priority)} | +${points} pts`
        );
      } else {
        await replyMessage(replyToken, "❌ เพิ่มรายการไม่สำเร็จ กรุณาลองใหม่");
      }
      break;
    }

    case "ลบ":
    case "delete": {
      if (!args) {
        await replyMessage(replyToken, "ใช้: ลบ [เลข]\nตัวอย่าง: ลบ 1");
        return;
      }
      const todos = await getTodosByUser(dbUser.id);
      const idx = parseInt(args, 10);
      if (isNaN(idx) || idx < 1 || idx > todos.length) {
        await replyMessage(replyToken, `❌ ไม่พบรายการที่ ${idx} (มี ${todos.length} รายการ)`);
        return;
      }
      const target = todos[idx - 1];
      const success = await deleteTodo(target.id);
      if (success) {
        await replyMessage(replyToken, `🗑️ ลบรายการ "${target.title}" เรียบร้อย`);
      } else {
        await replyMessage(replyToken, "❌ ลบรายการไม่สำเร็จ");
      }
      break;
    }

    case "รายการ":
    case "list": {
      const todos = await getTodosByUser(dbUser.id);
      if (todos.length === 0) {
        await replyMessage(replyToken, "📋 คุณยังไม่มีรายการ\nพิมพ์ \"เพิ่ม [ชื่อ]\" เพื่อสร้างรายการใหม่");
        return;
      }
      const list = todos
        .map((t: Todo, i: number) => {
          const status = t.status === "completed" ? "✅" : "⬜";
          const pri = t.priority === 3 ? "🔴" : t.priority === 2 ? "🟡" : "🟢";
          return `${i + 1}. ${status} ${t.title} ${pri} +${t.points_reward}pts`;
        })
        .join("\n");
      await replyMessage(replyToken, `📋 รายการของคุณ:\n\n${list}`);
      break;
    }

    case "เช็ค":
    case "done": {
      if (!args) {
        await replyMessage(replyToken, "ใช้: เช็ค [เลข]\nตัวอย่าง: เช็ค 1");
        return;
      }
      const todos = await getTodosByUser(dbUser.id);
      const idx = parseInt(args, 10);
      if (isNaN(idx) || idx < 1 || idx > todos.length) {
        await replyMessage(replyToken, `❌ ไม่พบรายการที่ ${idx}`);
        return;
      }
      const target = todos[idx - 1];
      if (target.status === "completed") {
        await replyMessage(replyToken, `✅ "${target.title}" เสร็จสิ้นไปแล้ว`);
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
      await replyMessage(
        replyToken,
        `🎉 ทำ "${target.title}" เสร็จแล้ว!\n+${target.points_reward} คะแนน\n\n⭐ คะแนนรวม: ${dbUser.total_points + target.points_reward} pts`
      );
      break;
    }

    case "คะแนน":
    case "point": {
      const stats = await getDashboardStats(dbUser.id);
      await replyMessage(
        replyToken,
        `⭐ คะแนนรวม: ${stats.totalPoints} pts\n✅ เสร็จแล้ว: ${stats.completed}/${stats.total} รายการ`
      );
      break;
    }

    case "ช่วยเหลือ":
    case "help": {
      await replyFlexMessage(replyToken, "คำสั่ง Todolish", buildMenuFlex());
      break;
    }

    case "บัญชี":
    case "account": {
      await replyFlexMessage(replyToken, "บัญชีของคุณ", buildCredentialsFlex(
        dbUser.display_name,
        dbUser.web_user_id || "(ไม่มี)",
        "(ใช้ password เดิม)"
      ));
      break;
    }

    default: {
      await replyFlexMessage(replyToken, "กรุณาสมัครหรือดูวิธีใช้", buildMenuFlex());
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
