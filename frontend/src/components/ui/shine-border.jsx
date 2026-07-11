"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const ShineBorder = React.forwardRef(
  (
    {
      borderWidth = 1,
      duration = 14,
      shineColor = "#000000",
      className,
      style,
      ...props
    },
    ref
  ) => {
    const hasGradient = Array.isArray(shineColor);

    return (
      <div
        ref={ref}
        style={{
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          "--mask-linear-gradient": `
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0)
          `,
          "--background-radial-gradient": hasGradient
            ? `radial-gradient(transparent,transparent, ${shineColor.join(",")},transparent,transparent)`
            : `radial-gradient(transparent,transparent, ${shineColor},transparent,transparent)`,
          backgroundImage: hasGradient
            ? shineColor.join(",")
            : shineColor,
          WebkitMask: "var(--mask-linear-gradient)",
          mask: "var(--mask-linear-gradient)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          ...style,
        }}
        className={cn(
          "pointer-events-none absolute inset-0 size-full rounded-[inherit]",
          "animate-shine-border",
          className
        )}
        {...props}
      />
    );
  }
);

ShineBorder.displayName = "ShineBorder";
