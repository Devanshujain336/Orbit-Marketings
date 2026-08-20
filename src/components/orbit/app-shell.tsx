import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Gauge,
  Rocket,
  Film,
  CalendarClock,
  Inbox,
  Settings2,
  Radio,
} from "lucide-react";
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
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
          <Link to="/" className="flex items-center gap-2 px-2">
            <span className="grid size-8 place-items-center rounded-sm bg-signal text-signal-foreground">
              <Radio className="size-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">ORBIT</span>
          </Link>
          <p className="label-xs mt-6 px-2">Workspace</p>
          <nav className="mt-2 flex flex-col gap-0.5">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group relative flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className: "bg-sidebar-accent !text-sidebar-accent-foreground font-medium",
                }}
              >
                <item.icon className="size-4 shrink-0 opacity-80" />
                {item.label}
                {item.to === "/leads" && hotLeads > 0 ? (
                  <span className="num ml-auto rounded-full bg-signal/20 px-1.5 text-[10px] text-signal">
                    {hotLeads}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-md border border-sidebar-border bg-card/60 p-3">
            <p className="label-xs">Workspace</p>
            <p className="mt-1 truncate text-sm font-medium">{business.data?.name ?? "Loading…"}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {business.data?.website ?? "no site linked"}
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
            <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="label-xs">Orbit · engine live</p>
                <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
                {subtitle ? (
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">{actions}</div>
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
