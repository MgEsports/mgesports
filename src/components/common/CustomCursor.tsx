import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export const CustomCursor = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch] = useState(
    () => typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);

  // Smooth outer ring springs
  const ringX = useSpring(rawX, { damping: 28, stiffness: 350, mass: 0.4 });
  const ringY = useSpring(rawY, { damping: 28, stiffness: 350, mass: 0.4 });

  // Tight center dot springs
  const dotX = useSpring(rawX, { damping: 40, stiffness: 800 });
  const dotY = useSpring(rawY, { damping: 40, stiffness: 800 });

  const isHoveredRef = useRef(false);

  useEffect(() => {
    if (isTouch) return;

    let rafId: number | null = null;
    let hasShown = false;

    const handleMouseMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);

      if (!hasShown) {
        hasShown = true;
        setIsVisible(true);
      }

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          const target = e.target as HTMLElement | null;
          if (target) {
            const interactive = Boolean(
              target.closest("button, a, input, [role='button'], .cursor-pointer, .interactive-hover, .gold-glow-card")
            );
            if (interactive !== isHoveredRef.current) {
              isHoveredRef.current = interactive;
              setIsHovered(interactive);
            }
          }
          rafId = null;
        });
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isTouch, rawX, rawY]);

  if (isTouch || !isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Outer subtle follower ring — GPU accelerated transform without layout reflow */}
      <motion.div
        className="fixed top-0 left-0 h-7 w-7 rounded-full border border-[#FFBE32]/60 bg-[#FFBE32]/10 backdrop-blur-[1px]"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovered ? 1.6 : 1,
        }}
        transition={{
          type: "spring",
          damping: 28,
          stiffness: 350,
          mass: 0.4,
        }}
      />
      {/* Center pinpoint dot */}
      <motion.div
        className="fixed top-0 left-0 h-1.5 w-1.5 rounded-full bg-[#FFBE32] shadow-[0_0_8px_#FFBE32]"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovered ? 0.5 : 1,
        }}
        transition={{
          type: "spring",
          damping: 40,
          stiffness: 800,
        }}
      />
    </div>
  );
};
