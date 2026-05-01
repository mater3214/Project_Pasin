"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TodoForm from "@/components/todo-form";
import TodoList from "@/components/todo-list";
import Dashboard from "@/components/dashboard";
import RankBoard from "@/components/rank-board";
import { Todo, TodoPriority, DashboardStats, RankUser, UserProfile } from "@/types";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Trophy,
  ListTodo,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Section = "dashboard" | "rank" | "list";

const sections: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "rank", label: "อันดับ", icon: Trophy },
  { key: "list", label: "รายการ", icon: ListTodo },
];

export default function TodolistPage() {
  const router = useRouter();
  const [hash, setHash] = useState<Section>("list");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rankUsers, setRankUsers] = useState<RankUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setCurrentUser(d.user);
          setUserId(d.user.id);
        } else {
          // Fallback to demo user if not logged in
          setUserId("demo-user");
        }
      })
      .catch(() => setUserId("demo-user"));
  }, []);

  const fetchTodos = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/todos?userId=${userId}`);
      const data = await res.json();
      setTodos(data.todos || []);
    } catch {
      toast.error("ไม่สามารถโหลดรายการได้");
    }
  }, [userId]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/todos?stats=true&userId=${userId}`);
      const data = await res.json();
      setStats(data);
    } catch {
      setStats(null);
    }
  }, [userId]);

  const fetchRank = useCallback(async () => {
    try {
      const res = await fetch("/api/rank");
      const data = await res.json();
      setRankUsers(data.users || []);
    } catch {
      toast.error("ไม่สามารถโหลดอันดับได้");
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([fetchTodos(), fetchStats(), fetchRank()]).finally(() =>
      setLoading(false)
    );
  }, [userId, fetchTodos, fetchStats, fetchRank]);

  useEffect(() => {
    const onHashChange = () => {
      const h = window.location.hash.replace("#", "") as Section;
      if (["dashboard", "rank", "list"].includes(h)) {
        setHash(h);
      } else {
        setHash("list");
      }
    };
    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const refreshUser = async () => {
    const res = await fetch("/api/auth/me");
    const d = await res.json();
    if (d.user) setCurrentUser(d.user);
  };

  const addTodo = async (todo: {
    title: string;
    description?: string;
    location?: string;
    priority: TodoPriority;
    due_date?: string;
    points_reward: number;
  }) => {
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...todo,
          user_id: userId,
        }),
      });
      if (res.ok) {
        toast.success("เพิ่มรายการสำเร็จ");
        await fetchTodos();
        await fetchStats();
      } else {
        toast.error("เพิ่มรายการไม่สำเร็จ");
      }
    } catch {
      toast.error("เพิ่มรายการไม่สำเร็จ");
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const newStatus = todo.status === "completed" ? "pending" : "completed";
    try {
      const res = await fetch(`/api/todos?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        if (newStatus === "completed") {
          toast.success(
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              ทำเสร็จแล้ว! +{todo.points_reward} คะแนน
            </div>
          );
        } else {
          toast.info("ยกเลิกสถานะเสร็จสิ้น");
        }
        await fetchTodos();
        await fetchStats();
        await fetchRank();
      } else {
        toast.error("อัปเดตไม่สำเร็จ");
      }
    } catch {
      toast.error("อัปเดตไม่สำเร็จ");
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const res = await fetch(`/api/todos?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ลบรายการสำเร็จ");
        await fetchTodos();
        await fetchStats();
      } else {
        toast.error("ลบรายการไม่สำเร็จ");
      }
    } catch {
      toast.error("ลบรายการไม่สำเร็จ");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Tab Navigation */}
      <div className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl bg-secondary/50 p-1.5 backdrop-blur-sm">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = hash === s.key;
          return (
            <button
              key={s.key}
              onClick={() => {
                window.location.hash = s.key;
                setHash(s.key);
              }}
              className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={hash}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {hash === "dashboard" && (
            <Dashboard
              stats={stats}
              loading={loading}
              user={currentUser}
              onProfileUpdate={refreshUser}
            />
          )}

          {hash === "rank" && (
            <RankBoard users={rankUsers} loading={loading} />
          )}

          {hash === "list" && (
            <div className="space-y-6">
              <TodoForm onAdd={addTodo} />
              <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-5">
                  <TodoList
                    todos={todos}
                    loading={loading}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
