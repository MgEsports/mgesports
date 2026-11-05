import { useState, useEffect } from "react";

export function useScrollPosition(threshold = 50) {
  const [isScrolled, setIsScrolled] = useState(() => 
    typeof window !== "undefined" ? window.scrollY > threshold : false
  );

  useEffect(() => {
    let ticking = false;
    let lastScrolled = window.scrollY > threshold;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrolled = window.scrollY > threshold;
          if (currentScrolled !== lastScrolled) {
            lastScrolled = currentScrolled;
            setIsScrolled(currentScrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return { isScrolled };
}
