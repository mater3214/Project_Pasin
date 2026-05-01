"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RankUser } from "@/types";
import { getRankInfo } from "@/lib/rank-utils";
import { Trophy, Crown, Medal } from "lucide-react";

interface RankBoardProps {
  users: RankUser[];
  loading: boolean;
}

export default function RankBoard({ users, loading }: RankBoardProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const getPositionStyle = (pos: number) => {
    if (pos === 1) return { icon: <Crown className="h-5 w-5" />, gradient: "from-yellow-400 to-amber-500", text: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" };
    if (pos === 2) return { icon: <Medal className="h-5 w-5" />, gradient: "from-gray-300 to-gray-400", text: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" };
    if (pos === 3) return { icon: <Medal className="h-5 w-5" />, gradient: "from-amber-500 to-orange-600", text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    return { icon: null, gradient: "", text: "text-muted-foreground", bg: "", border: "border-border/40" };
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/40 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            อันดับผู้ใช้งาน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {users.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              ยังไม่มีข้อมูลผู้ใช้งาน
            </div>
          ) : (
            users.map((user, idx) => {
              const pos = idx + 1;
              const style = getPositionStyle(pos);
              const rankInfo = getRankInfo(user.total_points);

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all hover:shadow-sm ${style.border} ${style.bg || "bg-white/60"}`}
                >
                  {/* Position */}
                  <div className="flex w-9 items-center justify-center">
                    {pos <= 3 ? (
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${style.gradient} text-white shadow-sm`}>
                        {style.icon}
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">#{pos}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary shadow-sm">
                    {user.picture_url ? (
                      <img
                        src={user.picture_url}
                        alt={user.display_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">{rankInfo.icon}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{user.display_name}</p>
                      <Badge
                        className="text-[10px] font-semibold"
                        style={{
                          backgroundColor: rankInfo.bgColor,
                          color: rankInfo.color,
                          borderColor: rankInfo.borderColor,
                        }}
                      >
                        {rankInfo.icon} {rankInfo.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ทำเสร็จแล้ว {user.completed_count} รายการ
                    </p>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: rankInfo.color }}>
                      {user.total_points}
                    </p>
                    <p className="text-[10px] text-muted-foreground">pts</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
