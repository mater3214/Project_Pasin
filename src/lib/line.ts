import { messagingApi, validateSignature } from "@line/bot-sdk";

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const channelSecret = process.env.LINE_CHANNEL_SECRET!;

export const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken,
});

export async function replyMessage(replyToken: string, text: string) {
  await lineClient.replyMessage({
    replyToken,
    messages: [{ type: "text", text }],
  });
}

export async function pushMessage(to: string, text: string) {
  await lineClient.pushMessage({
    to,
    messages: [{ type: "text", text }],
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
