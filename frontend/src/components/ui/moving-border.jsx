import React, { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

function MovingBorder({
  children,
  duration = 3000,
  rx = "30%",
  ry = "30%",
  ...otherProps
}) {
  const pathRef = useRef(null);
  const progress = useMotionValue(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength?.();
    if (length) {
      const pxPerMs = length / duration;
      progress.set((time * pxPerMs) % length);
    }
  });

  const x = useTransform(progress, (val) => {
    const point = pathRef.current?.getPointAtLength?.(val);
    return point?.x ?? 0;
  });

  const y = useTransform(progress, (val) => {
    const point = pathRef.current?.getPointAtLength?.(val);
    return point?.y ?? 0;
  });

  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <rect
          ref={pathRef}
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
        />
      </svg>
      <motion.div
        className="absolute"
        style={{ left: x, top: y }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function MovingBorderButton({
  borderRadius = "1.75rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration,
  className,
  ...otherProps
}) {
  return (
    <div className={cn("relative", containerClassName)}>
      <MovingBorder duration={duration} rx="30%" ry="30%">
        <div
          className={cn(
            "h-20 w-20 opacity-[0.8] blur-xl",
            borderClassName
          )}
        />
      </MovingBorder>
      <Component
        className={cn(
          "relative inline-flex h-full w-full items-center justify-center rounded-[--border-radius] border border-slate-800 bg-black text-white antialiased",
          className
        )}
        style={{ borderRadius, "--border-radius": borderRadius }}
        {...otherProps}
      >
        {children}
      </Component>
    </div>
  );
}

export { MovingBorder, MovingBorderButton, MovingBorderButton as Button };
