import React, { useState, useCallback } from "react";
import { motion, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

function generateRandomString(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function CardPattern({ mouseX, mouseY }) {
  const maskImage = `radial-gradient(200px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { WebkitMaskImage: maskImage, maskImage };

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 [mask-image:radial-gradient(200px_at_0_0,white,transparent)]" style={style} />
    </div>
  );
}

function EvervaultCard({ className, children }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");

  const handleMouseMove = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
      const str = generateRandomString();
      setRandomString(str);
    },
    [mouseX, mouseY]
  );

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center rounded-xl border border-black/[0.2] bg-black p-4",
        className
      )}
      onMouseMove={handleMouseMove}
    >
      <CardPattern mouseX={mouseX.get()} mouseY={mouseY.get()} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export { EvervaultCard, CardPattern, generateRandomString };
