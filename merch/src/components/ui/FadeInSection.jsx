import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../lib/motion";

/**
 * Wraps content and applies a slow fade-in + slide-up animation when it scrolls into view.
 * Uses Intersection Observer with 15% visibility threshold.
 * Respects prefers-reduced-motion.
 */
export default function FadeInSection({ children, className = "", as: Tag = "section" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.classList.add("is-visible");
      return;
    }

    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.15,
    };

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, options);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`fade-in-section ${className}`.trim()}>
      {children}
    </Tag>
  );
}
