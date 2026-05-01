import { NextRequest, NextResponse } from "next/server";
import { registerWebUser } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "ต้องระบุชื่อและเบอร์โทร" },
        { status: 400 }
      );
    }

    const result = await registerWebUser(name.trim(), phone.trim());
    if (!result) {
      return NextResponse.json(
        { error: "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      web_user_id: result.webUserId,
      password: result.password,
      user: {
        id: result.user.id,
        display_name: result.user.display_name,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
