"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Menu, X, LogIn, LogOut, User, ChevronDown, LayoutDashboard } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ display_name: string; picture_url?: string } | null>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    setUser(null);
    setDropdownOpen(false);
    router.push("/auth");
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

        {/* Desktop Nav Center */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/todolist#list"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Todolist
          </Link>
        </nav>

        {/* Desktop Right — NO "เข้าสู่ระบบ" when logged in */}
        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <div className="w-24" />
          ) : user ? (
            /* LOGGED IN: Show avatar dropdown only — no login button */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-border/40 bg-white/80 pl-1 pr-3 py-0.5 transition-all hover:bg-white hover:shadow-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2 shadow-inner">
                  {user.picture_url ? (
                    <img src={user.picture_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {user.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium max-w-[120px] truncate">{user.display_name}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-border/50 bg-white shadow-xl shadow-black/10 backdrop-blur-xl"
                  >
                    <div className="border-b border-border/30 px-4 py-3">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">บัญชี</p>
                      <p className="truncate text-sm font-semibold mt-0.5">{user.display_name}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/todolist#dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive/70 hover:bg-destructive/5 hover:text-destructive transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* NOT LOGGED IN: Show login button */
            <Link href="/auth" passHref>
              <Button variant="outline" size="sm" className="gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                เข้าสู่ระบบ
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/50 px-4 py-4 md:hidden overflow-hidden"
          >
            <Link href="/todolist#list" className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>
              Todolist
            </Link>
            <div className="mt-3">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2">
                      <span className="text-xs font-bold text-white">{user.display_name.charAt(0).toUpperCase()}</span>
                    </div>
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
      </AnimatePresence>
    </motion.header>
  );
}
