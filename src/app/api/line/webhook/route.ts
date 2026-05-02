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
  getLineState,
  setLineState,
  clearLineState,
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
  checkQuickReply,
  deleteQuickReply,
  detailsOptionsFlex,
  askTemplateFlex,
  priorityOptionsFlex,
  templateOptionsCarousel,
  todoListCarouselFlex,
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
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function generatePassword(): string {
  return randomBytes(4).toString("hex");
}

// Priority system
const PRIORITY_MAP: Record<string, { priority: number; points: number; label: string }> = {
  "ต่ำ": { priority: 1, points: 5, label: "ต่ำ (5pts)" },
  "กลาง": { priority: 2, points: 10, label: "กลาง (10pts)" },
  "สูง": { priority: 3, points: 25, label: "สูง (25pts)" },
  "สูงมาก": { priority: 4, points: 40, label: "สูงมาก (40pts)" },
  "สำคัญ": { priority: 5, points: 65, label: "สำคัญ (65pts)" },
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

    // Only text messages
    if (event.type !== "message" || !event.message || event.message.type !== "text") return;

    const lineUserId = event.source.userId;
    const text = event.message.text;
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

    const { command, args } = parseCommand(text);

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

    // ─── Cancel State ───
    if (command === "ยกเลิก") {
      await clearLineState(lineUserId);
      await replyTextWithQuickReply(replyToken, "ยกเลิกการทำรายการแล้ว", mainQuickReply());
      return;
    }

    // ─── State Machine ───
    const stateRecord = await getLineState(lineUserId);
    if (stateRecord) {
      const state = stateRecord.state;
      const tempData = stateRecord.temp_data;

      switch (state) {
        case "ADDING_TITLE":
          tempData.title = text;
          await setLineState(lineUserId, "ADDING_PRIORITY", tempData);
          await replyFlex(replyToken, "เลือกระดับความสำคัญ", priorityOptionsFlex());
          return;

        case "ADDING_PRIORITY":
          const priInfoTitle = PRIORITY_MAP[text];
          if (!priInfoTitle) {
             await replyFlex(replyToken, "กรุณาเลือกความสำคัญจากเมนู", priorityOptionsFlex());
             return;
          }
          tempData.priority = priInfoTitle.priority as any;
          tempData.points_reward = priInfoTitle.points;
          await setLineState(lineUserId, "ADDING_DETAILS", tempData);
          await replyFlex(replyToken, "ต้องการเพิ่มข้อมูลอะไรอีกไหม?", detailsOptionsFlex());
          return;

        case "ADDING_DETAILS":
          if (text === "รายละเอียด") {
            await setLineState(lineUserId, "ADDING_DESC", tempData);
            await replyText(replyToken, "กรุณากรอกรายละเอียดเพิ่มเติม:");
            return;
          } else if (text === "สถานที่") {
            await setLineState(lineUserId, "ADDING_LOC", tempData);
            await replyText(replyToken, "กรุณากรอกสถานที่:");
            return;
          } else if (text === "เวลา") {
            await setLineState(lineUserId, "ADDING_TIME", tempData);
            await replyText(replyToken, "กรุณากรอกเวลา (เช่น 05/05/2026 14:30):");
            return;
          } else if (text === "ความสำคัญ") {
            await setLineState(lineUserId, "ADDING_PRIORITY", tempData);
            await replyFlex(replyToken, "เลือกระดับความสำคัญ", priorityOptionsFlex());
            return;
          } else if (text === "ตกลง") {
            await setLineState(lineUserId, "ASK_TEMPLATE", tempData);
            await replyFlex(replyToken, "บันทึกเทมเพลตหรือไม่?", askTemplateFlex());
            return;
          } else {
            await replyFlex(replyToken, "กรุณาเลือกจากเมนู หรือพิมพ์ ยกเลิก", detailsOptionsFlex());
            return;
          }

        case "ADDING_DESC":
          tempData.description = text;
          await setLineState(lineUserId, "ADDING_DETAILS", tempData);
          await replyFlex(replyToken, "บันทึกรายละเอียดแล้ว ต้องการเพิ่มข้อมูลอะไรอีกไหม?", detailsOptionsFlex());
          return;

        case "ADDING_LOC":
          tempData.location = text;
          await setLineState(lineUserId, "ADDING_DETAILS", tempData);
          await replyFlex(replyToken, "บันทึกสถานที่แล้ว ต้องการเพิ่มข้อมูลอะไรอีกไหม?", detailsOptionsFlex());
          return;

        case "ADDING_TIME":
          const dueDateISO = parseDateThai(text);
          if (!dueDateISO) {
             await replyText(replyToken, "รูปแบบเวลาไม่ถูกต้อง กรุณากรอกใหม่ (เช่น 05/05/2026 14:30) หรือพิมพ์ ยกเลิก");
             return;
          }
          tempData.due_date = dueDateISO;
          await setLineState(lineUserId, "ADDING_DETAILS", tempData);
          await replyFlex(replyToken, "บันทึกเวลาแล้ว ต้องการเพิ่มข้อมูลอะไรอีกไหม?", detailsOptionsFlex());
          return;

        case "ASK_TEMPLATE":
          let saveTemplate = false;
          if (text === "บันทึกเทมเพลต") {
            saveTemplate = true;
          } else if (text === "ไม่บันทึก") {
            saveTemplate = false;
          } else {
            await replyFlex(replyToken, "กรุณาเลือกจากเมนู", askTemplateFlex());
            return;
          }

          const finalPriority = tempData.priority || 1;
          const finalPoints = tempData.points_reward || 25;
          const todoTitle = tempData.title!;

          const todo = await createTodo({
            user_id: dbUser.id,
            title: todoTitle,
            description: tempData.description,
            location: tempData.location,
            priority: finalPriority as any,
            points_reward: finalPoints,
            due_date: tempData.due_date,
          });

          if (saveTemplate) {
             await getAdmin().from("todo_templates").insert({
                user_id: dbUser.id,
                title: todoTitle,
                description: tempData.description,
                location: tempData.location,
                priority: finalPriority,
                points_reward: finalPoints,
             });
          }

          await clearLineState(lineUserId);

          if (todo) {
             const finalLabel = Object.values(PRIORITY_MAP).find(p => p.priority === todo.priority)?.label || "ต่ำ (25pts)";
             // Format date display simply back to Thai original format if existed
             const displayDate = tempData.due_date ? tempData.due_date.replace("T", " ") : undefined;
             await replyFlexWithQuickReply(replyToken, 
                `เพิ่ม "${todo.title}" สำเร็จ`,
                addSuccessFlex(todo.title, finalLabel, finalPoints, todo.description, todo.location, displayDate),
                mainQuickReply()
             );
          } else {
             await replyTextWithQuickReply(replyToken, "เพิ่มไม่สำเร็จ กรุณาลองใหม่", mainQuickReply());
          }
          return;
      }
    }

    // ─── Commands ───
    switch (command) {
      case "สร้างใหม่":
        await setLineState(lineUserId, "ADDING_TITLE", {});
        await replyText(replyToken, "กรุณากรอกชื่อรายการ: (พิมพ์ ยกเลิก เพื่อยกเลิก)");
        return;

      case "ใช้เทมเพลต": {
        if (!args) return;
        const { data: t } = await getAdmin().from("todo_templates").select("*").eq("id", args).single();
        if (!t) {
           await replyText(replyToken, "ไม่พบเทมเพลตนี้");
           return;
        }
        const todo = await createTodo({
           user_id: dbUser.id,
           title: t.title,
           description: t.description,
           location: t.location,
           priority: t.priority,
           points_reward: t.points_reward,
        });
        if (todo) {
            const finalLabel = Object.values(PRIORITY_MAP).find(p => p.priority === todo.priority)?.label || "ต่ำ (5pts)";
            await replyFlexWithQuickReply(replyToken, 
               `เพิ่ม "${todo.title}" สำเร็จ`,
               addSuccessFlex(todo.title, finalLabel, todo.points_reward, todo.description, todo.location, undefined),
               mainQuickReply()
            );
        } else {
            await replyTextWithQuickReply(replyToken, "เพิ่มไม่สำเร็จ กรุณาลองใหม่", mainQuickReply());
        }
        return;
      }

      case "เพิ่ม":
      case "add": {
        if (!args) {
          // New stateful flow with templates
          const { data: templates } = await getAdmin()
            .from("todo_templates")
            .select("*")
            .eq("user_id", dbUser.id)
            .order("created_at", { ascending: false });
            
          if (templates && templates.length > 0) {
             await replyFlex(replyToken, "เลือกเทมเพลต หรือ สร้างรายการใหม่", templateOptionsCarousel(templates));
             return;
          }

          await setLineState(lineUserId, "ADDING_TITLE", {});
          await replyText(replyToken, "กรุณากรอกชื่อรายการ: (พิมพ์ ยกเลิก เพื่อยกเลิก)");
          return;
        }

        // Parse pipe-separated: ชื่อ | ความสำคัญ | รายละเอียด | สถานที่ | วัน/เดือน/ปี เวลา
        const pipeParts = args.split("|").map((s: string) => s.trim());
        const todoTitle = pipeParts[0];
        const priorityText = (pipeParts[1] || "").trim();
        const todoDesc = pipeParts[2] || undefined;
        const todoLocation = pipeParts[3] || undefined;
        const todoDateText = pipeParts[4] || undefined;

        const priInfo = PRIORITY_MAP[priorityText];

        // Only title given → show Flex to choose priority
        if (!priInfo && pipeParts.length <= 1) {
          // Fallback to new flow if they just typed "เพิ่ม [ชื่อ]"
          await setLineState(lineUserId, "ADDING_DETAILS", { title: todoTitle });
          await replyFlex(replyToken, `ตั้งชื่อรายการเป็น "${todoTitle}" แล้ว\nต้องการเพิ่มข้อมูลอะไรอีกไหม?`, detailsOptionsFlex());
          return;
        }

        const finalPriority = priInfo?.priority || 1;
        const finalPoints = priInfo?.points || 25;
        const finalLabel = priInfo?.label || "ต่ำ (25pts)";
        const dueDateISO = todoDateText ? parseDateThai(todoDateText) : undefined;

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
          await replyFlexWithQuickReply(replyToken,
            `เพิ่ม "${todoTitle}" สำเร็จ`,
            addSuccessFlex(todoTitle, finalLabel, finalPoints, todoDesc, todoLocation, todoDateText),
            mainQuickReply()
          );
        } else {
          await replyTextWithQuickReply(replyToken, "เพิ่มไม่สำเร็จ กรุณาลองใหม่", mainQuickReply());
        }
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
        const pendingWithIndex = todos.map((t: Todo, i: number) => ({ t, i: i + 1 })).filter(({ t }) => t.status !== "completed");
        if (pendingWithIndex.length === 0) {
           await replyTextWithQuickReply(replyToken, "ไม่มีรายการที่ต้องทำในตอนนี้ 🎉\nพิมพ์ \"เพิ่ม\" เพื่อเริ่มต้น", mainQuickReply());
           break;
        }
        await replyFlexWithQuickReply(replyToken, "รายการของคุณ", todoListCarouselFlex(pendingWithIndex), mainQuickReply());
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
