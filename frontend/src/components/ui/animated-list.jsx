"use client";

import { cn } from "@/lib/utils";
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

export function AnimatedList({ children, className, delay = 1000 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className={cn("flex flex-col", className)}>
      {React.Children.map(children, (child, index) => {
        return React.cloneElement(child, {
          ...child.props,
          inView,
          index,
          delay,
        });
      })}
    </div>
  );
}

export function AnimatedListItem({ children, className, inView, index, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={
        inView
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 20 }
      }
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * (delay / 1000),
      }}
      className={cn("", className)}
    >
      {children}
    </motion.div>
  );
}
