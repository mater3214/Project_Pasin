"use client";
// Force redeploy - Todolish v1.0

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ListTodo,
  Trophy,
  ArrowRight,
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

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/60 via-background to-background" />

      <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            เชื่อมต่อกับ LINE Bot
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            จัดการงานของคุณ
            <br />
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              ได้อย่างมีประสิทธิภาพ
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg text-muted-foreground"
          >
            Todolish ช่วยให้คุณติดตามรายการที่ต้องทำ พร้อมระบบคะแนนและการแจ้งเตือนผ่าน LINE
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex gap-3"
          >
            <Link href="/todolist#list" passHref>
              <Button size="lg">
                เริ่มใช้งาน
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/todolist#dashboard" passHref>
              <Button variant="outline" size="lg">ดู Dashboard</Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-4"
          >
            {[
              { icon: ListTodo, label: "รายการทั้งหมด", value: "∞" },
              { icon: CheckCircle2, label: "ทำเสร็จแล้ว", value: (stats?.totalCompleted ?? 0).toLocaleString() },
              { icon: Trophy, label: "ผู้ใช้งาน", value: "∞" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center rounded-xl border border-border/60 bg-white/60 p-4 backdrop-blur-sm"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <p className="mt-2 text-xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
