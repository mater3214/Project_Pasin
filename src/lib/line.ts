import { messagingApi } from "@line/bot-sdk";

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;

export const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken,
});

// ─── Safe Reply — always try/catch, fallback to text ───

export async function safeReply(replyToken: string, messages: any[]): Promise<boolean> {
  try {
    await lineClient.replyMessage({ replyToken, messages });
    return true;
  } catch (err: any) {
    console.error("LINE reply error:", err?.message || err);
    // Fallback: try simple text
    try {
      const fallbackText = messages.map((m: any) => m.altText || m.text || "").filter(Boolean).join("\n") || "เกิดข้อผิดพลาด";
      await lineClient.replyMessage({ replyToken, messages: [{ type: "text", text: fallbackText }] });
    } catch {
      console.error("LINE fallback reply also failed");
    }
    return false;
  }
}

export async function replyText(replyToken: string, text: string) {
  await safeReply(replyToken, [{ type: "text", text }]);
}

export async function replyTextWithQuickReply(replyToken: string, text: string, quickReply: any) {
  await safeReply(replyToken, [{ type: "text", text, quickReply }]);
}

export async function replyFlex(replyToken: string, altText: string, contents: any) {
  await safeReply(replyToken, [{ type: "flex", altText, contents }]);
}

export async function replyFlexWithQuickReply(replyToken: string, altText: string, contents: any, quickReply: any) {
  await safeReply(replyToken, [{ type: "flex", altText, contents, quickReply }]);
}

export async function pushMessage(to: string, text: string) {
  try {
    await lineClient.pushMessage({ to, messages: [{ type: "text", text }] });
  } catch (err: any) {
    console.error("LINE push error:", err?.message || err);
  }
}

export async function getUserProfile(userId: string) {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${channelAccessToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("getUserProfile error:", e);
    return null;
  }
}

export function parseCommand(text: string): { command: string; args: string } {
  const trimmed = text.trim();
  const parts = trimmed.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(" ").trim();
  return { command, args };
}

// ─── Quick Reply Builders ───

export function mainQuickReply() {
  return {
    items: [
      { type: "action", action: { type: "message", label: "เพิ่มรายการ", text: "เพิ่ม" } },
      { type: "action", action: { type: "message", label: "รายการ", text: "รายการ" } },
      { type: "action", action: { type: "message", label: "คะแนน", text: "คะแนน" } },
      { type: "action", action: { type: "message", label: "บัญชี", text: "บัญชี" } },
      { type: "action", action: { type: "message", label: "ช่วยเหลือ", text: "ช่วยเหลือ" } },
    ],
  };
}

export function priorityQuickReply(title: string) {
  // Truncate title to fit within 300 char limit for action text
  const t = title.length > 20 ? title.substring(0, 20) : title;
  return {
    items: [
      { type: "action", action: { type: "message", label: "ต่ำ 25pts", text: `เพิ่ม ${t} | ต่ำ` } },
      { type: "action", action: { type: "message", label: "กลาง 50pts", text: `เพิ่ม ${t} | กลาง` } },
      { type: "action", action: { type: "message", label: "สูง 100pts", text: `เพิ่ม ${t} | สูง` } },
      { type: "action", action: { type: "message", label: "สูงมาก 200pts", text: `เพิ่ม ${t} | สูงมาก` } },
      { type: "action", action: { type: "message", label: "สำคัญ 1000pts", text: `เพิ่ม ${t} | สำคัญ` } },
    ],
  };
}

export function checkQuickReply(count: number) {
  const items: any[] = [];
  for (let i = 1; i <= Math.min(count, 13); i++) {
    items.push({ type: "action", action: { type: "message", label: `เช็ค ${i}`, text: `เช็ค ${i}` } });
  }
  return { items };
}

export function deleteQuickReply(count: number) {
  const items: any[] = [];
  for (let i = 1; i <= Math.min(count, 13); i++) {
    items.push({ type: "action", action: { type: "message", label: `ลบ ${i}`, text: `ลบ ${i}` } });
  }
  return { items };
}

// ─── Flex Message Builders (simplified for reliability) ───

export function welcomeFlex(displayName: string) {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "Todolish", weight: "bold", size: "xl", color: "#6366f1" },
        { type: "text", text: `ยินดีต้อนรับ ${displayName}!`, size: "md", margin: "md", wrap: true },
        { type: "separator", margin: "lg" },
        { type: "text", text: "กรุณาสมัครสมาชิกก่อนใช้งาน", size: "sm", color: "#666666", margin: "lg", wrap: true },
        { type: "text", text: "พิมพ์:", size: "sm", color: "#666666", margin: "md" },
        { type: "text", text: "สมัคร ชื่อ เบอร์โทร", weight: "bold", size: "md", color: "#6366f1", margin: "sm" },
        { type: "text", text: "ตัวอย่าง: สมัคร สมชาย 0891234567", size: "xs", color: "#999999", margin: "md" },
      ],
      paddingAll: "20px",
    },
  };
}

export function credentialsFlex(displayName: string, webUserId: string, password: string) {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "สมัครสำเร็จ!", weight: "bold", size: "lg", color: "#16a34a" },
        { type: "text", text: displayName, size: "sm", color: "#666666", margin: "sm" },
        { type: "separator", margin: "lg" },
        { type: "text", text: "ข้อมูลเข้าสู่ระบบเว็บ:", size: "sm", color: "#666666", margin: "lg" },
        {
          type: "box", layout: "horizontal", margin: "md",
          contents: [
            { type: "text", text: "User ID", size: "sm", color: "#999999", flex: 3 },
            { type: "text", text: webUserId, size: "sm", weight: "bold", color: "#6366f1", flex: 5, align: "end" },
          ],
        },
        {
          type: "box", layout: "horizontal", margin: "sm",
          contents: [
            { type: "text", text: "Password", size: "sm", color: "#999999", flex: 3 },
            { type: "text", text: password, size: "sm", weight: "bold", color: "#f472b6", flex: 5, align: "end" },
          ],
        },
        { type: "separator", margin: "lg" },
        { type: "text", text: "กรุณาจดหรือแคปหน้าจอเก็บไว้", size: "xs", color: "#ef4444", margin: "lg", wrap: true },
      ],
      paddingAll: "20px",
    },
  };
}

export function menuFlex() {
  const row = (emoji: string, cmd: string, desc: string) => ({
    type: "box" as const, layout: "horizontal" as const, margin: "sm" as const,
    contents: [
      { type: "text" as const, text: `${emoji} ${cmd}`, size: "sm" as const, weight: "bold" as const, flex: 5, color: "#333333" },
      { type: "text" as const, text: desc, size: "xs" as const, flex: 5, color: "#999999", align: "end" as const },
    ],
  });

  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "คำสั่ง Todolish", weight: "bold", size: "lg", color: "#6366f1" },
        { type: "separator", margin: "md" },
        row("เพิ่ม", "เพิ่ม ชื่อ", "+25~1000pts"),
        row("รายการ", "รายการ", "ดูทั้งหมด"),
        row("เช็ค", "เช็ค เลข", "ทำเสร็จ"),
        row("ลบ", "ลบ เลข", "ลบรายการ"),
        row("คะแนน", "คะแนน", "ดูคะแนน"),
        row("บัญชี", "บัญชี", "ดู User ID"),
        { type: "separator", margin: "md" },
        { type: "text", text: "เพิ่มแบบละเอียด:", size: "xs", color: "#666", margin: "md", weight: "bold" },
        { type: "text", text: "เพิ่ม ชื่อ | สำคัญ | รายละเอียด | ที่ | วัน/เดือน/ปี เวลา", size: "xs", color: "#6366f1", margin: "sm", wrap: true },
        { type: "text", text: "เช่น: เพิ่ม ส่งงาน | สูง | รายงาน | ห้อง301 | 15/06/2026 14:30", size: "xs", color: "#999", margin: "sm", wrap: true },
      ],
      paddingAll: "16px",
      spacing: "sm",
    },
  };
}

export function needRegisterFlex() {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "กรุณาสมัครสมาชิกก่อน", weight: "bold", size: "md", color: "#f59e0b", wrap: true },
        { type: "text", text: "คุณต้องสมัครก่อนจึงจะใช้งานได้", size: "sm", color: "#666666", margin: "md", wrap: true },
        { type: "separator", margin: "lg" },
        { type: "text", text: "พิมพ์:", size: "sm", color: "#666666", margin: "lg" },
        { type: "text", text: "สมัคร ชื่อ เบอร์โทร", weight: "bold", size: "md", color: "#6366f1", margin: "sm" },
      ],
      paddingAll: "20px",
    },
  };
}

export function addSuccessFlex(title: string, priorityLabel: string, points: number, description?: string, location?: string, dueDate?: string) {
  const rows: any[] = [
    { type: "box", layout: "horizontal", contents: [
      { type: "text", text: "ความสำคัญ", size: "xs", color: "#999", flex: 3 },
      { type: "text", text: priorityLabel, size: "xs", weight: "bold", flex: 5, align: "end" },
    ]},
    { type: "box", layout: "horizontal", contents: [
      { type: "text", text: "คะแนน", size: "xs", color: "#999", flex: 3 },
      { type: "text", text: `+${points} pts`, size: "xs", weight: "bold", color: "#16a34a", flex: 5, align: "end" },
    ]},
  ];
  if (description) rows.push({ type: "box", layout: "horizontal", contents: [
    { type: "text", text: "รายละเอียด", size: "xs", color: "#999", flex: 3 },
    { type: "text", text: description, size: "xs", flex: 5, align: "end", wrap: true },
  ]});
  if (location) rows.push({ type: "box", layout: "horizontal", contents: [
    { type: "text", text: "สถานที่", size: "xs", color: "#999", flex: 3 },
    { type: "text", text: location, size: "xs", flex: 5, align: "end" },
  ]});
  if (dueDate) rows.push({ type: "box", layout: "horizontal", contents: [
    { type: "text", text: "กำหนด", size: "xs", color: "#999", flex: 3 },
    { type: "text", text: dueDate, size: "xs", flex: 5, align: "end" },
  ]});

  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "เพิ่มรายการสำเร็จ!", weight: "bold", size: "md", color: "#16a34a" },
        { type: "text", text: title, size: "md", weight: "bold", margin: "md", wrap: true },
        { type: "separator", margin: "md" },
        { type: "box", layout: "vertical", margin: "md", spacing: "sm", contents: rows },
      ],
      paddingAll: "16px",
    },
  };
}
