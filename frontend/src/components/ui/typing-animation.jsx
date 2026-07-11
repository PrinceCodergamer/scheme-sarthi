"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, useInView } from "framer-motion";

export function TypingAnimation({
  children,
  words = [],
  className,
  duration = 100,
  typeSpeed,
  deleteSpeed,
  delay = 0,
  pauseDelay = 1000,
  loop = false,
  as: Component = "span",
  startOnView = true,
  showCursor = true,
  blinkCursor = true,
  cursorStyle = "line",
}) {
  const displayWords = words.length > 0 ? words : [children || ""];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [show, setShow] = useState(!startOnView);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const typeSpeedMs = typeSpeed || duration;
  const deleteSpeedMs = deleteSpeed || duration / 2;

  useEffect(() => {
    if (startOnView && inView) {
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }
  }, [startOnView, inView, delay]);

  const handleTyping = useCallback(() => {
    if (!show) return;
    const currentWord = displayWords[currentWordIndex];

    if (isWaiting) return;

    if (!isDeleting) {
      if (currentText.length < currentWord.length) {
        setCurrentText(currentWord.slice(0, currentText.length + 1));
      } else {
        if (displayWords.length > 1 || loop) {
          setIsWaiting(true);
          setTimeout(() => {
            setIsDeleting(true);
            setIsWaiting(false);
          }, pauseDelay);
        }
      }
    } else {
      if (currentText.length > 0) {
        setCurrentText(currentText.slice(0, -1));
      } else {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => {
          if (prev + 1 >= displayWords.length) {
            return loop ? 0 : prev;
          }
          return prev + 1;
        });
      }
    }
  }, [
    show,
    displayWords,
    currentWordIndex,
    currentText,
    isDeleting,
    isWaiting,
    pauseDelay,
    loop,
  ]);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(
      handleTyping,
      isDeleting ? deleteSpeedMs : typeSpeedMs
    );
    return () => clearTimeout(timer);
  }, [handleTyping, isDeleting, deleteSpeedMs, typeSpeedMs, show]);

  const Tag = motion[Component] || motion.span;

  return (
    <Tag ref={ref} className={cn("inline", className)}>
      {currentText}
      {showCursor && (
        <Cursor blink={blinkCursor} cursorStyle={cursorStyle} />
      )}
    </Tag>
  );
}

function Cursor({ blink, cursorStyle }) {
  const cursorMap = {
    line: "|",
    underscore: "_",
    block: "\u2588",
    circle: "\u25CB",
    dot: "\u2022",
  };

  return (
    <span
      className={cn(
        "inline-block ml-0.5 text-current",
        blink && "animate-blink"
      )}
      style={{
        animation: blink ? "blink 1s step-end infinite" : undefined,
      }}
    >
      {cursorMap[cursorStyle] || cursorStyle}
    </span>
  );
}
