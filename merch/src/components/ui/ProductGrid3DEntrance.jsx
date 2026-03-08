import React, { useRef, useEffect, useState, Children, useMemo } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

const STAGGER_MS = 20;

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function AnimatedCard({ children, index, scrollProgress, disabled }) {
  const delay = index * STAGGER_MS / 1000;

  const rotateX = useTransform(scrollProgress, [0, 0.2], [60, 0]);
  const translateY = useTransform(scrollProgress, [0, 0.2], [120, 0]);
  const scale = useTransform(scrollProgress, [0, 0.2], [0.92, 1]);
  const opacity = useTransform(scrollProgress, [0, 0.15], [0.6, 1]);
  const shadow = useTransform(
    scrollProgress,
    [0, 0.2],
    ["0 40px 60px rgba(0,0,0,0.25)", "0 12px 34px rgba(15,23,42,0.05)"]
  );

  if (disabled) return children;

  return (
    <motion.div
      style={{
        rotateX,
        y: translateY,
        scale,
        opacity,
        boxShadow: shadow,
        willChange: "transform, opacity",
        transformOrigin: "center bottom",
      }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export default function ProductGrid3DEntrance({ children, className = "product-grid" }) {
  const reduced = useReducedMotion();
  const containerRef = useRef(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "start 0.6"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v >= 0.2 && !hasPlayed) setHasPlayed(true);
  });

  const items = useMemo(() => Children.toArray(children), [children]);
  const disabled = reduced || hasPlayed;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        perspective: disabled ? undefined : "1200px",
        transformStyle: disabled ? undefined : "preserve-3d",
      }}
    >
      {items.map((child, i) => (
        <AnimatedCard
          key={child.key ?? i}
          index={i}
          scrollProgress={scrollYProgress}
          disabled={disabled}
        >
          {child}
        </AnimatedCard>
      ))}
    </div>
  );
}
