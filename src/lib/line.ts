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
  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "📚 คู่มือการใช้งาน Todolish",
          weight: "bold",
          size: "xl",
          color: "#6366f1",
          wrap: true
        },
        {
          type: "separator",
          margin: "md"
        },
        {
          type: "text",
          text: "✨ วิธีเพิ่มรายการ (แบบง่าย)",
          weight: "bold",
          size: "sm",
          color: "#16a34a",
          margin: "md"
        },
        {
          type: "text",
          text: "พิมพ์ 'เพิ่ม' ตามด้วยชื่อ ระบบจะให้กดเลือกความสำคัญได้เลย",
          size: "xs",
          color: "#666666",
          wrap: true,
          margin: "sm"
        },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          backgroundColor: "#f0fdf4",
          cornerRadius: "md",
          paddingAll: "8px",
          contents: [
            { type: "text", text: "ตัวอย่าง: เพิ่ม ซื้อของเข้าบ้าน", size: "xs", color: "#15803d", weight: "bold" }
          ]
        },
        {
          type: "text",
          text: "🚀 วิธีเพิ่มรายการ (แบบละเอียด)",
          weight: "bold",
          size: "sm",
          color: "#f59e0b",
          margin: "lg"
        },
        {
          type: "text",
          text: "เพิ่ม ชื่อ | ความสำคัญ | รายละเอียด | สถานที่ | วันเวลา (วว/ดด/ปปปป)",
          size: "xs",
          color: "#666666",
          wrap: true,
          margin: "sm"
        },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          backgroundColor: "#fffbeb",
          cornerRadius: "md",
          paddingAll: "8px",
          contents: [
            { type: "text", text: "ตัวอย่าง:", size: "xs", color: "#b45309", weight: "bold" },
            { type: "text", text: "เพิ่ม ส่งงาน | สำคัญ | ไฟล์ PDF | ไลน์ | 15/06/2026 14:30", size: "xs", color: "#b45309", wrap: true }
          ]
        },
        {
          type: "text",
          text: "⚡ คำสั่งอื่นๆ",
          weight: "bold",
          size: "sm",
          color: "#ec4899",
          margin: "lg"
        },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          spacing: "sm",
          contents: [
            {
              type: "box", layout: "horizontal", contents: [
                { type: "text", text: "📋 รายการ", size: "sm", weight: "bold", flex: 3 },
                { type: "text", text: "ดูรายการที่ต้องทำ", size: "xs", color: "#666666", flex: 6, wrap: true }
              ]
            },
            {
              type: "box", layout: "horizontal", contents: [
                { type: "text", text: "✅ เช็ค", size: "sm", weight: "bold", flex: 3 },
                { type: "text", text: "ติ๊กทำเสร็จ รับคะแนน!", size: "xs", color: "#666666", flex: 6, wrap: true }
              ]
            },
            {
              type: "box", layout: "horizontal", contents: [
                { type: "text", text: "🗑️ ลบ", size: "sm", weight: "bold", flex: 3 },
                { type: "text", text: "ลบรายการที่ไม่ต้องการ", size: "xs", color: "#666666", flex: 6, wrap: true }
              ]
            },
            {
              type: "box", layout: "horizontal", contents: [
                { type: "text", text: "⭐ คะแนน", size: "sm", weight: "bold", flex: 3 },
                { type: "text", text: "ดูคะแนนสะสมทั้งหมด", size: "xs", color: "#666666", flex: 6, wrap: true }
              ]
            }
          ]
        }
      ],
      paddingAll: "20px"
    }
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

export function interactiveOptionsFlex(draft: any) {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "เพิ่มรายละเอียดรายการ", weight: "bold", size: "md", color: "#6366f1" },
        { type: "text", text: draft.title || "ไม่มีชื่อ", size: "lg", weight: "bold", margin: "md", wrap: true },
        { type: "separator", margin: "md" },
        { type: "box", layout: "vertical", margin: "md", spacing: "sm", contents: [
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "ความสำคัญ", size: "xs", color: "#999", flex: 3 },
            { type: "text", text: draft.priorityLabel || "ปานกลาง (50pts)", size: "xs", weight: "bold", flex: 5, align: "end" }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "รายละเอียด", size: "xs", color: "#999", flex: 3 },
            { type: "text", text: draft.description || "-", size: "xs", flex: 5, align: "end", wrap: true }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "สถานที่", size: "xs", color: "#999", flex: 3 },
            { type: "text", text: draft.location || "-", size: "xs", flex: 5, align: "end" }
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "เวลา", size: "xs", color: "#999", flex: 3 },
            { type: "text", text: draft.due_date ? draft.due_date.replace("T", " ") : "-", size: "xs", flex: 5, align: "end" }
          ]}
        ]},
        { type: "separator", margin: "lg" },
        { type: "text", text: "ต้องการเพิ่มข้อมูลส่วนไหน?", size: "sm", color: "#666666", margin: "md" },
        { type: "box", layout: "horizontal", margin: "md", spacing: "sm", contents: [
          { type: "button", style: "secondary", height: "sm", action: { type: "postback", label: "ความสำคัญ", data: "action=set_priority" } },
          { type: "button", style: "secondary", height: "sm", action: { type: "postback", label: "รายละเอียด", data: "action=set_desc" } }
        ]},
        { type: "box", layout: "horizontal", margin: "sm", spacing: "sm", contents: [
          { type: "button", style: "secondary", height: "sm", action: { type: "postback", label: "สถานที่", data: "action=set_location" } },
          { type: "button", style: "secondary", height: "sm", action: { type: "postback", label: "เวลา", data: "action=set_time" } }
        ]},
        { type: "button", style: "primary", height: "sm", margin: "md", color: "#10b981", action: { type: "postback", label: "ตกลง (บันทึก)", data: "action=confirm" } }
      ],
      paddingAll: "20px"
    }
  };
}

export function templateConfirmFlex() {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "บันทึกเป็นเทมเพลต?", weight: "bold", size: "md", color: "#f59e0b" },
        { type: "text", text: "ต้องการบันทึกรายการนี้เป็นเทมเพลตสำหรับใช้ซ้ำในอนาคตหรือไม่?", size: "sm", color: "#666666", margin: "md", wrap: true },
        { type: "box", layout: "horizontal", margin: "lg", spacing: "sm", contents: [
          { type: "button", style: "secondary", height: "sm", action: { type: "postback", label: "ไม่บันทึก", data: "action=skip_template" } },
          { type: "button", style: "primary", height: "sm", action: { type: "postback", label: "บันทึก", data: "action=save_template" } }
        ]}
      ],
      paddingAll: "20px"
    }
  };
}
