import { messagingApi } from "@line/bot-sdk";

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;

export const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken,
});

export async function replyMessage(replyToken: string, text: string) {
  await lineClient.replyMessage({
    replyToken,
    messages: [{ type: "text", text }],
  });
}

export async function replyFlexMessage(replyToken: string, altText: string, contents: any) {
  await lineClient.replyMessage({
    replyToken,
    messages: [
      {
        type: "flex",
        altText,
        contents,
      },
    ],
  });
}

export async function pushMessage(to: string, text: string) {
  await lineClient.pushMessage({
    to,
    messages: [{ type: "text", text }],
  });
}

export async function pushFlexMessage(to: string, altText: string, contents: any) {
  await lineClient.pushMessage({
    to,
    messages: [
      {
        type: "flex",
        altText,
        contents,
      },
    ],
  });
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

// ─── Flex Message Builders ───

export function buildWelcomeFlex(displayName: string) {
  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "🎉",
              size: "3xl",
              flex: 0,
            },
            {
              type: "text",
              text: "Todolish",
              weight: "bold",
              size: "xl",
              color: "#6366f1",
              flex: 1,
              gravity: "center",
              margin: "md",
            },
          ],
          alignItems: "center",
        },
      ],
      backgroundColor: "#f0f0ff",
      paddingAll: "20px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `ยินดีต้อนรับ ${displayName}!`,
          weight: "bold",
          size: "lg",
          wrap: true,
        },
        {
          type: "text",
          text: "กรุณาสมัครสมาชิกก่อนใช้งาน\nพิมพ์ตามรูปแบบด้านล่าง:",
          size: "sm",
          color: "#666666",
          margin: "md",
          wrap: true,
        },
        {
          type: "box",
          layout: "vertical",
          margin: "lg",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "สมัคร [ชื่อ] [เบอร์โทร]",
                  size: "md",
                  weight: "bold",
                  color: "#6366f1",
                  align: "center",
                },
              ],
              backgroundColor: "#f0f0ff",
              cornerRadius: "lg",
              paddingAll: "12px",
            },
          ],
        },
        {
          type: "text",
          text: "ตัวอย่าง: สมัคร สมชาย 0891234567",
          size: "xs",
          color: "#999999",
          margin: "md",
          align: "center",
        },
      ],
      paddingAll: "20px",
    },
    styles: {
      header: { separator: false },
    },
  };
}

export function buildCredentialsFlex(displayName: string, webUserId: string, password: string) {
  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "✅ สมัครสำเร็จ!",
          weight: "bold",
          size: "xl",
          color: "#16a34a",
        },
        {
          type: "text",
          text: displayName,
          size: "sm",
          color: "#666666",
          margin: "sm",
        },
      ],
      backgroundColor: "#f0fdf4",
      paddingAll: "20px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "ข้อมูลสำหรับเข้าสู่ระบบเว็บ:",
          size: "sm",
          color: "#666666",
        },
        {
          type: "separator",
          margin: "md",
        },
        {
          type: "box",
          layout: "vertical",
          margin: "lg",
          spacing: "md",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "User ID", size: "sm", color: "#999999", flex: 3 },
                { type: "text", text: webUserId, size: "sm", weight: "bold", color: "#6366f1", flex: 5, align: "end" },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "Password", size: "sm", color: "#999999", flex: 3 },
                { type: "text", text: password, size: "sm", weight: "bold", color: "#f472b6", flex: 5, align: "end" },
              ],
            },
          ],
        },
        {
          type: "separator",
          margin: "lg",
        },
        {
          type: "text",
          text: "⚠️ กรุณาจดหรือแคปหน้าจอเก็บไว้",
          size: "xs",
          color: "#ef4444",
          margin: "lg",
          wrap: true,
        },
      ],
      paddingAll: "20px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "พิมพ์ \"ช่วยเหลือ\" เพื่อดูคำสั่งทั้งหมด",
          size: "xs",
          color: "#999999",
          align: "center",
        },
      ],
      paddingAll: "12px",
    },
  };
}

export function buildMenuFlex() {
  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "📋 คำสั่ง Todolish",
          weight: "bold",
          size: "lg",
          color: "#6366f1",
        },
      ],
      backgroundColor: "#f0f0ff",
      paddingAll: "16px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        buildMenuRow("➕", "เพิ่ม [ชื่อ]", "สร้างรายการใหม่"),
        buildMenuRow("📋", "รายการ", "ดูรายการทั้งหมด"),
        buildMenuRow("✅", "เช็ค [เลข]", "ทำเครื่องหมายเสร็จ"),
        buildMenuRow("🗑️", "ลบ [เลข]", "ลบรายการ"),
        buildMenuRow("⭐", "คะแนน", "ดูคะแนนรวม"),
        buildMenuRow("👤", "บัญชี", "ดู User ID"),
        buildMenuRow("❓", "ช่วยเหลือ", "แสดงเมนูนี้"),
      ],
      paddingAll: "16px",
      spacing: "sm",
    },
  };
}

function buildMenuRow(emoji: string, command: string, desc: string) {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: emoji, size: "sm", flex: 1 },
      { type: "text", text: command, size: "sm", weight: "bold", flex: 4, color: "#333333" },
      { type: "text", text: desc, size: "xs", flex: 5, color: "#999999", align: "end" },
    ],
    paddingAll: "6px",
  };
}

export function buildNeedRegisterFlex() {
  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "⚠️ กรุณาสมัครสมาชิกก่อน",
          weight: "bold",
          size: "md",
          color: "#f59e0b",
          wrap: true,
        },
        {
          type: "text",
          text: "คุณต้องสมัครสมาชิกก่อนจึงจะใช้งาน Todolish ได้",
          size: "sm",
          color: "#666666",
          margin: "md",
          wrap: true,
        },
        {
          type: "box",
          layout: "vertical",
          margin: "lg",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "สมัคร [ชื่อ] [เบอร์โทร]",
                  size: "md",
                  weight: "bold",
                  color: "#6366f1",
                  align: "center",
                },
              ],
              backgroundColor: "#f0f0ff",
              cornerRadius: "lg",
              paddingAll: "12px",
            },
          ],
        },
        {
          type: "text",
          text: "ตัวอย่าง: สมัคร สมชาย 0891234567",
          size: "xs",
          color: "#999999",
          margin: "md",
          align: "center",
        },
      ],
      paddingAll: "20px",
    },
  };
}
