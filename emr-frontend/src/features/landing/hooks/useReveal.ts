import { useEffect, useRef, useState } from "react";

/**
 * Reveals an element with a fade-up animation the first time it scrolls
 * into view. Returns a ref to attach and a boolean visibility flag.
 */
export const useReveal = <T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit,
) => {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px", ...options },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
};
