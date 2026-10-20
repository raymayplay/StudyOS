"use client";

import { BellRing, CalendarDays, ChartColumnBig, Clock3, LayoutDashboard, NotebookText, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "My Courses", icon: NotebookText },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/timetable", label: "Timetable", icon: Clock3 },
  { href: "/reminders", label: "Reminders", icon: BellRing },
  { href: "/planner", label: "AI Study Room", icon: Sparkles },
  { href: "/progress", label: "Progress", icon: ChartColumnBig },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative z-20 w-full border-b border-white/10 bg-[#090c19]/80 p-3 backdrop-blur-xl md:sticky md:top-0 md:h-screen md:w-[248px] md:shrink-0 md:border-r md:border-b-0 md:p-5">
      <Link href="/" className="mb-4 flex items-center gap-3 px-2 py-2 md:mb-9">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 via-indigo-500 to-cyan-400 text-lg font-bold text-white shadow-lg shadow-violet-950/50">
          S
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#090c19] bg-emerald-400" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-300">StudyOS / LOCAL</p>
          <h1 className="text-sm font-semibold text-white">Academic workspace</h1>
        </div>
      </Link>

      <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto pb-1 md:block md:space-y-1.5 md:overflow-visible">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
          return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition md:gap-3 md:text-sm ${
              active
                ? "border-violet-400/20 bg-gradient-to-r from-violet-500/20 to-indigo-500/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-violet-300" : "text-slate-500 group-hover:text-slate-200"}`} />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
          );
        })}
      </nav>

      <ThemeToggle />

      <div className="mt-8 hidden overflow-hidden rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.12] via-indigo-500/[0.06] to-cyan-500/[0.08] p-4 md:block">
        <div className="mb-2 flex items-center gap-2 text-violet-200">
          <Sparkles className="h-4 w-4" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">Quick action</p>
        </div>
        <p className="text-sm leading-5 text-slate-300">Turn upcoming deadlines into a focused, balanced study plan.</p>
        <Link href="/planner" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110">
          Open study planner <Sparkles className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="absolute bottom-5 left-5 hidden items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-600 md:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
        Private · local workspace
      </div>
    </aside>
  );
}
