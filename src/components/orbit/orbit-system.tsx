import type { LucideIcon } from "lucide-react";
import { Bot, CalendarClock, Inbox, MessageSquare, Radio, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

type OrbitNode = {
  icon: LucideIcon;
  label: string;
  note: string;
};

const innerNodes: OrbitNode[] = [
  { icon: Rocket, label: "Onboard", note: "We learn your brand" },
  { icon: Bot, label: "Create", note: "Videos get made" },
];

const outerNodes: OrbitNode[] = [
  { icon: CalendarClock, label: "Distribute", note: "Posted + boosted" },
  { icon: MessageSquare, label: "Reply", note: "Answered in seconds" },
  { icon: Inbox, label: "Qualify", note: "Sorted by value" },
];

function Ring({
  nodes,
  radius,
  duration,
  className,
}: {
  nodes: OrbitNode[];
  radius: number;
  duration: string;
  className?: string;
}) {
  return (
    <div
      className={cn("orbit-rotate absolute inset-0 z-10", className)}
      style={{ animationDuration: duration }}
    >
      {nodes.map((node, index) => {
        const angle = (360 / nodes.length) * index;
        return (
          <div
            key={node.label}
            className="absolute left-1/2 top-1/2 size-0"
            style={{ transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)` }}
          >
            <div
              className="orbit-counter -translate-x-1/2 -translate-y-1/2"
              style={{ animationDuration: duration }}
            >
              <div className="flex w-[104px] flex-col items-center gap-1.5 text-center">
                <span className="grid size-11 place-items-center rounded-full border border-signal/40 bg-card text-signal shadow-glow">
                  <node.icon className="size-5" />
                </span>
                <span className="font-display text-sm font-semibold leading-none">{node.label}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{node.note}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function OrbitSystem({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[560px] px-2", className)}>
      <div className="orbit-path absolute inset-[18%] rounded-full" />
      <div className="orbit-path absolute inset-0 rounded-full" />

      <div className="absolute inset-[18%]">
        <Ring nodes={innerNodes} radius={148} duration="26s" />
      </div>
      <div className="absolute inset-0">
        <Ring nodes={outerNodes} radius={206} duration="42s" />
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="orbit-pulse grid size-24 place-items-center rounded-full border border-signal/50 bg-card text-center">
          <div>
            <Radio className="mx-auto size-5 text-signal" />
            <p className="font-display text-base font-bold leading-none">ORBIT</p>
            <p className="label-xs mt-1">always on</p>
          </div>
        </div>
      </div>
    </div>
  );
}
