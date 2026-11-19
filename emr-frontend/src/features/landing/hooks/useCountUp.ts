import { useEffect, useState } from "react";

/**
 * Counts a number up from 0 to `to` (once `start` becomes true) using an
 * eased requestAnimationFrame loop. Pair with useReveal so the count only
 * runs when the stat scrolls into view.
 */
export const useCountUp = (to: number, start: boolean, duration = 1500) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    let raf = 0;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(eased * to));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, start, duration]);

  return value;
};
