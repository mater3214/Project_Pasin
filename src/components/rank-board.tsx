"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RankUser } from "@/types";
import { Trophy, Medal, Crown } from "lucide-react";

interface RankBoardProps {
  users: RankUser[];
  loading: boolean;
}

export default function RankBoard({ users, loading }: RankBoardProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-sm font-medium text-muted-foreground">{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 text-yellow-700";
    if (rank === 2) return "bg-gray-400/20 text-gray-700";
    if (rank === 3) return "bg-amber-600/20 text-amber-700";
    return "bg-secondary text-secondary-foreground";
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            อันดับผู้ใช้งาน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              ยังไม่มีข้อมูลผู้ใช้งาน
            </div>
          ) : (
            users.map((user, idx) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex w-8 items-center justify-center">
                  {getRankIcon(idx + 1)}
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
                  {user.picture_url ? (
                    <img
                      src={user.picture_url}
                      alt={user.display_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {user.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    ทำเสร็จแล้ว {user.completed_count} รายการ
                  </p>
                </div>

                <Badge className={getRankBadge(idx + 1)}>
                  {user.total_points} pts
                </Badge>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
