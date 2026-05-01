"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStats, UserProfile } from "@/types";
import { getRankInfo, getNextRankPoints } from "@/lib/rank-utils";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ListTodo,
  CheckCircle2,
  Clock,
  Trophy,
  TrendingUp,
  PieChart,
  User,
  Phone,
  Mail,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  user?: UserProfile | null;
  onProfileUpdate?: () => void;
}

export default function Dashboard({ stats, loading, user, onProfileUpdate }: DashboardProps) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: "",
    phone: "",
    email: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setEditForm({
      display_name: user?.display_name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      bio: user?.bio || "",
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast.success("บันทึกข้อมูลสำเร็จ");
        setEditing(false);
        onProfileUpdate?.();
      } else {
        toast.error("บันทึกไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const rankInfo = getRankInfo(stats.totalPoints);
  const nextRank = getNextRankPoints(stats.totalPoints);

  const chartData = [
    { name: "เสร็จแล้ว", value: stats.completed, color: "#34d399" },
    { name: "รอดำเนินการ", value: stats.pending, color: "#f472b6" },
  ];

  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const statCards = [
    { title: "รายการทั้งหมด", value: stats.total, icon: ListTodo, color: "text-chart-1", bg: "bg-chart-1/10" },
    { title: "เสร็จแล้ว", value: stats.completed, icon: CheckCircle2, color: "text-chart-5", bg: "bg-chart-5/10" },
    { title: "รอดำเนินการ", value: stats.pending, icon: Clock, color: "text-chart-2", bg: "bg-chart-2/10" },
    { title: "คะแนนรวม", value: stats.totalPoints, icon: Trophy, color: "text-chart-3", bg: "bg-chart-3/10" },
  ];

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-border/40 bg-white/80 shadow-lg backdrop-blur-sm">
          {/* Gradient Header */}
          <div className="h-20 bg-gradient-to-r from-primary/80 via-chart-2/60 to-chart-4/50" />
          <CardContent className="relative -mt-10 px-6 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              {/* Avatar + Name */}
              <div className="flex items-end gap-4">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white shadow-lg"
                  style={{ backgroundColor: rankInfo.bgColor, borderColor: rankInfo.borderColor }}
                >
                  {user?.picture_url ? (
                    <img src={user.picture_url} alt="" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <span className="text-3xl">{rankInfo.icon}</span>
                  )}
                </div>
                <div className="pb-1">
                  {editing ? (
                    <Input
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      className="h-8 text-lg font-bold"
                    />
                  ) : (
                    <h2 className="text-xl font-bold">{user?.display_name || "ผู้ใช้งาน"}</h2>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge
                      className="font-semibold"
                      style={{
                        backgroundColor: rankInfo.bgColor,
                        color: rankInfo.color,
                        borderColor: rankInfo.borderColor,
                      }}
                    >
                      {rankInfo.icon} {rankInfo.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{stats.totalPoints} pts</span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              {user && (
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                        <X className="mr-1 h-3.5 w-3.5" /> ยกเลิก
                      </Button>
                      <Button size="sm" onClick={saveProfile} disabled={saving}>
                        <Save className="mr-1 h-3.5 w-3.5" /> {saving ? "กำลังบันทึก..." : "บันทึก"}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startEditing}>
                      <Edit3 className="mr-1 h-3.5 w-3.5" /> แก้ไขข้อมูล
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* User Details */}
            {user && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {editing ? (
                  <>
                    <div className="space-y-1">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> เบอร์โทร
                      </label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="0812345678"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> อีเมล
                      </label>
                      <Input
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="email@example.com"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" /> คำอธิบาย
                      </label>
                      <Input
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="เกี่ยวกับฉัน..."
                        className="h-8 text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user.bio && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{user.bio}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Rank Progress */}
            {nextRank && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{rankInfo.icon} {rankInfo.label}</span>
                  <span>{stats.totalPoints} / {nextRank} pts</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: rankInfo.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${rankInfo.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c, idx) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg}`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.title}</p>
                  <p className="text-2xl font-bold">{c.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                อัตราการเสร็จสิ้น
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>ความคืบหน้า</span>
                <span className="font-semibold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-3" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="h-4 w-4 text-primary" />
                สัดส่วนรายการ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs">
                {chartData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
