"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  pathColor = "gray",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#ffaa40",
  gradientStopColor = "#9c40ff",
  delay = 0,
  duration = 5,
  repeat = Infinity,
  repeatDelay = 0,
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}) {
  const [pathD, setPathD] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const pathRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const getCoordinates = useCallback(() => {
    if (!containerRef?.current || !fromRef?.current || !toRef?.current) {
      return null;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const fromRect = fromRef.current.getBoundingClientRect();
    const toRect = toRef.current.getBoundingClientRect();

    const fromX = fromRect.left - containerRect.left + fromRect.width / 2 + startXOffset;
    const fromY = fromRect.top - containerRect.top + fromRect.height / 2 + startYOffset;
    const toX = toRect.left - containerRect.left + toRect.width / 2 + endXOffset;
    const toY = toRect.top - containerRect.top + toRect.height / 2 + endYOffset;

    return { fromX, fromY, toX, toY };
  }, [containerRef, fromRef, toRef, startXOffset, startYOffset, endXOffset, endYOffset]);

  const updatePath = useCallback(() => {
    const coords = getCoordinates();
    if (!coords) return;

    const { fromX, fromY, toX, toY } = coords;
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;

    const dx = toX - fromX;
    const dy = toY - fromY;

    const perpX = -dy;
    const perpY = dx;
    const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
    const normPerpX = perpLen > 0 ? perpX / perpLen : 0;
    const normPerpY = perpLen > 0 ? perpY / perpLen : 0;

    const curvatureOffset = curvature * Math.sqrt(dx * dx + dy * dy) * 0.5;
    const cp1x = midX + normPerpX * curvatureOffset;
    const cp1y = midY + normPerpY * curvatureOffset;

    const path = `M ${fromX} ${fromY} Q ${cp1x} ${cp1y} ${toX} ${toY}`;
    setPathD(path);

    const maxDim = Math.max(
      Math.abs(fromX) + Math.abs(toX),
      Math.abs(fromY) + Math.abs(toY)
    );
    setSvgDimensions({
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    });
  }, [getCoordinates, curvature]);

  useEffect(() => {
    updatePath();
    const resizeObserver = new ResizeObserver(updatePath);
    if (containerRef?.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [updatePath, containerRef]);

  useEffect(() => {
    let animationFrame;
    let startTime = null;
    let totalDelay = 0;
    let shouldAnimate = true;

    const animate = (timestamp) => {
      if (!shouldAnimate) return;

      if (startTime === null) {
        startTime = timestamp;
        totalDelay = delay;
      }

      const elapsed = timestamp - startTime;

      if (elapsed < totalDelay) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const adjustedElapsed = elapsed - totalDelay;
      const cycleDuration = duration * 1000;
      const cycleElapsed = adjustedElapsed % (cycleDuration + repeatDelay * 1000);

      let p;
      if (cycleElapsed < cycleDuration) {
        p = cycleElapsed / cycleDuration;
        if (reverse) p = 1 - p;
      } else {
        p = reverse ? 0 : 1;
      }

      setProgress(p);
      animationFrame = requestAnimationFrame(animate);
    };

    if (repeat !== 0) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      shouldAnimate = false;
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [delay, duration, repeat, repeatDelay, reverse]);

  if (!pathD) return null;

  const pathLength = pathRef.current?.getTotalLength?.() || 0;

  return (
    <svg
      className={cn("pointer-events-none absolute top-0 left-0", className)}
      width={svgDimensions.width}
      height={svgDimensions.height}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
      style={{ overflow: "visible" }}
    >
      <path
        d={pathD}
        fill="none"
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
      />
      <motion.path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={`url(#gradient-${delay})`}
        strokeWidth={pathWidth * 2}
        strokeLinecap="round"
        style={{
          pathLength: 1,
          offsetDistance: `${progress * 100}%`,
        }}
      />
      <defs>
        <linearGradient
          id={`gradient-${delay}`}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0" />
          <stop offset="50%" stopColor={gradientStartColor} stopOpacity="1" />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
