import { ReactNode } from "react";

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--color-green-custom)]">
    {children}
  </span>
);
