"use client";

import { cn } from "@/lib/utils";
import React from "react";

export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
}) {
  return (
    <span
      style={{
        "--speed": `${speed}s`,
        "--color-from": colorFrom,
        "--color-to": colorTo,
      }}
      className={cn(
        "inline-block bg-gradient-to-r bg-clip-text text-transparent",
        "animate-gradient-text",
        className
      )}
    >
      {children}
    </span>
  );
}
