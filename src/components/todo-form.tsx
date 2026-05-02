"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TodoPriority, TodoTemplate } from "@/types";
import {
  Plus,
  MapPin,
  Bookmark,
  BookmarkCheck,
  X,
  Sparkles,
  Star,
  FileText,
  Send,
  Clock,
  CalendarDays,
  Check,
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

const PRIORITY_CONFIG: Record<TodoPriority, { label: string; icon: string; pts: number; color: string; bg: string; ring: string; text: string }> = {
  1: { label: "ต่ำ", icon: "💎", pts: 5, color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50", ring: "ring-emerald-300", text: "text-emerald-600" },
  2: { label: "กลาง", icon: "⚡", pts: 10, color: "from-amber-400 to-orange-500", bg: "bg-amber-50", ring: "ring-amber-300", text: "text-amber-600" },
  3: { label: "สูง", icon: "🔥", pts: 25, color: "from-rose-400 to-red-500", bg: "bg-rose-50", ring: "ring-rose-300", text: "text-rose-600" },
  4: { label: "สูงมาก", icon: "💥", pts: 40, color: "from-purple-400 to-violet-500", bg: "bg-purple-50", ring: "ring-purple-300", text: "text-purple-600" },
  5: { label: "สำคัญ", icon: "⭐", pts: 65, color: "from-yellow-400 to-amber-500", bg: "bg-yellow-50", ring: "ring-yellow-400", text: "text-yellow-600" },
};

function parseDateInput(input: string): string | undefined {
  if (!input.trim()) return undefined;
  const cleaned = input.trim().replace(/\//g, "-").replace(/\s+/g, " ");
  // Format: DD-MM-YYYY HH:MM or DD-MM-YYYY
  const match = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (match) {
    const [, dd, mm, yyyy, hh, min] = match;
    const hour = parseInt(hh || "23", 10);
    const minute = parseInt(min || "59", 10);
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    
    if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return "INVALID";
    }

    const hourStr = hour.toString().padStart(2, "0");
    const minStr = minute.toString().padStart(2, "0");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${hourStr}:${minStr}:00`;
  }
  // Try ISO/native format
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d.toISOString();
  return undefined;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<TodoPriority>(1);
  const [dateText, setDateText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [focused, setFocused] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<TodoTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(() => { });
  }, []);

  const currentPts = PRIORITY_CONFIG[priority].pts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dueDate = parseDateInput(dateText);
    if (dueDate === "INVALID") {
      toast.error("รูปแบบเวลาไม่ถูกต้อง", { description: "กรุณากรอกเวลาให้ถูกต้อง (ตัวอย่าง: 05/05/2026 14:30)" });
      return;
    }

    setSubmitting(true);

    if (isTemplate) {
      await saveAsTemplate();
    }

    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      priority,
      due_date: dueDate,
      points_reward: currentPts,
    });
    
    setTitle("");
    setDescription("");
    setLocation("");
    setPriority(1);
    setDateText("");
    setIsTemplate(false);
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
          points_reward: currentPts,
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
    setShowTemplates(false);
    setShowDetails(true);
    toast.success("โหลดเทมเพลตแล้ว");
  };

  const deleteTemplate = async (id: string) => {
    try {
      await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch { }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className={`relative overflow-hidden border transition-all duration-300 ${focused
          ? "border-primary/30 shadow-lg shadow-primary/10 bg-white"
          : "border-border/40 bg-white/80 shadow-sm backdrop-blur-sm"
        }`}>
        {/* Animated gradient top bar */}
        <div className="h-1 bg-gradient-to-r from-primary via-chart-2 to-chart-4 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />

        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            {/* Main input area */}
            <div className="p-5 pb-3">
              {/* Title input */}
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

              {/* Priority selection — 5 levels */}
              <div className="mt-3">
                <div className="flex items-center gap-1 flex-wrap">
                  {([1, 2, 3, 4, 5] as TodoPriority[]).map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    const isActive = priority === p;
                    return (
                      <motion.button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ${isActive
                            ? `${cfg.bg} ${cfg.text} ring-2 ${cfg.ring} shadow-sm`
                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                          }`}
                      >
                        <span className="text-[11px]">{cfg.icon}</span>
                        {cfg.label}
                        {p === 5 && <Star className="h-2.5 w-2.5 fill-current" />}
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

                  {/* Points display */}
                  <div className="ml-auto flex items-center gap-1 rounded-lg bg-gradient-to-r from-chart-3/5 to-chart-4/5 px-3 py-1.5">
                    <span className="text-xs font-bold text-chart-3">+{currentPts} pts</span>
                  </div>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="mt-2 flex items-center justify-end gap-1">
                <motion.button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${showDetails ? "bg-primary/10 text-primary" : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/50"
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
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${showTemplates ? "bg-chart-5/10 text-chart-5" : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/50"
                      }`}
                  >
                    <Bookmark className="h-3 w-3" />
                    {templates.length}
                  </motion.button>
                )}
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
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                        <Input
                          placeholder="วัน/เดือน/ปี เวลา เช่น 15/06/2026 14:30"
                          value={dateText}
                          onChange={(e) => setDateText(e.target.value)}
                          className="h-9 rounded-lg pl-9 bg-secondary/20 border-0 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>

                    {/* Quick date buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Clock className="h-3 w-3 text-muted-foreground/40" />
                      {[
                        { label: "วันนี้", fn: () => { const d = new Date(); setDateText(`${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} 23:59`); } },
                        { label: "พรุ่งนี้", fn: () => { const d = new Date(); d.setDate(d.getDate() + 1); setDateText(`${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} 23:59`); } },
                        { label: "3 วัน", fn: () => { const d = new Date(); d.setDate(d.getDate() + 3); setDateText(`${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} 23:59`); } },
                        { label: "สัปดาห์หน้า", fn: () => { const d = new Date(); d.setDate(d.getDate() + 7); setDateText(`${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} 23:59`); } },
                      ].map((q) => (
                        <button
                          key={q.label}
                          type="button"
                          onClick={q.fn}
                          className="rounded-md bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>

                    {/* Save as template toggle */}
                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                      <div className={`flex h-4 w-4 items-center justify-center rounded-[4px] border transition-all ${isTemplate ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20 scale-105' : 'border-input bg-background group-hover:border-primary/50'}`}>
                        {isTemplate && <Check className="h-3 w-3" strokeWidth={3} />}
                      </div>
                      <span className={`text-[12px] font-medium transition-colors ${isTemplate ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        บันทึกรายการนี้เป็นเทมเพลต (ใช้ซ้ำได้)
                      </span>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={isTemplate} 
                        onChange={(e) => setIsTemplate(e.target.checked)} 
                      />
                    </label>
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
                          <span className="text-[10px]">{PRIORITY_CONFIG[t.priority]?.icon || "💎"}</span>
                          <span className="truncate text-xs font-medium">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-chart-3">+{PRIORITY_CONFIG[t.priority]?.pts || t.points_reward}</span>
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

      <style jsx global>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </motion.div>
  );
}
