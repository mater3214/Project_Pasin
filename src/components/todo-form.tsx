"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TodoPriority } from "@/types";
import { Calendar, Flag, Plus } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
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
  };

  const priorityConfig = {
    1: { label: "ต่ำ", color: "bg-chart-5 text-white" },
    2: { label: "กลาง", color: "bg-chart-4 text-white" },
    3: { label: "สูง", color: "bg-destructive text-destructive-foreground" },
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Plus className="h-4 w-4 text-primary" />
          เพิ่มรายการใหม่
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="ชื่อรายการ..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!title.trim()}>
              <Plus className="mr-1 h-4 w-4" />
              เพิ่ม
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? "ซ่อนตัวเลือกเพิ่มเติม" : "แสดงตัวเลือกเพิ่มเติม"}
          </button>

          {expanded && (
            <div className="space-y-3">
              <Input
                placeholder="รายละเอียด (ไม่บังคับ)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-1">
                    {([1, 2, 3] as TodoPriority[]).map((p) => (
                      <Badge
                        key={p}
                        className={`cursor-pointer ${priorityConfig[p].color} ${priority === p ? "ring-2 ring-ring" : "opacity-60 hover:opacity-100"}`}
                        onClick={() => setPriority(p)}
                      >
                        {priorityConfig[p].label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
