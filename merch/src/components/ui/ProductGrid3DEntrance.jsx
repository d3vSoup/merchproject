// merch/src/components/ui/ProductGrid3DEntrance.jsx
import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

const STAGGER_MS = 80;

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

function AnimatedCard({ children, index = 0, progress, disabled }) {
  const idx = index;
  const start = Math.min(0.2 + idx * 0.04, 0.6);
  const end = Math.min(start + 0.45, 1);

  const rotateX = useTransform(progress, [0, start, end, 1], [70, 40, 0, 0], { clamp: true });
  const translateY = useTransform(progress, [0, start, end, 1], [80, 40, 0, 0], { clamp: true });
  const scale = useTransform(progress, [0, start, end, 1], [0.92, 0.96, 1, 1], { clamp: true });
  const opacity = useTransform(progress, [0, start + 0.05, end], [0.6, 0.9, 1]);

  if (disabled) return <div style={{ pointerEvents: "auto" }}>{children}</div>;

  return (
    <motion.div
      style={{
        rotateX,
        y: translateY,
        scale,
        opacity,
        transformStyle: "preserve-3d",
        willChange: "transform, opacity",
        pointerEvents: "auto",
      }}
      className="product-card-3d-wrapper"
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
    >
      {children}
    </motion.div>
  );
}

export default function ProductGrid3DEntrance({ children, className = "product-grid" }) {
  const containerRef = useRef(null);
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div ref={containerRef} className={className}>
        {children}
      </div>
    );
  }

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const progress = useTransform(scrollYProgress, [0, 0.2, 0.7, 1], [0, 0.15, 0.9, 1], { clamp: true });

  useMotionValueEvent(progress, "change", (v) => {
    // Debug: uncomment to verify progress fires
    // console.log("3D progress:", v?.toFixed?.(3) ?? v);
  });

  const items = useMemo(() => React.Children.toArray(children), [children]);

  return (
    <div
      ref={containerRef}
      className="product-grid-3d-entrance"
      style={{
        perspective: 1200,
        transformStyle: "preserve-3d",
        pointerEvents: "auto",
      }}
    >
      <div className={className} style={{ transformStyle: "preserve-3d" }}>
        {items.map((child, i) => (
          <AnimatedCard key={child.key ?? i} index={i} progress={progress} disabled={false}>
            {child}
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}
