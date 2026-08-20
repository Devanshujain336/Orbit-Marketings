import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SpeedLine({ className }: { className?: string }) {
  return <div className={cn("speed-line h-px w-full opacity-70", className)} />;
}

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="label-xs text-foreground/80">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  unit,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: "default" | "signal" | "heat" | "cool";
}) {
  const toneClass =
    tone === "signal"
      ? "text-signal"
      : tone === "heat"
        ? "text-heat"
        : tone === "cool"
          ? "text-cool"
          : "text-foreground";
  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-px speed-line opacity-40" />
      <p className="label-xs">{label}</p>
      <p className={cn("num mt-3 text-3xl font-semibold", toneClass)}>
        {value}
        {unit ? <span className="ml-1 text-base text-muted-foreground">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const tierStyles: Record<string, string> = {
  high: "border-signal/40 bg-signal/15 text-signal",
  medium: "border-heat/40 bg-heat/15 text-heat",
  low: "border-border bg-muted text-muted-foreground",
};

export function TierBadge({ tier, score }: { tier: string; score?: number }) {
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] tracking-[0.14em] uppercase",
        tierStyles[tier] ?? tierStyles["low"],
      )}
    >
      {tier}
      {typeof score === "number" ? <span className="opacity-70">{score}</span> : null}
    </span>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-md border border-dashed border-border px-4 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
