// merch/src/components/ui/ProductGrid3DEntrance.jsx
import React, { useRef, useEffect, useState, Children, useMemo } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

const STAGGER_MS = 30;

function usePrefersReducedMotion() {
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

function AnimatedCard({ children, index, progress, disabled }) {
  const delay = (index * STAGGER_MS) / 1000;

  const rotateX = useTransform(progress, [0, 1], [60, 0]);
  const translateY = useTransform(progress, [0, 1], [120, 0]);
  const scale = useTransform(progress, [0, 1], [0.92, 1]);
  const opacity = useTransform(progress, [0, 1], [0.6, 1]);
  const shadow = useTransform(progress, [0, 1], [
    "0 40px 60px rgba(0,0,0,0.25)",
    "0 12px 34px rgba(15,23,42,0.05)",
  ]);

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
        transformStyle: "preserve-3d",
      }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export default function ProductGrid3DEntrance({ children, className = "product-grid" }) {
  const containerRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [hasPlayed, setHasPlayed] = useState(false);
  const items = useMemo(() => Children.toArray(children), [children]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.9", "start 0.2"],
  });

  const progress = useTransform(scrollYProgress, [0, 1], [0, 1], { clamp: true });

  useMotionValueEvent(progress, "change", (v) => {
    // Debug: uncomment to verify progress fires
    // console.log("ProductGrid3DEntrance progress:", v?.toFixed?.(3) ?? v);
    if (v >= 0.98 && !hasPlayed) setHasPlayed(true);
  });

  const disabled = reduced || hasPlayed;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        perspective: disabled ? undefined : 1200,
        transformStyle: disabled ? undefined : "preserve-3d",
        overflow: "visible",
      }}
    >
      {items.map((child, i) => (
        <AnimatedCard
          key={child.key ?? i}
          index={i}
          progress={progress}
          disabled={disabled}
        >
          {child}
        </AnimatedCard>
      ))}
    </div>
  );
}
