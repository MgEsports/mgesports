import { useEffect } from "react";
import { useMotionValue, useSpring } from "framer-motion";

export function useMouseParallax(sensitivity = 15) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 180, mass: 0.5 };
  const x = useSpring(rawX, springConfig);
  const y = useSpring(rawY, springConfig);

  useEffect(() => {
    const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    if (isTouch) return;

    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window;
        const normX = ((e.clientX / innerWidth) - 0.5) * sensitivity;
        const normY = ((e.clientY / innerHeight) - 0.5) * sensitivity;
        rawX.set(normX);
        rawY.set(normY);
        rafId = null;
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [sensitivity, rawX, rawY]);

  return { x, y };
}
