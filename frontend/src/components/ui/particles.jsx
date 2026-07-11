"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState, useCallback } from "react";

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

function rotateVelocity(vx, vy, angle) {
  const rotatedVx = vx * Math.cos(angle) - vy * Math.sin(angle);
  const rotatedVy = vx * Math.sin(angle) + vy * Math.cos(angle);
  return { vx: rotatedVx, vy: rotatedVy };
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export const Particles = React.memo(
  ({
    className = "",
    quantity = 100,
    staticity = 50,
    ease = 50,
    size = 0.4,
    color = "#ffffff",
    vx = 0,
    vy = 0,
    refresh = false,
  }) => {
    const canvasRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const context = useRef(null);
    const circles = useRef([]);
    const mousePosition = useRef({ x: 0, y: 0 });
    const mouse = useRef({ x: 0, y: 0 });
    const canvasSize = useRef({ w: 0, h: 0 });
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    const rafID = useRef(null);

    const rgbColor = useCallback(() => hexToRgb(color), [color]);

    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;

    const circleParams = useCallback(() => {
      return {
        x: Math.random() * canvasSize.current.w,
        y: Math.random() * canvasSize.current.h,
        translateX: 0,
        translateY: 0,
        size: Math.random() * 2 + size,
        alpha: 0,
        targetAlpha: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
        dx: (Math.random() - 0.5) * 0.1,
        dy: (Math.random() - 0.5) * 0.1,
        magnetism: 0.1 + Math.random() * 4,
      };
    }, [size]);

    const drawCircle = (circle, i) => {
      const { r, g, b } = rgbColor();
      if (!context.current) return;
      context.current.save();
      context.current.beginPath();
      context.current.translate(
        circle.x + circle.translateX,
        circle.y + circle.translateY
      );
      context.current.arc(0, 0, circle.size, 0, Math.PI * 2);
      context.current.fillStyle = `rgba(${r}, ${g}, ${b}, ${circle.alpha})`;
      context.current.fill();
      context.current.restore();
    };

    const clearContext = () => {
      if (!context.current) return;
      context.current.clearRect(
        0,
        0,
        canvasSize.current.w,
        canvasSize.current.h
      );
    };

    const drawParticles = useCallback(() => {
      clearContext();
      const count = circles.current.length;
      for (let i = 0; i < count; i++) {
        const circle = circles.current[i];
        circle.x += circle.dx + vx;
        circle.y += circle.dy + vy;
        circle.translateX +=
          (mouse.current.x / (staticity - circle.magnetism)) * 0.01;
        circle.translateY +=
          (mouse.current.y / (staticity - circle.magnetism)) * 0.01;

        if (
          circle.x < -circle.size ||
          circle.x > canvasSize.current.w + circle.size ||
          circle.y < -circle.size ||
          circle.y > canvasSize.current.h + circle.size
        ) {
          circles.current[i] = { ...circleParams(), ...circle };
        }

        const dx = mouse.current.x / (staticity - circle.magnetism);
        const dy = mouse.current.y / (staticity - circle.magnetism);
        const angle = Math.atan2(dy, dx);
        const targetTranslateX = dx * easeOutCubic((ease * 0.01) / 2);
        const targetTranslateY = dy * easeOutCubic((ease * 0.01) / 2);

        circle.translateX += (targetTranslateX - circle.translateX) / ease;
        circle.translateY += (targetTranslateY - circle.translateY) / ease;

        if (circle.alpha < circle.targetAlpha) {
          circle.alpha += 0.02;
        } else {
          circle.alpha -= 0.02;
        }

        drawCircle(circle, i);
      }
      rafID.current = window.requestAnimationFrame(drawParticles);
    }, [circleParams, clearContext, drawCircle, ease, rgbColor, staticity, size, vx, vy]);

    const initCanvas = useCallback(() => {
      if (!canvasContainerRef.current || !canvasRef.current) return;
      const container = canvasContainerRef.current;
      const canvas = canvasRef.current;
      canvasSize.current.w = container.offsetWidth;
      canvasSize.current.h = container.offsetHeight;
      canvas.width = canvasSize.current.w * dpr;
      canvas.height = canvasSize.current.h * dpr;
      canvas.style.width = `${canvasSize.current.w}px`;
      canvas.style.height = `${canvasSize.current.h}px`;
      context.current = canvas.getContext("2d");
      context.current.scale(dpr, dpr);

      circles.current = [];
      for (let i = 0; i < quantity; i++) {
        circles.current.push(circleParams());
      }
    }, [quantity, circleParams, dpr]);

    const onMouseMove = useCallback(
      (e) => {
        if (!canvasContainerRef.current) return;
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const { w, h } = canvasSize.current;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const inside = x < w && x > 0 && y < h && y > 0;
        if (inside) {
          mousePosition.current.x = x;
          mousePosition.current.y = y;
          mouse.current.x = x - w / 2;
          mouse.current.y = y - h / 2;
        }
      },
      []
    );

    const onMouseLeave = useCallback(() => {
      mouse.current.x = 0;
      mouse.current.y = 0;
    }, []);

    useEffect(() => {
      initCanvas();
      rafID.current = window.requestAnimationFrame(drawParticles);

      const resizeHandler = () => {
        initCanvas();
      };
      window.addEventListener("resize", resizeHandler);

      return () => {
        if (rafID.current) {
          window.cancelAnimationFrame(rafID.current);
        }
        window.removeEventListener("resize", resizeHandler);
      };
    }, [initCanvas, drawParticles]);

    useEffect(() => {
      onMouseMove({ clientX: mousePosition.current.x, clientY: mousePosition.current.y });
    }, [refresh, onMouseMove]);

    return (
      <div
        ref={canvasContainerRef}
        className={cn("relative", className)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
    );
  }
);

Particles.displayName = "Particles";
