import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../lib/motion";

/**
 * Wraps content and applies a cinematic fade-in + slide-up animation when it scrolls into view.
 * Animation: opacity 0→1, translateY(30px)→0, scale(0.97)→1, blur(4px)→blur(0)
 * Uses IntersectionObserver with 15% threshold and -80px bottom rootMargin.
 * Supports stagger delay via CSS custom property --stagger-index.
 * Respects prefers-reduced-motion.
 */
export default function FadeInSection({ children, className = "", as: Tag = "section", index = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Set stagger index for CSS delay calculation
    el.style.setProperty("--stagger-index", index);

    if (prefersReducedMotion()) {
      el.classList.add("is-visible");
      return;
    }

    const options = {
      root: null,
      rootMargin: "0px 0px -80px 0px",
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
  }, [index]);

  return (
    <Tag ref={ref} className={`fade-in-section ${className}`.trim()}>
      {children}
    </Tag>
  );
}
