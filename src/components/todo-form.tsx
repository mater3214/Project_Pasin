"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TodoPriority } from "@/types";
import { Calendar, Flag, Plus, ChevronDown, Sparkles } from "lucide-react";

interface TodoFormProps {
  onAdd: (todo: {
    title: string;
    description?: string;
    priority: TodoPriority;
    due_date?: string;
  }) => void;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TodoPriority>(1);
  const [dueDate, setDueDate] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
    });
    setTitle("");
    setDescription("");
    setPriority(1);
    setDueDate("");
    setExpanded(false);
    setTimeout(() => setSubmitting(false), 500);
  };

  const priorityConfig = {
    1: { label: "ต่ำ", emoji: "🟢", color: "bg-emerald-100 text-emerald-700 border-emerald-200", points: 5 },
    2: { label: "กลาง", emoji: "🟡", color: "bg-amber-100 text-amber-700 border-amber-200", points: 10 },
    3: { label: "สูง", emoji: "🔴", color: "bg-red-100 text-red-700 border-red-200", points: 15 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden">
        {/* Gradient top accent */}
        <div className="h-1 bg-gradient-to-r from-primary via-chart-2 to-chart-4" />
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title input + add button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="✏️ เพิ่มรายการใหม่..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 rounded-xl border-border/50 bg-secondary/30 pl-4 pr-4 text-sm placeholder:text-muted-foreground/60 focus:bg-white transition-colors"
                />
              </div>
              <Button
                type="submit"
                disabled={!title.trim() || submitting}
                className="h-12 rounded-xl bg-gradient-to-r from-primary to-chart-2 px-5 font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-40"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                เพิ่ม
              </Button>
            </div>

            {/* Expand toggle */}
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
              {expanded ? "ซ่อนตัวเลือก" : "ตัวเลือกเพิ่มเติม"}
            </button>

            {/* Expanded options */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 rounded-xl bg-secondary/20 p-4">
                    <Input
                      placeholder="📝 รายละเอียดเพิ่มเติม..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-white/80"
                    />
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-auto bg-white/80 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-muted-foreground" />
                        <div className="flex gap-1.5">
                          {([1, 2, 3] as TodoPriority[]).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPriority(p)}
                              className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                priority === p
                                  ? `${priorityConfig[p].color} ring-2 ring-ring/50 scale-105`
                                  : "border-border/50 bg-white/80 text-muted-foreground hover:bg-secondary"
                              }`}
                            >
                              {priorityConfig[p].emoji} {priorityConfig[p].label}
                              <span className="ml-0.5 text-[10px] opacity-60">+{priorityConfig[p].points}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
