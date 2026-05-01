"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ListTodo,
  Trophy,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ display_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCompleted: 0 });

  useEffect(() => {
    // Check auth first
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch stats
    fetch("/api/todos?stats=true")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats({ totalCompleted: 0 }));
  }, []);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  // Not logged in → redirect to auth
  if (!user) {
    router.push("/auth");
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  const features = [
    {
      icon: ListTodo,
      title: "จัดการ Todo",
      desc: "เพิ่ม ลบ เช็ครายการ ได้ทั้งบนเว็บและ LINE",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Trophy,
      title: "ระบบ Rank",
      desc: "สะสมคะแนนจาก Bronze สู่ Radiant",
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      icon: Shield,
      title: "แจ้งเตือน LINE",
      desc: "แจ้งเตือนรายการผ่าน LINE Bot อัตโนมัติ",
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-background to-pink-50/40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-chart-2/5 blur-[100px]" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex flex-col items-center text-center">
          {/* Welcome Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4" />
            สวัสดี, {user.display_name}!
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            จัดการงานของคุณ
            <br />
            <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-4 bg-clip-text text-transparent">
              ได้อย่างมีประสิทธิภาพ
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg text-muted-foreground"
          >
            Todolish ช่วยให้คุณติดตามรายการที่ต้องทำ พร้อมระบบคะแนน Rank
            และการแจ้งเตือนผ่าน LINE
          </motion.p>

          {/* CTA — Menu Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex gap-3"
          >
            <Link href="/todolist#list" passHref>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-chart-2 font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                <ListTodo className="mr-2 h-4 w-4" />
                Todolist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/todolist#dashboard" passHref>
              <Button variant="outline" size="lg" className="backdrop-blur-sm">
                ดู Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-4"
          >
            {[
              { icon: ListTodo, label: "รายการทั้งหมด", value: "∞" },
              {
                icon: CheckCircle2,
                label: "ทำเสร็จแล้ว",
                value: stats.totalCompleted,
              },
              { icon: Trophy, label: "ผู้ใช้งาน", value: "∞" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -4, scale: 1.02 }}
                className="flex flex-col items-center rounded-2xl border border-border/50 bg-white/60 p-4 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
              >
                <stat.icon className="h-5 w-5 text-primary/60" />
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border/50 bg-white/60 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${feat.bg}`}
              >
                <feat.icon className={`h-5 w-5 ${feat.color}`} />
              </div>
              <h3 className="mt-4 text-base font-semibold">{feat.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
