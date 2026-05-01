import { NextRequest, NextResponse } from "next/server";
import { loginWebUser } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { web_user_id, password } = await req.json();

    if (!web_user_id || !password) {
      return NextResponse.json(
        { error: "ต้องระบุ User ID และ Password" },
        { status: 400 }
      );
    }

    const user = await loginWebUser(web_user_id.trim(), password.trim());
    if (!user) {
      return NextResponse.json(
        { error: "User ID หรือ Password ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("todolish_user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        display_name: user.display_name,
        total_points: user.total_points,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
