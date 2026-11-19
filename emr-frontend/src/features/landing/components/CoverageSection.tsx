import { EnvironmentOutlined } from "@ant-design/icons";
import { StatsGrid } from "./StatsGrid";
import { CoverageMap } from "./CoverageMap";
import { Reveal } from "./Reveal";

export const CoverageSection = () => (
  <section
    id="coverage"
    className="landing-anchor relative overflow-hidden"
    style={{
      background:
        "linear-gradient(135deg, var(--color-green-custom) 0%, #0a5d34 55%, #0e7a45 100%)",
    }}
  >
    <div
      className="absolute inset-0 opacity-20 pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.25) 1px, transparent 1px), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.15) 1px, transparent 1px)",
        backgroundSize: "30px 30px, 46px 46px",
      }}
    />
    <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
      <Reveal variant="left">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white bg-white/15 border border-white/25 px-3 py-1.5 rounded-full">
          <EnvironmentOutlined /> Provincial Coverage
        </span>
        <h2 className="mt-6 text-3xl lg:text-[2.75rem] font-bold tracking-tight text-white leading-[1.1]">
          Live across every corner of Sindh.
        </h2>
        <p className="mt-4 text-base lg:text-lg text-white/80 max-w-lg leading-relaxed">
          From Karachi to Kashmore, EMR Sindh connects primary 
          facilities into one continuous record — so care follows the patient,
          wherever they are in the province.
        </p>

        <StatsGrid variant="coverage" />
      </Reveal>

      <Reveal variant="scale" delay={120} className="relative">
        <div className="absolute inset-0 -m-6 rounded-full bg-white/5 blur-2xl" />
        <div className="relative mx-auto max-w-sm lg:max-w-md">
          <CoverageMap />
        </div>
      </Reveal>
    </div>
  </section>
);
