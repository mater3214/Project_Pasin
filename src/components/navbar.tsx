"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Menu, X, LogIn, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ display_name: string; picture_url?: string } | null>(null);
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    setUser(null);
    router.push("/");
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-md shadow-primary/20 transition-shadow group-hover:shadow-lg group-hover:shadow-primary/30">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Todolish
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/todolist#list"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Todolist
          </Link>
        </nav>

        {/* Desktop Right */}
        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <div className="w-24" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-secondary/80 px-3 py-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  {user.picture_url ? (
                    <img src={user.picture_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <span className="text-sm font-medium">{user.display_name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="ออกจากระบบ">
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <Link href="/auth" passHref>
              <Button variant="outline" size="sm" className="gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                เข้าสู่ระบบ
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-border/50 px-4 py-4 md:hidden"
        >
          <Link
            href="/todolist#list"
            className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Todolist
          </Link>
          <div className="mt-3">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{user.display_name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  ออก
                </Button>
              </div>
            ) : (
              <Link href="/auth" onClick={() => setMobileOpen(false)} passHref>
                <Button size="sm" className="w-full gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  เข้าสู่ระบบ
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
