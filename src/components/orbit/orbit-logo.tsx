import { cn } from "@/lib/utils";

/**
 * OrbitLogo — the bullseye target mark for Orbit.
 * Renders as a pure SVG so it scales at any size and works
 * both in nav bars (small) and as a hero lockup (large).
 */
export function OrbitLogoMark({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Orbit logo"
      className={className}
    >
      {/* Outer ring */}
      <circle cx="20" cy="20" r="18" fill="currentColor" />
      {/* Middle white ring gap */}
      <circle cx="20" cy="20" r="13" fill="white" />
      {/* Inner filled ring */}
      <circle cx="20" cy="20" r="9" fill="currentColor" />
      {/* Second white ring gap */}
      <circle cx="20" cy="20" r="5" fill="white" />
      {/* Center bullseye */}
      <circle cx="20" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}

/**
 * Full wordmark: bullseye mark + "ORBIT" text.
 */
export function OrbitWordmark({
  className,
  size = 32,
  textClassName,
}: {
  className?: string;
  size?: number;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <OrbitLogoMark size={size} />
      <span
        className={cn(
          "font-display font-bold tracking-tight",
          textClassName,
        )}
      >
        ORBIT
      </span>
    </span>
  );
}
