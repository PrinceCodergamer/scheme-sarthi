import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function Star({ x, y, isGlowing }) {
  return (
    <motion.div
      className="absolute h-[2px] w-[2px] rounded-full bg-white"
      style={{ left: x, top: y }}
      animate={isGlowing ? { scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] } : {}}
      transition={{ duration: 0.5, repeat: Infinity }}
    />
  );
}

function Glow({ x, y }) {
  return (
    <motion.div
      className="absolute h-4 w-4 rounded-full bg-blue-500"
      style={{ left: x - 7, top: y - 7 }}
      animate={{ scale: [1, 2, 1], opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}

function Illustration() {
  const [stars, setStars] = useState([]);
  const [glowingStars, setGlowingStars] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    const generated = [];
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 18; col++) {
        generated.push({
          id: `star-${row}-${col}`,
          x: col * 20 + Math.random() * 8,
          y: row * 20 + Math.random() * 8,
        });
      }
    }
    setStars(generated);
  }, []);

  const updateGlowingStars = useCallback(() => {
    const newGlowing = [];
    const count = Math.floor(Math.random() * 4) + 2;
    const shuffled = [...stars].sort(() => 0.5 - Math.random());
    for (let i = 0; i < count && i < shuffled.length; i++) {
      newGlowing.push(shuffled[i]);
    }
    setGlowingStars(newGlowing);
  }, [stars]);

  useEffect(() => {
    updateGlowingStars();
    intervalRef.current = setInterval(updateGlowingStars, 3000);
    return () => clearInterval(intervalRef.current);
  }, [updateGlowingStars]);

  return (
    <div className="relative h-full w-full">
      {stars.map((s) => (
        <Star key={s.id} x={s.x} y={s.y} isGlowing={glowingStars.some((gs) => gs.id === s.id)} />
      ))}
      {glowingStars.map((s) => (
        <Glow key={`glow-${s.id}`} x={s.x} y={s.y} />
      ))}
    </div>
  );
}

function GlowingStarsBackgroundCard({ children, className }) {
  const [mouseEnter, setMouseEnter] = useState(false);

  return (
    <div
      onMouseEnter={() => setMouseEnter(true)}
      onMouseLeave={() => setMouseEnter(false)}
      className={cn(
        "max-w-md rounded-2xl border border-[#1d1d2e] bg-[#0a0a1a] p-4",
        className
      )}
    >
      <div className="flex items-center justify-center">
        <Illustration />
      </div>
      <div className="px-2 pb-6 pt-4">{children}</div>
    </div>
  );
}

function GlowingStarsDescription({ children, className }) {
  return (
    <p className={cn("text-sm text-[#9ca3af]", className)}>{children}</p>
  );
}

function GlowingStarsTitle({ children, className }) {
  return (
    <h2 className={cn("text-lg text-white", className)}>{children}</h2>
  );
}

export {
  GlowingStarsBackgroundCard,
  GlowingStarsDescription,
  GlowingStarsTitle,
  Illustration,
  Star,
  Glow,
};
