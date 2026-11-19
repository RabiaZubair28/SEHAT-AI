import { Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { StatsGrid } from "./StatsGrid";
import { HeroDashboardMock } from "./HeroDashboardMock";

export const Hero = ({ onLogin }: { onLogin: () => void }) => (
  <section
    className="relative overflow-hidden"
    style={{
      background:
        "radial-gradient(1200px 600px at 90% -10%, rgba(6,69,38,0.12), transparent 60%), radial-gradient(900px 500px at -10% 110%, rgba(6,69,38,0.10), transparent 60%), linear-gradient(180deg, #ffffff 0%, #f6faf7 100%)",
    }}
  >
    <div
      className="absolute inset-0 opacity-[0.35] pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(6,69,38,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(6,69,38,0.07) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, black 40%, transparent 75%)",
      }}
    />

    <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-14 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
      <div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[var(--color-green-custom)] bg-white/70 border border-[var(--green-200)] px-3.5 py-1.5 rounded-full shadow-[var(--shadow-green-sm)] backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-green-custom)] opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-green-custom)]" />
          </span>
          Government of Sindh — Health Department
        </span>
        <h1 className="mt-6 text-[2.5rem] sm:text-5xl lg:text-[3.75rem] font-bold leading-[1.05] tracking-tight text-[var(--color-text-custom)]">
          <span
            style={{
              background:
                "linear-gradient(120deg, var(--color-green-custom) 0%, #0e7a45 60%, #17a05c 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            The Electronic Medical Record
          </span>
          <span className="block mt-2">built for Sindh's frontline care.</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-xl leading-relaxed">
          A unified clinical platform connecting patient registration,
          outpatient care, immunization, family planning and inventory —
          across every facility in the province.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button
            type="primary"
            size="large"
            onClick={onLogin}
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            style={{
              background: "var(--color-green-custom)",
              borderColor: "var(--color-green-custom)",
              fontWeight: 500,
              boxShadow: "0 14px 30px -12px rgba(6,69,38,0.55)",
              height: 54,
              paddingInline: 32,
              fontSize: 16,
            }}
          >
            Login to EMR
          </Button>
          <a
            href="#features"
            className="group inline-flex items-center gap-2 text-[var(--color-green-custom)] font-semibold transition-all"
          >
            Explore modules
            <span className="inline-flex w-8 h-8 items-center justify-center rounded-full border border-[var(--color-green-custom)]/30 bg-white group-hover:bg-[var(--color-green-custom)] group-hover:text-white group-hover:border-[var(--color-green-custom)] transition">
              <ArrowRightOutlined />
            </span>
          </a>
        </div>

        <StatsGrid variant="hero" />
      </div>

      <HeroDashboardMock />
    </div>
  </section>
);
