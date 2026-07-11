import { cn } from "@/lib/utils";

function GridBackground({ children, className, pattern = "grid", color = "rgba(27,75,143,0.05)" }) {
  const patternClass =
    pattern === "dot"
      ? "bg-dot"
      : pattern === "grid-small"
        ? "bg-grid-small"
        : "bg-grid";

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center",
        patternClass,
        className
      )}
      style={{ "--pattern-color": color }}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      {children}
    </div>
  );
}

function DotBackground({ children, className, color = "rgba(27,75,143,0.05)" }) {
  return (
    <GridBackground className={className} pattern="dot" color={color}>
      {children}
    </GridBackground>
  );
}

export { GridBackground, DotBackground };
