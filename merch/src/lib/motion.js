/**
 * motion.js — Shared motion constants for the BMSCE merch UI.
 * All animations use transform + opacity only. Respect prefers-reduced-motion
 * via CSS tokens (--dur-*) which collapse to 0ms under reduced-motion.
 */

export const durations = {
  micro: 100,
  short: 180,
  medium: 300,
  long: 500,
};

export const easings = {
  micro: 'ease-out',
  standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export const spring = { type: 'spring', stiffness: 700, damping: 30 };

export const cardHover = {
  transform: 'translateY(-6px) scale(1.01)',
  boxShadow: '0 20px 50px rgba(15, 23, 42, 0.12)',
};

export const cardRest = {
  transform: 'translateY(0) scale(1)',
  boxShadow: '0 12px 34px rgba(15, 23, 42, 0.05)',
};

export const pageEnter = {
  from: { opacity: 0, transform: 'translateY(12px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
};

export const pageExit = {
  from: { opacity: 1, transform: 'translateY(0)' },
  to: { opacity: 0, transform: 'translateY(-8px)' },
};

/** Check if reduced motion is preferred at runtime */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animate an element from→to using Web Animations API.
 * Returns the Animation object (cancel-safe).
 */
export function animate(el, keyframes, opts = {}) {
  if (!el || prefersReducedMotion()) {
    if (keyframes.length > 0) {
      const last = keyframes[keyframes.length - 1];
      Object.assign(el.style, last);
    }
    return null;
  }
  const duration = opts.duration ?? durations.medium;
  const easing = opts.easing ?? easings.standard;
  return el.animate(keyframes, { duration, easing, fill: 'forwards', ...opts });
}
