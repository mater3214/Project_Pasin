"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TodoPriority, TodoTemplate } from "@/types";
import {
  Calendar,
  Flag,
  Plus,
  MapPin,
  Flame,
  Bookmark,
  BookmarkCheck,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface TodoFormProps {
  onAdd: (todo: {
    title: string;
    description?: string;
    location?: string;
    priority: TodoPriority;
    due_date?: string;
    points_reward: number;
  }) => void;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<TodoPriority>(1);
  const [dueDate, setDueDate] = useState("");
  const [points, setPoints] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<TodoTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
      points_reward: points,
    });
    setTitle("");
    setDescription("");
    setLocation("");
    setPriority(1);
    setDueDate("");
    setPoints(5);
    setTimeout(() => setSubmitting(false), 500);
  };

  const saveAsTemplate = async () => {
    if (!title.trim()) {
      toast.error("กรุณาระบุชื่อรายการก่อน");
      return;
    }
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          priority,
          points_reward: points,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setTemplates((prev) => [d.template, ...prev]);
        toast.success("บันทึกเทมเพลตสำเร็จ");
      } else {
        toast.error("บันทึกไม่สำเร็จ");
      }
    } catch {
      toast.error("บันทึกไม่สำเร็จ");
    }
  };

  const loadTemplate = (t: TodoTemplate) => {
    setTitle(t.title);
    setDescription(t.description || "");
    setLocation(t.location || "");
    setPriority(t.priority);
    setPoints(t.points_reward);
    setShowTemplates(false);
    toast.success("โหลดเทมเพลตแล้ว");
  };

  const deleteTemplate = async (id: string) => {
    try {
      await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("ลบเทมเพลตสำเร็จ");
    } catch {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const priorityConfig = {
    1: { label: "ต่ำ", emoji: "🟢", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    2: { label: "กลาง", emoji: "🟡", color: "bg-amber-100 text-amber-700 border-amber-300" },
    3: { label: "สูง", emoji: "🔴", color: "bg-red-100 text-red-700 border-red-300" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-chart-2 to-chart-4" />
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header with template button */}
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Plus className="h-4 w-4 text-primary" />
                เพิ่มรายการใหม่
              </h3>
              <div className="flex gap-1.5">
                {templates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                      showTemplates
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    เทมเพลต ({templates.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={saveAsTemplate}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-chart-5 hover:bg-chart-5/5 transition-all"
                  title="บันทึกเป็นเทมเพลต"
                >
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  บันทึก
                </button>
              </div>
            </div>

            {/* Templates dropdown */}
            <AnimatePresence>
              {showTemplates && templates.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground mb-2">📋 เทมเพลตที่บันทึกไว้</p>
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-sm hover:bg-primary/5 transition-colors cursor-pointer group"
                        onClick={() => loadTemplate(t)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs">{priorityConfig[t.priority].emoji}</span>
                          <span className="truncate font-medium">{t.title}</span>
                          {t.location && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />{t.location}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-chart-3 font-medium">+{t.points_reward}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
                            className="opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive transition-all"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main fields */}
            <div className="grid gap-3">
              {/* Title */}
              <Input
                placeholder="✏️ ชื่อรายการ..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 rounded-xl border-border/50 bg-secondary/30 text-sm placeholder:text-muted-foreground/60 focus:bg-white transition-colors"
                required
              />

              {/* Description */}
              <Input
                placeholder="📝 รายละเอียด (ไม่บังคับ)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-10 rounded-xl border-border/50 bg-secondary/20 text-sm"
              />

              {/* Row: Location + DateTime */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    placeholder="สถานที่ (ไม่บังคับ)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-10 rounded-xl pl-9 border-border/50 bg-secondary/20 text-sm"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10 rounded-xl pl-9 border-border/50 bg-secondary/20 text-sm"
                  />
                </div>
              </div>

              {/* Row: Priority + Points */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Priority buttons */}
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground/50" />
                  <div className="flex gap-1.5">
                    {([1, 2, 3] as TodoPriority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          priority === p
                            ? `${priorityConfig[p].color} ring-2 ring-ring/30 scale-105 shadow-sm`
                            : "border-border/50 bg-white/80 text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {priorityConfig[p].emoji} {priorityConfig[p].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Points slider */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Flame className="h-4 w-4 text-chart-3" />
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                      className="flex-1 h-2 rounded-full appearance-none bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200 cursor-pointer accent-primary"
                    />
                    <div className="flex items-center gap-1 rounded-lg bg-chart-3/10 px-2 py-1 min-w-[60px] justify-center">
                      <Zap className="h-3 w-3 text-chart-3" />
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={points}
                        onChange={(e) => setPoints(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
                        className="w-8 bg-transparent text-xs font-bold text-chart-3 text-center outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!title.trim() || submitting}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-chart-2 font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-40"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              เพิ่มรายการ
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
