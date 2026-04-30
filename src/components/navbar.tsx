"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Todolish
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/todolist#list"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Todolist
          </Link>
        </nav>

        <div className="hidden md:block">
          <Link href="/todolist#list" passHref>
            <Button variant="outline" size="sm">เริ่มใช้งาน</Button>
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-border px-4 py-4 md:hidden"
        >
          <Link
            href="/todolist#list"
            className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Todolist
          </Link>
          <div className="mt-3">
            <Link href="/todolist#list" onClick={() => setMobileOpen(false)} passHref>
              <Button size="sm" className="w-full">เริ่มใช้งาน</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
