import { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

/** Direction/style the element animates in from as it scrolls into view. */
export type RevealVariant = "up" | "left" | "right" | "scale" | "blur";

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in ms for sequenced reveals. */
  delay?: number;
  /** How the element enters. Defaults to a fade-up. */
  variant?: RevealVariant;
  className?: string;
}

export const Reveal = ({
  children,
  delay = 0,
  variant = "up",
  className = "",
}: RevealProps) => {
  const { ref, isVisible } = useReveal();

  return (
    <div
      ref={ref}
      className={`reveal reveal--${variant} ${
        isVisible ? "is-visible" : ""
      } ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
};
