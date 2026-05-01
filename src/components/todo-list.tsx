"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Todo, TodoPriority } from "@/types";
import {
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  Sparkles,
  Trophy,
  Clock,
  Flame,
} from "lucide-react";

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TodoList({ todos, loading, onToggle, onDelete }: TodoListProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filtered = todos.filter((t) => {
    if (filter === "pending") return t.status === "pending";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const total = todos.length;
  const completed = todos.filter((t) => t.status === "completed").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const priorityConfig: Record<TodoPriority, { label: string; emoji: string; color: string; bg: string }> = {
    1: { label: "ต่ำ", emoji: "🟢", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    2: { label: "กลาง", emoji: "🟡", color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    3: { label: "สูง", emoji: "🔴", color: "text-red-600", bg: "bg-red-50 border-red-100" },
  };

  const filterTabs = [
    { key: "all" as const, label: "ทั้งหมด", count: total },
    { key: "pending" as const, label: "รอทำ", count: total - completed },
    { key: "completed" as const, label: "เสร็จแล้ว", count: completed },
  ];

  return (
    <div className="space-y-4">
      {/* Filter + Progress Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
            {filterTabs.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === f.key
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  filter === f.key ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{progress}%</span>
            </div>
          )}
        </div>
        {total > 0 && (
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary/50">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-chart-5"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 py-16"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50">
            {filter === "completed" ? (
              <Trophy className="h-7 w-7 text-muted-foreground/40" />
            ) : (
              <Clock className="h-7 w-7 text-muted-foreground/40" />
            )}
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            {filter === "pending" ? "ไม่มีรายการที่รอดำเนินการ 🎉" : filter === "completed" ? "ยังไม่มีรายการที่เสร็จ" : "ยังไม่มีรายการ"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            {filter === "all" ? "เพิ่มรายการใหม่ด้านบนเพื่อเริ่มต้น" : ""}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((todo, idx) => {
              const p = priorityConfig[todo.priority];
              const isCompleted = todo.status === "completed";
              return (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                >
                  <div
                    className={`group relative flex items-start gap-3 rounded-xl border p-4 transition-all duration-200 ${
                      isCompleted
                        ? "border-border/30 bg-secondary/20 opacity-60 hover:opacity-80"
                        : "border-border/40 bg-white/80 shadow-sm hover:shadow-md hover:border-primary/20 backdrop-blur-sm"
                    }`}
                  >
                    {/* Priority indicator */}
                    <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
                      todo.priority === 3 ? "bg-red-400" : todo.priority === 2 ? "bg-amber-400" : "bg-emerald-400"
                    }`} />

                    {/* Check button */}
                    <button
                      onClick={() => onToggle(todo.id)}
                      className="mt-0.5 shrink-0 ml-2 transition-transform hover:scale-110 active:scale-95"
                      aria-label={isCompleted ? "ยกเลิก" : "เสร็จสิ้น"}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <CheckCircle2 className="h-6 w-6 text-chart-5" />
                        </motion.div>
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground/40 hover:text-primary transition-colors" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium transition-all ${
                          isCompleted ? "line-through text-muted-foreground" : ""
                        }`}>
                          {todo.title}
                        </p>
                        <span className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${p.bg}`}>
                          {p.emoji} {p.label}
                        </span>
                      </div>
                      {todo.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{todo.description}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-3">
                        {todo.due_date && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(todo.due_date).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5 text-[11px] text-chart-3">
                          <Flame className="h-3 w-3" />
                          +{todo.points_reward} pts
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => onDelete(todo.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
