import { stats, Stat } from "../data/stats";
import { useReveal } from "../hooks/useReveal";
import { useCountUp } from "../hooks/useCountUp";

const VARIANT_STYLES = {
  hero: {
    wrapper: "mt-10 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 max-w-2xl",
    value:
      "text-2xl lg:text-3xl font-bold text-[var(--color-green-custom)] tracking-tight",
    label: "text-[11px] uppercase tracking-[0.12em] text-gray-500 mt-1 leading-tight",
  },
  coverage: {
    wrapper: "mt-10 grid grid-cols-2 gap-x-8 gap-y-7 max-w-md",
    value: "text-3xl lg:text-4xl font-bold tracking-tight text-white",
    label: "mt-1.5 text-sm text-white/70",
  },
} as const;

const StatValue = ({
  stat,
  start,
  className,
}: {
  stat: Stat;
  start: boolean;
  className: string;
}) => {
  const counted = useCountUp(stat.to ?? 0, start);
  if (stat.display) return <div className={className}>{stat.display}</div>;
  return (
    <div className={className}>
      {counted}
      {stat.suffix}
    </div>
  );
};

export const StatsGrid = ({ variant }: { variant: keyof typeof VARIANT_STYLES }) => {
  const styles = VARIANT_STYLES[variant];
  const { ref, isVisible } = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className={styles.wrapper}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={
            variant === "hero" && i !== 0
              ? "relative sm:pl-6 sm:before:absolute sm:before:left-0 sm:before:top-1 sm:before:bottom-1 sm:before:w-px sm:before:bg-gray-200"
              : "relative"
          }
        >
          <StatValue stat={s} start={isVisible} className={styles.value} />
          <div className={styles.label}>{s.label}</div>
        </div>
      ))}
    </div>
  );
};
