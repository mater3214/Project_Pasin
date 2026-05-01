"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TodoPriority, TodoTemplate } from "@/types";
import {
  Calendar,
  Plus,
  MapPin,
  Flame,
  Bookmark,
  BookmarkCheck,
  X,
  Zap,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Star,
  Clock,
  FileText,
  Send,
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
  const [showDetails, setShowDetails] = useState(false);
  const [focused, setFocused] = useState(false);

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
    setShowDetails(false);
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
    setShowDetails(true);
    toast.success("โหลดเทมเพลตแล้ว");
  };

  const deleteTemplate = async (id: string) => {
    try {
      await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  };

  const priorityConfig = {
    1: { label: "ต่ำ", color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-300", icon: "💎" },
    2: { label: "กลาง", color: "from-amber-400 to-orange-500", bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-300", icon: "⚡" },
    3: { label: "สูง", color: "from-rose-400 to-red-500", bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-300", icon: "🔥" },
  };

  const pointsPercent = ((points - 1) / 99) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className={`relative overflow-hidden border transition-all duration-300 ${
        focused
          ? "border-primary/30 shadow-lg shadow-primary/10 bg-white"
          : "border-border/40 bg-white/80 shadow-sm backdrop-blur-sm"
      }`}>
        {/* Animated gradient top bar */}
        <div className="h-1 bg-gradient-to-r from-primary via-chart-2 to-chart-4 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />

        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            {/* Main input area */}
            <div className="p-5 pb-3">
              {/* Title input — hero field */}
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused ? "text-primary" : "text-muted-foreground/40"}`}>
                  <Sparkles className="h-4 w-4" />
                </div>
                <input
                  placeholder="เพิ่มรายการใหม่..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="w-full h-12 rounded-xl bg-secondary/30 pl-11 pr-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              {/* Quick action bar */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {/* Priority chips */}
                  {([1, 2, 3] as TodoPriority[]).map((p) => {
                    const cfg = priorityConfig[p];
                    const isActive = priority === p;
                    return (
                      <motion.button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                          isActive
                            ? `${cfg.bg} ${cfg.text} ring-2 ${cfg.ring} shadow-sm`
                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <span className="text-[11px]">{cfg.icon}</span>
                        {cfg.label}
                        {isActive && (
                          <motion.div
                            layoutId="priorityIndicator"
                            className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-gradient-to-r ${cfg.color}`}
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}

                  {/* Divider */}
                  <div className="h-5 w-px bg-border/50 mx-1" />

                  {/* Points control */}
                  <div className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-chart-3/5 to-chart-4/5 pl-2 pr-1 py-0.5">
                    <Zap className="h-3 w-3 text-chart-3" />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={points}
                      onChange={(e) => setPoints(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
                      className="w-7 bg-transparent text-xs font-bold text-chart-3 text-center outline-none"
                    />
                    <div className="flex flex-col">
                      <button type="button" onClick={() => setPoints(Math.min(100, points + 1))} className="text-muted-foreground/40 hover:text-chart-3 transition-colors">
                        <ChevronUp className="h-2.5 w-2.5" />
                      </button>
                      <button type="button" onClick={() => setPoints(Math.max(1, points - 1))} className="text-muted-foreground/40 hover:text-chart-3 transition-colors">
                        <ChevronDown className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-1">
                  <motion.button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                      showDetails ? "bg-primary/10 text-primary" : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <FileText className="h-3 w-3" />
                    รายละเอียด
                  </motion.button>

                  {templates.length > 0 && (
                    <motion.button
                      type="button"
                      onClick={() => setShowTemplates(!showTemplates)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                        showTemplates ? "bg-chart-5/10 text-chart-5" : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <Bookmark className="h-3 w-3" />
                      {templates.length}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Expandable details */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-3 space-y-2.5">
                    <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

                    {/* Description */}
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                      <Input
                        placeholder="รายละเอียดเพิ่มเติม..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="h-9 rounded-lg pl-9 bg-secondary/20 border-0 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                      />
                    </div>

                    {/* Location + Date row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                        <Input
                          placeholder="สถานที่"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="h-9 rounded-lg pl-9 bg-secondary/20 border-0 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                        <Input
                          type="datetime-local"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="h-9 rounded-lg pl-9 bg-secondary/20 border-0 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>

                    {/* Points slider */}
                    <div className="flex items-center gap-3">
                      <Star className="h-3.5 w-3.5 text-chart-3/60" />
                      <div className="relative flex-1 h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400"
                          initial={false}
                          animate={{ width: `${pointsPercent}%` }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={points}
                          onChange={(e) => setPoints(Number(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-chart-3 tabular-nums w-6 text-right">{points}</span>
                    </div>

                    {/* Save as template */}
                    <button
                      type="button"
                      onClick={saveAsTemplate}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-chart-5 transition-colors"
                    >
                      <BookmarkCheck className="h-3 w-3" />
                      บันทึกเป็นเทมเพลต
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Templates list */}
            <AnimatePresence>
              {showTemplates && templates.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mx-5 mb-3 rounded-lg border border-border/30 bg-secondary/10 p-2 space-y-1">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-md bg-white/80 px-3 py-1.5 text-sm hover:bg-primary/5 transition-colors cursor-pointer group"
                        onClick={() => loadTemplate(t)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px]">{priorityConfig[t.priority].icon}</span>
                          <span className="truncate text-xs font-medium">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-chart-3">+{t.points_reward}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3 text-destructive/40 hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <div className="px-5 pb-5">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  disabled={!title.trim() || submitting}
                  className="relative w-full h-11 rounded-xl overflow-hidden font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-30 disabled:shadow-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-chart-2 to-primary bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />
                  <span className="relative flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    เพิ่มรายการ
                  </span>
                </Button>
              </motion.div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Shimmer keyframe */}
      <style jsx global>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </motion.div>
  );
}
