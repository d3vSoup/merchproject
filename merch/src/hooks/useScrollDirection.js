import { useState, useEffect, useRef } from "react";

export function useScrollDirection({ threshold = 10 } = {}) {
  const [direction, setDirection] = useState("up");
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      setAtTop(y < 10);
      if (Math.abs(y - lastY.current) >= threshold) {
        setDirection(y > lastY.current ? "down" : "up");
        lastY.current = y;
      }
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(update);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { direction, atTop };
}
