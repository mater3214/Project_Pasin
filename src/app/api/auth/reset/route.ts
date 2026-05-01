import { NextRequest, NextResponse } from "next/server";
import { findUserByPhone, resetUserCredentials } from "@/lib/supabase";

// Step 1: Verify phone number
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { step, phone, new_user_id, new_password } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "กรุณาระบุเบอร์โทร" },
        { status: 400 }
      );
    }

    // Step 1: Look up phone, return user info
    if (step === "verify") {
      const user = await findUserByPhone(phone.trim());
      if (!user) {
        return NextResponse.json(
          { error: "ไม่พบบัญชีที่ใช้เบอร์โทรนี้" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        display_name: user.display_name,
        current_user_id: user.web_user_id || "(ไม่มี)",
      });
    }

    // Step 2: Reset credentials
    if (step === "reset") {
      if (!new_user_id || !new_password) {
        return NextResponse.json(
          { error: "กรุณาระบุ User ID และ Password ใหม่" },
          { status: 400 }
        );
      }

      if (new_user_id.trim().length < 3) {
        return NextResponse.json(
          { error: "User ID ต้องมีอย่างน้อย 3 ตัวอักษร" },
          { status: 400 }
        );
      }

      if (new_password.trim().length < 4) {
        return NextResponse.json(
          { error: "Password ต้องมีอย่างน้อย 4 ตัวอักษร" },
          { status: 400 }
        );
      }

      const ok = await resetUserCredentials(
        phone.trim(),
        new_user_id.trim(),
        new_password.trim()
      );

      if (!ok) {
        return NextResponse.json(
          { error: "ตั้งค่าใหม่ไม่สำเร็จ (User ID อาจซ้ำ)" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "ตั้งค่าใหม่สำเร็จ",
      });
    }

    return NextResponse.json(
      { error: 'กรุณาระบุ step: "verify" หรือ "reset"' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Reset failed" },
      { status: 500 }
    );
  }
}
