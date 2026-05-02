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
  updateUserBio,
} from "@/lib/supabase";
import {
  getUserProfile,
  replyText,
  replyTextWithQuickReply,
  replyFlex,
  replyFlexWithQuickReply,
  safeReply,
  parseCommand,
  welcomeFlex,
  credentialsFlex,
  menuFlex,
  needRegisterFlex,
  addSuccessFlex,
  mainQuickReply,
  priorityQuickReply,
  checkQuickReply,
  deleteQuickReply,
  interactiveOptionsFlex,
  templateConfirmFlex,
} from "@/lib/line";
import { Todo } from "@/types";
import { createHash, randomBytes } from "crypto";

type WebhookEvent = {
  type: string;
  source: { userId: string };
  replyToken?: string;
  message?: { type: string; text: string };
  postback?: { data: string };
};

const channelSecret = process.env.LINE_CHANNEL_SECRET!;

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function generateWebUserId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "TDL-";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function generatePassword(): string {
  return randomBytes(4).toString("hex");
}

// Priority system
const PRIORITY_MAP: Record<string, { priority: number; points: number; label: string }> = {
  "ต่ำ": { priority: 1, points: 25, label: "ต่ำ (25pts)" },
  "กลาง": { priority: 2, points: 50, label: "กลาง (50pts)" },
  "สูง": { priority: 3, points: 100, label: "สูง (100pts)" },
  "สูงมาก": { priority: 4, points: 200, label: "สูงมาก (200pts)" },
  "สำคัญ": { priority: 5, points: 1000, label: "สำคัญ (1000pts)" },
};

const PRI_BY_NUM: Record<number, { label: string; points: number }> = {
  1: { label: "ต่ำ", points: 25 },
  2: { label: "กลาง", points: 50 },
  3: { label: "สูง", points: 100 },
  4: { label: "สูงมาก", points: 200 },
  5: { label: "สำคัญ", points: 1000 },
};

// Parse Thai date format: DD/MM/YYYY HH:MM → ISO string in UTC+7
function parseDateThai(text: string): string | undefined {
  if (!text.trim()) return undefined;
  const cleaned = text.trim().replace(/\//g, "-").replace(/\s+/g, " ");
  const match = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (match) {
    const [, dd, mm, yyyy, hh, min] = match;
    const h = parseInt(hh || "23", 10);
    const m = parseInt(min || "59", 10);
    const hourStr = h.toString().padStart(2, "0");
    const minStr = m.toString().padStart(2, "0");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${hourStr}:${minStr}:00`;
  }
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d.toISOString();
  return undefined;
}

async function handleEvent(event: WebhookEvent) {
  try {
    // ─── Follow Event ───
    if (event.type === "follow") {
      const profile = await getUserProfile(event.source.userId);
      if (!profile || !event.replyToken) return;

      let user = await getUserByLineId(event.source.userId);
      if (!user) {
        user = await createUser({
          line_user_id: event.source.userId,
          display_name: profile.displayName,
          picture_url: profile.pictureUrl,
          total_points: 0,
        });
      }
      await replyFlex(event.replyToken, "ยินดีต้อนรับสู่ Todolish!", welcomeFlex(profile.displayName));
      return;
    }

    // Allow text messages and postbacks
    if (event.type !== "message" && event.type !== "postback") return;
    if (event.type === "message" && (!event.message || event.message.type !== "text")) return;

    const lineUserId = event.source.userId;
    const text = event.type === "message" ? event.message!.text : "";
    const replyToken = event.replyToken;
    if (!replyToken) return;

    // Get or create user
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
    if (!dbUser) {
      await replyText(replyToken, "เกิดข้อผิดพลาด กรุณาลองใหม่");
      return;
    }

    // ─── State Machine for Conversational Flow ───
    let userState = { state: "idle", draft: {} as any };
    if (dbUser.bio) {
      try { userState = JSON.parse(dbUser.bio); } catch (e) {}
    }

    // 1. Process Postback (Button Clicks)
    if (event.type === "postback" && event.postback?.data) {
      const params = new URLSearchParams(event.postback.data);
      const action = params.get("action");

      if (userState.state === "options") {
        if (action === "set_priority") {
          userState.state = "awaiting_priority";
          await updateUserBio(dbUser.id, JSON.stringify(userState));
          await replyTextWithQuickReply(replyToken, "เลือกความสำคัญ:", priorityQuickReply(userState.draft.title));
          return;
        }
        if (action === "set_desc") {
          userState.state = "awaiting_desc";
          await updateUserBio(dbUser.id, JSON.stringify(userState));
          await replyText(replyToken, "พิมพ์รายละเอียดที่ต้องการเพิ่ม:");
          return;
        }
        if (action === "set_location") {
          userState.state = "awaiting_location";
          await updateUserBio(dbUser.id, JSON.stringify(userState));
          await replyText(replyToken, "พิมพ์สถานที่:");
          return;
        }
        if (action === "set_time") {
          userState.state = "awaiting_time";
          await updateUserBio(dbUser.id, JSON.stringify(userState));
          await replyText(replyToken, "พิมพ์เวลา (รูปแบบ: 15/06/2026 14:30):");
          return;
        }
        if (action === "confirm") {
          userState.state = "template_confirm";
          await updateUserBio(dbUser.id, JSON.stringify(userState));
          await replyFlex(replyToken, "บันทึกเทมเพลต?", templateConfirmFlex());
          return;
        }
      } else if (userState.state === "template_confirm") {
        const isTemplate = action === "save_template";
        const draft = userState.draft;
        
        const todo = await createTodo({
          user_id: dbUser.id,
          title: draft.title,
          description: draft.description,
          location: draft.location,
          priority: draft.priority || 1,
          points_reward: draft.points_reward || 25,
          due_date: draft.due_date,
        });

        if (isTemplate) {
          await getAdmin().from("todo_templates").insert({
            user_id: dbUser.id,
            title: draft.title,
            description: draft.description,
            location: draft.location,
            priority: draft.priority || 1,
            points_reward: draft.points_reward || 25,
          });
        }

        await updateUserBio(dbUser.id, null);

        if (todo) {
          const priLabel = PRI_BY_NUM[draft.priority || 1]?.label || "ต่ำ";
          await replyFlexWithQuickReply(replyToken,
            `เพิ่ม "${draft.title}" สำเร็จ`,
            addSuccessFlex(draft.title, priLabel, draft.points_reward || 25, draft.description, draft.location, draft.due_date),
            mainQuickReply()
          );
        } else {
          await replyTextWithQuickReply(replyToken, "เพิ่มไม่สำเร็จ กรุณาลองใหม่", mainQuickReply());
        }
        return;
      }
    }

    // 2. Process State Machine for Text Inputs
    if (event.type === "message") {
      const { command, args } = parseCommand(text);

      // Cancel command anytime
      if ((command === "ยกเลิก" || command === "cancel") && userState.state !== "idle") {
         await updateUserBio(dbUser.id, null);
         await replyTextWithQuickReply(replyToken, "ยกเลิกการทำงานแล้ว", mainQuickReply());
         return;
      }

      if (userState.state === "awaiting_title") {
        userState.draft.title = text.trim();
        userState.draft.priority = 1;
        userState.draft.points_reward = 25;
        userState.draft.priorityLabel = "ต่ำ (25pts)";
        userState.state = "options";
        await updateUserBio(dbUser.id, JSON.stringify(userState));
        await replyFlex(replyToken, "ตัวเลือก", interactiveOptionsFlex(userState.draft));
        return;
      }
      if (userState.state === "awaiting_desc") {
        userState.draft.description = text.trim();
        userState.state = "options";
        await updateUserBio(dbUser.id, JSON.stringify(userState));
        await replyFlex(replyToken, "ตัวเลือก", interactiveOptionsFlex(userState.draft));
        return;
      }
      if (userState.state === "awaiting_location") {
        userState.draft.location = text.trim();
        userState.state = "options";
        await updateUserBio(dbUser.id, JSON.stringify(userState));
        await replyFlex(replyToken, "ตัวเลือก", interactiveOptionsFlex(userState.draft));
        return;
      }
      if (userState.state === "awaiting_time") {
        const dueDateISO = parseDateThai(text);
        if (!dueDateISO) {
           await replyText(replyToken, "รูปแบบเวลาไม่ถูกต้อง กรุณาพิมพ์ใหม่ (ตัวอย่าง: 15/06/2026 14:30) หรือพิมพ์ 'ยกเลิก'");
           return;
        }
        userState.draft.due_date = dueDateISO;
        userState.state = "options";
        await updateUserBio(dbUser.id, JSON.stringify(userState));
        await replyFlex(replyToken, "ตัวเลือก", interactiveOptionsFlex(userState.draft));
        return;
      }
      if (userState.state === "awaiting_priority") {
         const priInfo = PRIORITY_MAP[text.trim()];
         if (!priInfo) {
           await replyTextWithQuickReply(replyToken, "กรุณาเลือกความสำคัญจากเมนู", priorityQuickReply(userState.draft.title));
           return;
         }
         userState.draft.priority = priInfo.priority;
         userState.draft.points_reward = priInfo.points;
         userState.draft.priorityLabel = priInfo.label;
         userState.state = "options";
         await updateUserBio(dbUser.id, JSON.stringify(userState));
         await replyFlex(replyToken, "ตัวเลือก", interactiveOptionsFlex(userState.draft));
         return;
      }

      // Prevent random text when expecting button clicks
      if (userState.state !== "idle") {
         if (userState.state === "options") {
            await replyFlex(replyToken, "ตัวเลือก", interactiveOptionsFlex(userState.draft));
            return;
         }
         if (userState.state === "template_confirm") {
            await replyFlex(replyToken, "บันทึกเทมเพลต?", templateConfirmFlex());
            return;
         }
      }

    // ─── Registration ───
    if (command === "สมัคร" || command === "register") {
      const parts = args.split(/\s+/);
      const name = parts[0];
      const phone = parts[1];

      if (!name || !phone) {
        await replyText(replyToken, "ใช้: สมัคร [ชื่อ] [เบอร์โทร]\nตัวอย่าง: สมัคร สมชาย 0891234567");
        return;
      }

      if (dbUser.web_user_id) {
        await replyFlexWithQuickReply(replyToken, "คุณมีบัญชีแล้ว",
          credentialsFlex(dbUser.display_name, dbUser.web_user_id, "(ใช้ password เดิม)"),
          mainQuickReply()
        );
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
        console.error("Registration error:", error);
        await replyText(replyToken, "สมัครไม่สำเร็จ กรุณาลองใหม่");
        return;
      }

      // Send credentials then menu as quick reply
      await replyFlexWithQuickReply(replyToken, "สมัครสำเร็จ!",
        credentialsFlex(name, webUserId, password),
        mainQuickReply()
      );
      return;
    }

    // ─── Block if not registered ───
    if (!dbUser.web_user_id) {
      await replyFlex(replyToken, "กรุณาสมัครสมาชิกก่อน", needRegisterFlex());
      return;
    }

    // ─── Commands ───
    switch (command) {
      case "เพิ่ม":
      case "add": {
        // Start interactive workflow
        userState.state = "awaiting_title";
        userState.draft = {};
        await updateUserBio(dbUser.id, JSON.stringify(userState));
        await replyText(replyToken, "กรุณาพิมพ์ 'ชื่อรายการ' ที่คุณต้องการเพิ่ม:");
        break;
      }

      case "ลบ":
      case "delete": {
        const todos = await getTodosByUser(dbUser.id);
        if (todos.length === 0) {
          await replyTextWithQuickReply(replyToken, "ไม่มีรายการ", mainQuickReply());
          return;
        }
        if (!args) {
          const list = todos.map((t: Todo, i: number) => `${i + 1}. ${t.title}`).join("\n");
          await replyTextWithQuickReply(replyToken,
            `เลือกรายการที่ต้องการลบ:\n\n${list}`,
            deleteQuickReply(todos.length)
          );
          return;
        }
        const idx = parseInt(args, 10);
        if (isNaN(idx) || idx < 1 || idx > todos.length) {
          await replyTextWithQuickReply(replyToken, `ไม่พบรายการที่ ${idx}`, mainQuickReply());
          return;
        }
        const target = todos[idx - 1];
        const success = await deleteTodo(target.id);
        await replyTextWithQuickReply(replyToken,
          success ? `ลบ "${target.title}" เรียบร้อย` : "ลบไม่สำเร็จ",
          mainQuickReply()
        );
        break;
      }

      case "รายการ":
      case "list": {
        const todos = await getTodosByUser(dbUser.id);
        if (todos.length === 0) {
          await replyTextWithQuickReply(replyToken, "ยังไม่มีรายการ\nพิมพ์ \"เพิ่ม\" เพื่อเริ่มต้น", mainQuickReply());
          return;
        }
        const list = todos.map((t: Todo, i: number) => {
          const status = t.status === "completed" ? "[done]" : "[  ]";
          const pri = PRI_BY_NUM[t.priority]?.label || "ต่ำ";
          return `${i + 1}. ${status} ${t.title} (${pri} +${t.points_reward}pts)`;
        }).join("\n");

        const pending = todos.filter((t: Todo) => t.status !== "completed");
        await replyTextWithQuickReply(replyToken,
          `รายการของคุณ (${todos.length}):\n\n${list}`,
          pending.length > 0 ? checkQuickReply(todos.length) : mainQuickReply()
        );
        break;
      }

      case "เช็ค":
      case "done": {
        const todos = await getTodosByUser(dbUser.id);
        if (todos.length === 0) {
          await replyTextWithQuickReply(replyToken, "ไม่มีรายการ", mainQuickReply());
          return;
        }
        if (!args) {
          const pendingList = todos
            .map((t: Todo, i: number) => t.status !== "completed" ? `${i + 1}. ${t.title}` : null)
            .filter(Boolean).join("\n");
          await replyTextWithQuickReply(replyToken,
            `เลือกรายการที่ทำเสร็จ:\n\n${pendingList || "(ไม่มีรายการรอทำ)"}`,
            checkQuickReply(todos.length)
          );
          return;
        }
        const idx = parseInt(args, 10);
        if (isNaN(idx) || idx < 1 || idx > todos.length) {
          await replyTextWithQuickReply(replyToken, `ไม่พบรายการที่ ${idx}`, mainQuickReply());
          return;
        }
        const target = todos[idx - 1];
        if (target.status === "completed") {
          await replyTextWithQuickReply(replyToken, `"${target.title}" เสร็จแล้ว`, mainQuickReply());
          return;
        }
        await updateTodo(target.id, { status: "completed" });
        const newPoints = dbUser.total_points + target.points_reward;
        await getAdmin().from("users").update({ total_points: newPoints }).eq("id", dbUser.id);
        await getAdmin().from("todo_logs").insert({
          todo_id: target.id, user_id: dbUser.id,
          action: `completed (+${target.points_reward}pts)`,
        });
        await replyTextWithQuickReply(replyToken,
          `ทำ "${target.title}" เสร็จ!\n+${target.points_reward} pts | รวม: ${newPoints} pts`,
          mainQuickReply()
        );
        break;
      }

      case "คะแนน":
      case "point":
      case "points": {
        const stats = await getDashboardStats(dbUser.id);
        await replyTextWithQuickReply(replyToken,
          `คะแนนรวม: ${stats.totalPoints} pts\nเสร็จ: ${stats.completed}/${stats.total} รายการ`,
          mainQuickReply()
        );
        break;
      }

      case "ช่วยเหลือ":
      case "help": {
        await replyFlexWithQuickReply(replyToken, "คำสั่ง Todolish", menuFlex(), mainQuickReply());
        break;
      }

      case "บัญชี":
      case "account": {
        await replyFlexWithQuickReply(replyToken, "บัญชีของคุณ",
          credentialsFlex(dbUser.display_name, dbUser.web_user_id || "-", "(ใช้ password เดิม)"),
          mainQuickReply()
        );
        break;
      }

      default: {
        // Unknown command → show menu with Quick Reply
        await replyFlexWithQuickReply(replyToken, "คำสั่ง Todolish", menuFlex(), mainQuickReply());
      }
    }
    } // close if (event.type === "message")
  } catch (err: any) {
    console.error("handleEvent error:", err);
    // Try to send error reply
    if (event.replyToken) {
      try {
        await replyText(event.replyToken, "เกิดข้อผิดพลาด กรุณาลองใหม่");
      } catch { /* ignore */ }
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
    console.error("LINE webhook POST error:", error);
    return NextResponse.json({ error: error.message || "Webhook error" }, { status: 500 });
  }
}
