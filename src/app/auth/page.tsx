"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserPlus,
  LogIn,
  Copy,
  CheckCircle2,
  Phone,
  User,
  KeyRound,
  Sparkles,
  ArrowLeft,
  Search,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Mode = "login" | "register" | "forgot";
type ForgotStep = "phone" | "reset" | "done";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);

  // Register
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [credentials, setCredentials] = useState<{
    web_user_id: string;
    password: string;
  } | null>(null);

  // Login
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // Forgot
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotStep, setForgotStep] = useState<ForgotStep>("phone");
  const [foundUser, setFoundUser] = useState<{ display_name: string; current_user_id: string } | null>(null);
  const [newUserId, setNewUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName.trim(), phone: regPhone.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCredentials({ web_user_id: data.web_user_id, password: data.password });
        toast.success("สมัครสมาชิกสำเร็จ!");
      } else {
        toast.error(data.error || "สมัครไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPw.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ web_user_id: loginId.trim(), password: loginPw.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("เข้าสู่ระบบสำเร็จ!");
        router.push("/todolist#list");
      } else {
        toast.error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPhone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "verify", phone: forgotPhone.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFoundUser({ display_name: data.display_name, current_user_id: data.current_user_id });
        setForgotStep("reset");
        toast.success(`พบบัญชี: ${data.display_name}`);
      } else {
        toast.error(data.error || "ไม่พบบัญชี");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim() || !newPassword.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "reset",
          phone: forgotPhone.trim(),
          new_user_id: newUserId.trim(),
          new_password: newPassword.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotStep("done");
        toast.success("ตั้งค่าใหม่สำเร็จ!");
      } else {
        toast.error(data.error || "ตั้งค่าไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก ${label} แล้ว`);
  };

  const resetForgot = () => {
    setForgotPhone("");
    setForgotStep("phone");
    setFoundUser(null);
    setNewUserId("");
    setNewPassword("");
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-background to-pink-50/30" />
      <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-chart-2/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative mx-auto flex max-w-md flex-col items-center px-4 py-16">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
            <CheckCircle2 className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Todolish</span>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex gap-1 rounded-xl bg-secondary/80 p-1 backdrop-blur-sm"
        >
          {([
            { key: "login" as Mode, label: "เข้าสู่ระบบ" },
            { key: "register" as Mode, label: "สมัครสมาชิก" },
            { key: "forgot" as Mode, label: "ลืมรหัส" },
          ]).map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setMode(m.key);
                setCredentials(null);
                resetForgot();
              }}
              className={`relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                mode === m.key
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </motion.div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode + (credentials ? "-cred" : "") + forgotStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {/* ─── REGISTER ─── */}
            {mode === "register" && !credentials && (
              <Card className="border-border/40 bg-white/80 shadow-xl shadow-black/5 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserPlus className="h-5 w-5 text-primary" />
                    สมัครสมาชิก
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    กรอกชื่อและเบอร์โทร ระบบจะสร้าง User ID + Password ให้อัตโนมัติ
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-muted-foreground" />
                        ชื่อที่แสดง
                      </label>
                      <Input placeholder="เช่น สมชาย" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        เบอร์โทรศัพท์
                      </label>
                      <Input placeholder="เช่น 0812345678" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-chart-2 font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                      disabled={loading || !regName.trim() || !regPhone.trim()}
                    >
                      {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {mode === "register" && credentials && (
              <Card className="border-green-200 bg-green-50/80 shadow-xl shadow-green-500/10 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                    <Sparkles className="h-5 w-5" />
                    สมัครสำเร็จ!
                  </CardTitle>
                  <p className="text-sm text-green-700">กรุณาจดหรือคัดลอกข้อมูลนี้ไว้สำหรับเข้าสู่ระบบ</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 rounded-xl bg-white/80 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">User ID</p>
                        <p className="font-mono text-lg font-bold text-primary">{credentials.web_user_id}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(credentials.web_user_id, "User ID")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="border-t" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Password</p>
                        <p className="font-mono text-lg font-bold text-chart-2">{credentials.password}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(credentials.password, "Password")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setMode("login");
                      setLoginId(credentials.web_user_id);
                      setLoginPw(credentials.password);
                      setCredentials(null);
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" /> ไปเข้าสู่ระบบ
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ─── LOGIN ─── */}
            {mode === "login" && (
              <Card className="border-border/40 bg-white/80 shadow-xl shadow-black/5 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <LogIn className="h-5 w-5 text-primary" />
                    เข้าสู่ระบบ
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">ใช้ User ID และ Password ที่ได้จากการสมัคร</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-muted-foreground" /> User ID
                      </label>
                      <Input placeholder="เช่น TDL-XXXXXXXX" value={loginId} onChange={(e) => setLoginId(e.target.value)} className="font-mono" required />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <KeyRound className="h-4 w-4 text-muted-foreground" /> Password
                      </label>
                      <Input type="password" placeholder="••••••••" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} className="font-mono" required />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-chart-2 font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                      disabled={loading || !loginId.trim() || !loginPw.trim()}
                    >
                      {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </Button>
                  </form>
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => { setMode("forgot"); resetForgot(); }}
                      className="text-xs text-primary hover:underline"
                    >
                      ลืม User ID หรือ Password?
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── FORGOT: Step 1 — Enter phone ─── */}
            {mode === "forgot" && forgotStep === "phone" && (
              <Card className="border-border/40 bg-white/80 shadow-xl shadow-black/5 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Search className="h-5 w-5 text-primary" />
                    ค้นหาบัญชี
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">กรอกเบอร์โทรที่ใช้สมัคร เพื่อค้นหาบัญชีของคุณ</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleForgotVerify} className="space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="h-4 w-4 text-muted-foreground" /> เบอร์โทรศัพท์
                      </label>
                      <Input placeholder="เช่น 0812345678" value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} required />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-chart-4 font-semibold shadow-lg"
                      disabled={loading || !forgotPhone.trim()}
                    >
                      {loading ? "กำลังค้นหา..." : "ค้นหาบัญชี"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ─── FORGOT: Step 2 — Set new credentials ─── */}
            {mode === "forgot" && forgotStep === "reset" && foundUser && (
              <Card className="border-chart-4/30 bg-blue-50/80 shadow-xl shadow-chart-4/10 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                    <RefreshCw className="h-5 w-5" />
                    ตั้งค่าใหม่
                  </CardTitle>
                  <p className="text-sm text-blue-700">
                    พบบัญชี: <strong>{foundUser.display_name}</strong>
                    <br />
                    <span className="text-xs opacity-70">User ID เดิม: {foundUser.current_user_id}</span>
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleForgotReset} className="space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-muted-foreground" /> User ID ใหม่
                      </label>
                      <Input placeholder="กำหนด User ID ใหม่" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} className="font-mono" required />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <KeyRound className="h-4 w-4 text-muted-foreground" /> Password ใหม่
                      </label>
                      <Input type="password" placeholder="กำหนด Password ใหม่" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="font-mono" required />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-chart-4 to-primary font-semibold shadow-lg"
                      disabled={loading || !newUserId.trim() || !newPassword.trim()}
                    >
                      {loading ? "กำลังบันทึก..." : "ตั้งค่าใหม่"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setForgotStep("phone"); setFoundUser(null); }}
                      className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-3 w-3" /> กลับ
                    </button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ─── FORGOT: Step 3 — Success ─── */}
            {mode === "forgot" && forgotStep === "done" && (
              <Card className="border-green-200 bg-green-50/80 shadow-xl shadow-green-500/10 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                    <CheckCircle2 className="h-5 w-5" />
                    ตั้งค่าสำเร็จ!
                  </CardTitle>
                  <p className="text-sm text-green-700">คุณสามารถเข้าสู่ระบบด้วย User ID และ Password ใหม่ได้แล้ว</p>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setMode("login");
                      setLoginId(newUserId);
                      setLoginPw(newPassword);
                      resetForgot();
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" /> ไปเข้าสู่ระบบ
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
