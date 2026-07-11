import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

function TracingBeam({ children, className }) {
  const ref = useRef(null);
  const contentRef = useRef(null);
  const [svgHeight, setSvgHeight] = useState(0);
  const [pageScrollable, setPageScrollable] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const y1 = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, svgHeight - 200]),
    { stiffness: 500, damping: 90 }
  );
  const y2 = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, svgHeight - 200]),
    { stiffness: 500, damping: 90 }
  );

  useEffect(() => {
    if (contentRef.current) {
      setSvgHeight(contentRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    const checkScrollable = () => {
      setPageScrollable(
        document.documentElement.scrollHeight > window.innerHeight
      );
    };
    checkScrollable();
    window.addEventListener("resize", checkScrollable);
    return () => window.removeEventListener("resize", checkScrollable);
  }, []);

  if (!pageScrollable) {
    return <div className={cn("relative", className)}>{children}</div>;
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div className="absolute left-0 top-0">
        <svg
          viewBox={`0 0 20 ${svgHeight}`}
          width="20"
          height={svgHeight}
          className="ml-4 block"
        >
          <motion.path
            d={`M 1 0 V ${svgHeight}`}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="1.5"
          />
          <defs>
            <motion.linearGradient
              id="gradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1={y1}
              y2={y2}
            >
              <stop offset="0%" stopColor="#18CCFC" stopOpacity="0" />
              <stop offset="25%" stopColor="#18CCFC" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#6344F5" stopOpacity="0.8" />
              <stop offset="75%" stopColor="#AE48FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#AE48FF" stopOpacity="0" />
            </motion.linearGradient>
          </defs>
        </svg>
      </div>
      <div ref={contentRef} className="ml-12">
        {children}
      </div>
    </div>
  );
}

export { TracingBeam };
