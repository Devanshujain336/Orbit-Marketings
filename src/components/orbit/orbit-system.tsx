/**
 * OrbitSystem — a CSS-animated illustration of the Orbit marketing flywheel.
 *
 * Layout inspired by atomic/solar diagrams:
 *  - Central "ORBIT ALWAYS ON" nucleus
 *  - Three elliptical orbital paths, each tilted at a different angle
 *  - One labelled satellite node per orbit describing a stage
 *  - Floating step labels that counter-rotate to stay legible
 */
import { cn } from "@/lib/utils";

/* ─── data ────────────────────────────────────────────────────────────────── */

const STAGES = [
  {
    id: "onboard",
    label: "Onboard",
    subline: "learn your brand",
    step: "01",
    /* orbit shape */
    rx: "46%",   // ellipse x-radius (relative to container)
    ry: "14%",   // ellipse y-radius
    rotate: "-35deg",  // orbit tilt
    animDuration: "18s",
    animDirection: "normal",
    color: "rgba(255,108,76,0.85)",   // coral
    glowColor: "#ff6c4c",
    labelSide: "left",
  },
  {
    id: "create",
    label: "Create",
    subline: "make videos",
    step: "02",
    rx: "40%",
    ry: "18%",
    rotate: "18deg",
    animDuration: "24s",
    animDirection: "reverse",
    color: "rgba(255,169,70,0.85)",   // amber
    glowColor: "#ffa946",
    labelSide: "right",
  },
  {
    id: "distribute",
    label: "Distribute",
    subline: "reach buyers",
    step: "03",
    rx: "46%",
    ry: "16%",
    rotate: "55deg",
    animDuration: "30s",
    animDirection: "normal",
    color: "rgba(160,160,170,0.7)",   // grey
    glowColor: "#a0a0aa",
    labelSide: "right",
  },
  {
    id: "qualify",
    label: "Qualify",
    subline: "protect your time",
    step: "04",
    rx: "44%",
    ry: "12%",
    rotate: "-70deg",
    animDuration: "22s",
    animDirection: "reverse",
    color: "rgba(255,108,76,0.5)",
    glowColor: "#ff6c4c",
    labelSide: "left",
  },
] as const;

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function Orbit({
  rx,
  ry,
  rotate,
  color,
  glowColor,
  label,
  subline,
  step,
  animDuration,
  animDirection,
  labelSide,
}: (typeof STAGES)[number]) {
  const isLeft = labelSide === "left";

  return (
    /* The entire orbit ring + its satellite are inside a positioned wrapper
       that sits at the centre of the parent and is then scaled via ellipse
       transforms using CSS custom properties.                               */
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ transform: `rotate(${rotate})` }}
    >
      {/* Elliptical ring */}
      <div
        className="absolute"
        style={{
          width: `calc(${rx} * 2)`,
          height: `calc(${ry} * 2)`,
          borderRadius: "50%",
          border: `1.6px solid ${color}`,
          boxShadow: `0 0 12px 0 ${glowColor}33`,
        }}
      />

      {/* Satellite dot that travels around the ring */}
      <div
        className="absolute"
        style={{
          width: `calc(${rx} * 2)`,
          height: `calc(${ry} * 2)`,
          animation: `orbit-spin ${animDuration} linear infinite ${animDirection}`,
        }}
      >
        {/* The dot is placed at the far-right (3-o'clock) of the ellipse */}
        <div
          className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2"
          style={{ animation: `orbit-counter ${animDuration} linear infinite ${animDirection === "normal" ? "reverse" : "normal"}` }}
        >
          {/* Dot */}
          <span
            className="block size-3 rounded-full shadow-md ring-2 ring-background"
            style={{ background: glowColor, boxShadow: `0 0 10px 3px ${glowColor}66` }}
          />
        </div>
      </div>

      {/* Label pill — counter-rotated to always read horizontal */}
      <div
        className="absolute flex items-baseline gap-1.5 select-none"
        style={{
          [isLeft ? "right" : "left"]: "calc(50% - " + rx + " - 60px)",
          top: "calc(50% - " + ry + " - 20px)",
          transform: `rotate(calc(-1 * ${rotate}))`,
        }}
      >
        <span
          className={cn(
            "whitespace-nowrap text-sm font-bold leading-none",
            "text-foreground",
          )}
        >
          {label}
        </span>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {subline}
        </span>
      </div>
    </div>
  );
}

/* ─── main ─────────────────────────────────────────────────────────────────── */

export function OrbitSystem({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[4/3] w-full max-w-[680px] select-none overflow-visible",
        className,
      )}
    >
      {/* ── Background glow behind nucleus ─────────────────────────── */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          width: "38%",
          height: "38%",
          background: "radial-gradient(circle, #ff6c4c 0%, #ffa946 60%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* ── Orbital rings + satellites ─────────────────────────────── */}
      {STAGES.map((stage) => (
        <Orbit key={stage.id} {...stage} />
      ))}

      {/* ── Nucleus ────────────────────────────────────────────────── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        {/* Outer halo pulse */}
        <span
          className="absolute inset-0 -m-6 animate-ping rounded-full opacity-10"
          style={{ background: "#ff6c4c" }}
          aria-hidden="true"
        />
        {/* Large warm sphere */}
        <div
          className="size-24 rounded-full"
          style={{
            background: "radial-gradient(circle at 38% 36%, #ff8055 0%, #e8471a 70%)",
            boxShadow: "0 0 48px 12px #ff6c4c55, inset 0 -8px 24px #c0310a44",
          }}
          aria-hidden="true"
        />
        {/* Label card on top */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 rounded-full bg-card/90 px-4 py-2.5 text-center shadow-xl ring-1 ring-border backdrop-blur-sm"
          style={{ minWidth: 96 }}
        >
          {/* Mini bullseye icon */}
          <svg width="18" height="18" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="18" fill="#ff6c4c" />
            <circle cx="20" cy="20" r="13" fill="white" />
            <circle cx="20" cy="20" r="9" fill="#ff6c4c" />
            <circle cx="20" cy="20" r="5" fill="white" />
            <circle cx="20" cy="20" r="3" fill="#ff6c4c" />
          </svg>
          <p className="font-display text-[13px] font-bold leading-none tracking-widest">ORBIT</p>
          <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground leading-none mt-0.5">
            Always On
          </p>
        </div>
      </div>

      {/* ── Step callout cards positioned at compass points ────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Onboard — top-left */}
        <StepCard
          step="01"
          label="Onboard"
          detail="We scan your brand, extract your audience, offer, and voice. Done in 60 seconds."
          style={{ top: "5%", left: "2%" }}
          color="#ff6c4c"
        />
        {/* Create — top-right */}
        <StepCard
          step="02"
          label="Create"
          detail="AI scripts and human-shot videos move through the production pipeline automatically."
          style={{ top: "5%", right: "2%" }}
          color="#ffa946"
          align="right"
        />
        {/* Distribute — bottom-right */}
        <StepCard
          step="03"
          label="Distribute"
          detail="Videos post to Instagram & Facebook on a boosted schedule to reach your exact buyer."
          style={{ bottom: "5%", right: "2%" }}
          color="#a0a0aa"
          align="right"
        />
        {/* Qualify — bottom-left */}
        <StepCard
          step="04"
          label="Qualify"
          detail="Every DM reply is scored instantly. You only talk to buyers ready to pay."
          style={{ bottom: "5%", left: "2%" }}
          color="#ff6c4c"
        />
      </div>
    </div>
  );
}

function StepCard({
  step,
  label,
  detail,
  style,
  color,
  align = "left",
}: {
  step: string;
  label: string;
  detail: string;
  style: React.CSSProperties;
  color: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "absolute w-[180px] rounded-xl border border-border bg-card/80 p-3 shadow-lg backdrop-blur-sm",
        align === "right" ? "text-right" : "text-left",
      )}
      style={style}
    >
      <p
        className="font-mono text-[9px] font-bold uppercase tracking-widest"
        style={{ color }}
      >
        Step {step}
      </p>
      <p className="mt-0.5 text-sm font-bold leading-tight text-foreground">{label}</p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{detail}</p>
    </div>
  );
}
