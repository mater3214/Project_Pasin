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
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [stats, setStats] = useState({ totalCompleted: 0 });

  useEffect(() => {
    fetch("/api/todos?stats=true")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats({ totalCompleted: 0 }));
  }, []);

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
      icon: Zap,
      title: "แจ้งเตือน LINE",
      desc: "รับการแจ้งเตือนก่อนถึงเวลาทำงาน",
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
    {
      icon: Shield,
      title: "Dashboard ส่วนตัว",
      desc: "ดูสถิติ ความคืบหน้า และอันดับของคุณ",
      color: "text-chart-5",
      bg: "bg-chart-5/10",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-background to-pink-50/40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-chart-2/5 blur-[100px]" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex flex-col items-center text-center">
          {/* Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4" />
            เชื่อมต่อกับ LINE Bot
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

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex gap-3"
          >
            <Link href="/auth" passHref>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-chart-2 font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                เริ่มใช้งาน
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
                value: (stats?.totalCompleted ?? 0).toLocaleString(),
              },
              { icon: Trophy, label: "ผู้ใช้งาน", value: "∞" },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                whileHover={{ y: -2, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex flex-col items-center rounded-2xl border border-border/40 bg-white/70 p-5 shadow-sm backdrop-blur-sm"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <p className="mt-2 text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((f, idx) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="group rounded-2xl border border-border/40 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${f.bg}`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
