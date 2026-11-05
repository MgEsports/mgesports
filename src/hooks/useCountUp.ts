import { useState, useEffect } from "react";

export function useCountUp(target: number, duration = 1500, startWhen = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startWhen) return;

    const startTime = performance.now();

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeProgress * target);

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(target);
      }
    };

    const frameId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration, startWhen]);

  return count;
}
