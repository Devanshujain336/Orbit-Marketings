import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Gauge,
  Rocket,
  Film,
  CalendarClock,
  Inbox,
  Settings2,
} from "lucide-react";
import { OrbitLogoMark } from "@/components/orbit/orbit-logo";
import type { ReactNode } from "react";

import { fetchBusiness, fetchLeads } from "@/lib/orbit";
import { SpeedLine } from "@/components/orbit/primitives";

const nav = [
  { to: "/dashboard", label: "Pit wall", icon: Gauge },
  { to: "/onboarding", label: "Onboarding", icon: Rocket },
  { to: "/content", label: "Content", icon: Film },
  { to: "/distribution", label: "Distribution", icon: CalendarClock },
  { to: "/leads", label: "Leads", icon: Inbox },
  { to: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const business = useQuery({ queryKey: ["business"], queryFn: fetchBusiness });
  const leads = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });
  const hotLeads = (leads.data ?? []).filter((l) => l.tier === "high" && l.status !== "won" && l.status !== "lost").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-gradient-to-b from-sidebar to-background px-3 py-5 lg:flex">
          <Link to="/" className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <OrbitLogoMark size={26} className="text-primary" />
              <span className="font-display text-lg font-bold tracking-tight">ORBIT</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-signal/20 bg-signal/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-signal uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-signal" /> Live
            </span>
          </Link>
          <p className="label-xs mt-6 px-2">Workspace</p>
          <nav className="mt-2 flex flex-col gap-0.5">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className: "bg-sidebar-accent !text-signal font-semibold shadow-sm border-l-2 border-signal",
                }}
              >
                <item.icon className="size-4 shrink-0 transition-transform group-hover:scale-110" />
                {item.label}
                {item.to === "/leads" && hotLeads > 0 ? (
                  <span className="num ml-auto rounded-full bg-signal/20 px-1.5 text-[10px] text-signal">
                    {hotLeads}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-3 rounded-xl border border-sidebar-border bg-card p-3 shadow-sm transition-transform hover:-translate-y-0.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
              {(business.data?.name || "O")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{business.data?.name ?? "Loading…"}</p>
              <p className="truncate text-xs text-muted-foreground">{business.data?.website ?? "Workspace"}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-border bg-background/85 px-6 py-4 backdrop-blur-md">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                {subtitle ? (
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-4">
                <p className="hidden text-sm text-muted-foreground sm:block">
                  {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(new Date())}
                </p>
                {actions}
              </div>
            </div>
            <SpeedLine />
          </header>

          <nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="shrink-0 rounded-sm px-3 py-1.5 text-xs text-muted-foreground"
                activeProps={{ className: "bg-accent !text-accent-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="grid-asphalt min-h-[calc(100vh-96px)] px-5 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
