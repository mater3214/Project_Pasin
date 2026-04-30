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
  Flag,
  Trophy,
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

  const priorityBadge = (p: TodoPriority) => {
    const map: Record<TodoPriority, { label: string; className: string }> = {
      1: { label: "ต่ำ", className: "bg-chart-5/20 text-chart-5" },
      2: { label: "กลาง", className: "bg-chart-4/20 text-chart-4" },
      3: { label: "สูง", className: "bg-destructive/20 text-destructive" },
    };
    return map[p];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["all", "pending", "completed"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "ทั้งหมด" : f === "pending" ? "รอดำเนินการ" : "เสร็จแล้ว"}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Trophy className="h-4 w-4" />
          <span>{completed}/{total}</span>
        </div>
      </div>

      {total > 0 && <Progress value={progress} className="h-2" />}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Circle className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              ไม่มีรายการ{filter === "pending" ? "ที่รอดำเนินการ" : filter === "completed" ? "ที่เสร็จแล้ว" : ""}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((todo) => {
              const p = priorityBadge(todo.priority);
              return (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`group transition-colors hover:bg-muted/30 ${todo.status === "completed" ? "opacity-60" : ""}`}>
                    <CardContent className="flex items-start gap-3 p-4">
                      <button
                        onClick={() => onToggle(todo.id)}
                        className="mt-0.5 shrink-0"
                        aria-label={todo.status === "completed" ? "ยกเลิกเสร็จสิ้น" : "ทำเครื่องหมายเสร็จสิ้น"}
                      >
                        {todo.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-chart-5" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`truncate text-sm font-medium ${todo.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                            {todo.title}
                          </p>
                          <Badge className={p.className}>{p.label}</Badge>
                        </div>
                        {todo.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{todo.description}</p>
                        )}
                        {todo.due_date && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(todo.due_date).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={() => onDelete(todo.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
