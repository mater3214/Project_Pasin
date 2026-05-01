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
import {
  getUserProfile,
  replyMessage,
  replyFlexMessage,
  replyMultiMessage,
  parseCommand,
  buildWelcomeFlex,
  buildCredentialsFlex,
  buildMenuFlex,
  buildNeedRegisterFlex,
  buildAddSuccessFlex,
  buildMainQuickReply,
  buildPriorityQuickReply,
  buildCheckQuickReply,
  buildDeleteQuickReply,
} from "@/lib/line";
import { Todo } from "@/types";
import { createHash, randomBytes } from "crypto";

type WebhookEvent = {
  type: string;
  source: { userId: string };
  replyToken?: string;
  message?: { type: string; text: string };
};

const channelSecret = process.env.LINE_CHANNEL_SECRET!;

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function generateWebUserId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "TDL-";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function generatePassword(): string {
  return randomBytes(4).toString("hex");
}

// Priority map (Thai labels → priority number + points)
const PRIORITY_MAP: Record<string, { priority: number; points: number; icon: string; label: string }> = {
  "ต่ำ":     { priority: 1, points: 25,   icon: "💎", label: "ต่ำ" },
  "กลาง":   { priority: 2, points: 50,   icon: "⚡", label: "กลาง" },
  "สูง":     { priority: 3, points: 100,  icon: "🔥", label: "สูง" },
  "สูงมาก": { priority: 4, points: 200,  icon: "💥", label: "สูงมาก" },
  "สำคัญ":  { priority: 5, points: 1000, icon: "⭐", label: "สำคัญ" },
  // English aliases
  "low":      { priority: 1, points: 25,   icon: "💎", label: "ต่ำ" },
  "medium":   { priority: 2, points: 50,   icon: "⚡", label: "กลาง" },
  "high":     { priority: 3, points: 100,  icon: "🔥", label: "สูง" },
  "critical": { priority: 4, points: 200,  icon: "💥", label: "สูงมาก" },
  "urgent":   { priority: 5, points: 1000, icon: "⭐", label: "สำคัญ" },
};

const PRIORITY_BY_NUM: Record<number, { icon: string; label: string; points: number }> = {
  1: { icon: "💎", label: "ต่ำ", points: 25 },
  2: { icon: "⚡", label: "กลาง", points: 50 },
  3: { icon: "🔥", label: "สูง", points: 100 },
  4: { icon: "💥", label: "สูงมาก", points: 200 },
  5: { icon: "⭐", label: "สำคัญ", points: 1000 },
};

function parseDateText(text: string): string | undefined {
  if (!text.trim()) return undefined;
  const cleaned = text.trim().replace(/\//g, "-").replace(/\s+/g, " ");
  const match = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (match) {
    const [, dd, mm, yyyy, hh, min] = match;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${(hh||"23").padStart(2, "0")}:${min||"59"}:00`;
  }
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d.toISOString();
  return undefined;
}

async function handleEvent(event: WebhookEvent) {
  // ─── Follow Event ───
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

    if (event.replyToken) {
      await replyFlexMessage(event.replyToken, "ยินดีต้อนรับสู่ Todolish!", buildWelcomeFlex(profile.displayName));
    }
    return;
  }

  if (event.type !== "message" || !event.message || event.message.type !== "text") return;

  const lineUserId = event.source.userId;
  const text = event.message.text;
  const replyToken = event.replyToken;
  if (!replyToken) return;

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

  // ─── Registration (always available) ───
  if (command === "สมัคร" || command === "register") {
    const parts = args.split(/\s+/);
    const name = parts[0];
    const phone = parts[1];

    if (!name || !phone) {
      await replyMessage(replyToken, "ใช้: สมัคร [ชื่อ] [เบอร์โทร]\nตัวอย่าง: สมัคร สมชาย 0891234567");
      return;
    }

    if (dbUser.web_user_id) {
      await replyFlexMessage(replyToken, "คุณมีบัญชีแล้ว", buildCredentialsFlex(dbUser.display_name, dbUser.web_user_id, "(ใช้ password เดิม)"), buildMainQuickReply());
      return;
    }

    const webUserId = generateWebUserId();
    const password = generatePassword();
    const passwordHash = hashPassword(password);

    const { error } = await getAdmin()
      .from("users")
      .update({ display_name: name, phone, web_user_id: webUserId, password_hash: passwordHash })
      .eq("id", dbUser.id);

    if (error) {
      await replyMessage(replyToken, "สมัครไม่สำเร็จ กรุณาลองใหม่");
      return;
    }

    // Send credentials + menu with Quick Reply
    await replyMultiMessage(replyToken, [
      { type: "flex", altText: "สมัครสำเร็จ!", contents: buildCredentialsFlex(name, webUserId, password) },
      { type: "flex", altText: "คำสั่ง Todolish", contents: buildMenuFlex(), quickReply: buildMainQuickReply() },
    ]);
    return;
  }

  // ─── Block if not registered ───
  if (!dbUser.web_user_id) {
    await replyFlexMessage(replyToken, "กรุณาสมัครสมาชิกก่อน", buildNeedRegisterFlex());
    return;
  }

  // ─── Registered commands ───
  switch (command) {
    case "เพิ่ม":
    case "add": {
      if (!args) {
        // Guide: show format help + Quick Reply for easy title entry
        await replyMessage(
          replyToken,
          "➕ เพิ่มรายการใหม่\n\n" +
          "วิธีที่ 1 (ง่าย):\n" +
          "เพิ่ม ชื่อรายการ\n" +
          "→ จะให้เลือกความสำคัญ\n\n" +
          "วิธีที่ 2 (ละเอียด):\n" +
          "เพิ่ม ชื่อ | ความสำคัญ | รายละเอียด | สถานที่ | วันเวลา\n\n" +
          "ตัวอย่าง:\n" +
          "• เพิ่ม ซื้อของ\n" +
          "• เพิ่ม ประชุม | สูง\n" +
          "• เพิ่ม ส่งงาน | สำคัญ | ส่งรายงาน | ห้อง301 | 15/06/2026 14:30",
          buildMainQuickReply()
        );
        return;
      }

      // Parse pipe-separated format: ชื่อ | ความสำคัญ | รายละเอียด | สถานที่ | วันเวลา
      const pipeParts = args.split("|").map((s: string) => s.trim());
      const todoTitle = pipeParts[0];
      const priorityText = (pipeParts[1] || "").toLowerCase();
      const todoDesc = pipeParts[2] || undefined;
      const todoLocation = pipeParts[3] || undefined;
      const todoDateText = pipeParts[4] || undefined;

      // Resolve priority
      const priInfo = PRIORITY_MAP[priorityText];

      if (!priInfo && pipeParts.length === 1) {
        // Only title given → show Quick Reply to choose priority
        await replyMessage(
          replyToken,
          `เลือกความสำคัญสำหรับ "${todoTitle}":`,
          buildPriorityQuickReply(todoTitle)
        );
        return;
      }

      const finalPriority = priInfo?.priority || 1;
      const finalPoints = priInfo?.points || 25;
      const finalIcon = priInfo?.icon || "💎";
      const finalLabel = priInfo?.label || "ต่ำ";
      const dueDateISO = todoDateText ? parseDateText(todoDateText) : undefined;
      const dueDateDisplay = todoDateText || undefined;

      const todo = await createTodo({
        user_id: dbUser.id,
        title: todoTitle,
        description: todoDesc,
        location: todoLocation,
        priority: finalPriority as any,
        points_reward: finalPoints,
        due_date: dueDateISO,
      });

      if (todo) {
        await replyFlexMessage(
          replyToken,
          `เพิ่ม "${todoTitle}" สำเร็จ`,
          buildAddSuccessFlex(todoTitle, finalLabel, finalIcon, finalPoints, todoDesc, todoLocation, dueDateDisplay),
          buildMainQuickReply()
        );
      } else {
        await replyMessage(replyToken, "❌ เพิ่มไม่สำเร็จ กรุณาลองใหม่", buildMainQuickReply());
      }
      break;
    }

    case "ลบ":
    case "delete": {
      const todos = await getTodosByUser(dbUser.id);
      if (!args) {
        if (todos.length === 0) {
          await replyMessage(replyToken, "ไม่มีรายการให้ลบ", buildMainQuickReply());
          return;
        }
        // Show list + Quick Reply to choose which to delete
        const list = todos.map((t: Todo, i: number) => `${i + 1}. ${t.title}`).join("\n");
        await replyMessage(
          replyToken,
          `🗑️ เลือกรายการที่ต้องการลบ:\n\n${list}`,
          buildDeleteQuickReply(todos.length)
        );
        return;
      }
      const idx = parseInt(args, 10);
      if (isNaN(idx) || idx < 1 || idx > todos.length) {
        await replyMessage(replyToken, `❌ ไม่พบรายการที่ ${idx} (มี ${todos.length} รายการ)`, buildMainQuickReply());
        return;
      }
      const target = todos[idx - 1];
      const success = await deleteTodo(target.id);
      if (success) {
        await replyMessage(replyToken, `🗑️ ลบ "${target.title}" เรียบร้อย`, buildMainQuickReply());
      } else {
        await replyMessage(replyToken, "❌ ลบไม่สำเร็จ", buildMainQuickReply());
      }
      break;
    }

    case "รายการ":
    case "list": {
      const todos = await getTodosByUser(dbUser.id);
      if (todos.length === 0) {
        await replyMessage(replyToken, "📋 ยังไม่มีรายการ\nพิมพ์ \"เพิ่ม\" เพื่อเริ่มต้น", buildMainQuickReply());
        return;
      }
      const list = todos
        .map((t: Todo, i: number) => {
          const status = t.status === "completed" ? "✅" : "⬜";
          const pri = PRIORITY_BY_NUM[t.priority]?.icon || "💎";
          return `${i + 1}. ${status} ${t.title} ${pri} +${t.points_reward}pts`;
        })
        .join("\n");

      // Quick Reply for check/delete
      const pendingTodos = todos.filter((t: Todo) => t.status !== "completed");
      const qr = pendingTodos.length > 0 ? buildCheckQuickReply(todos.length) : buildMainQuickReply();
      await replyMessage(replyToken, `📋 รายการของคุณ (${todos.length}):\n\n${list}`, qr);
      break;
    }

    case "เช็ค":
    case "done": {
      const todos = await getTodosByUser(dbUser.id);
      if (!args) {
        if (todos.length === 0) {
          await replyMessage(replyToken, "ไม่มีรายการ", buildMainQuickReply());
          return;
        }
        const pendingList = todos
          .map((t: Todo, i: number) => t.status !== "completed" ? `${i + 1}. ${t.title}` : null)
          .filter(Boolean)
          .join("\n");
        await replyMessage(
          replyToken,
          `✅ เลือกรายการที่ทำเสร็จ:\n\n${pendingList || "(ไม่มีรายการรอทำ)"}`,
          buildCheckQuickReply(todos.length)
        );
        return;
      }
      const idx = parseInt(args, 10);
      if (isNaN(idx) || idx < 1 || idx > todos.length) {
        await replyMessage(replyToken, `❌ ไม่พบรายการที่ ${idx}`, buildMainQuickReply());
        return;
      }
      const target = todos[idx - 1];
      if (target.status === "completed") {
        await replyMessage(replyToken, `✅ "${target.title}" เสร็จแล้ว`, buildMainQuickReply());
        return;
      }
      await updateTodo(target.id, { status: "completed" });
      const newPoints = dbUser.total_points + target.points_reward;
      await getAdmin().from("users").update({ total_points: newPoints }).eq("id", dbUser.id);
      await getAdmin().from("todo_logs").insert({
        todo_id: target.id, user_id: dbUser.id,
        action: `completed (+${target.points_reward}pts)`,
      });
      await replyMessage(
        replyToken,
        `🎉 ทำ "${target.title}" เสร็จ!\n+${target.points_reward} pts\n⭐ รวม: ${newPoints} pts`,
        buildMainQuickReply()
      );
      break;
    }

    case "คะแนน":
    case "point": {
      const stats = await getDashboardStats(dbUser.id);
      await replyMessage(
        replyToken,
        `⭐ คะแนนรวม: ${stats.totalPoints} pts\n✅ เสร็จ: ${stats.completed}/${stats.total} รายการ`,
        buildMainQuickReply()
      );
      break;
    }

    case "ช่วยเหลือ":
    case "help": {
      await replyFlexMessage(replyToken, "คำสั่ง Todolish", buildMenuFlex(), buildMainQuickReply());
      break;
    }

    case "บัญชี":
    case "account": {
      await replyFlexMessage(replyToken, "บัญชีของคุณ", buildCredentialsFlex(
        dbUser.display_name, dbUser.web_user_id || "(ไม่มี)", "(ใช้ password เดิม)"
      ), buildMainQuickReply());
      break;
    }

    default: {
      await replyFlexMessage(replyToken, "คำสั่ง Todolish", buildMenuFlex(), buildMainQuickReply());
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
    return NextResponse.json({ error: error.message || "Webhook error" }, { status: 500 });
  }
}
