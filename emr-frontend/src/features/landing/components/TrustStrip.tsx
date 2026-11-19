import { trustChips } from "../data/trustChips";

// Repeated enough times that one copy is always wider than the viewport —
// keep in sync with the `-100% / 8` loop distance in index.css.
const REPEAT = 8;
const belt = Array.from({ length: REPEAT }, () => trustChips).flat();

export const TrustStrip = () => (
  <section className="landing-marquee relative border-y border-gray-100 bg-white py-5">
    {/* Soft fades so chips slide in/out at the edges instead of popping */}
    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />

    <div className="landing-marquee-track">
      {belt.map((c, i) => (
        <div
          key={`${c.label}-${i}`}
          aria-hidden={i >= trustChips.length}
          className="flex items-center gap-2 whitespace-nowrap px-8 text-sm text-gray-600"
        >
          <span className="text-[var(--color-green-custom)] text-base">
            {c.icon}
          </span>
          <span className="font-medium">{c.label}</span>
        </div>
      ))}
    </div>
  </section>
);
